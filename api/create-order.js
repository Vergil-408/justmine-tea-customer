// POST /api/create-order
// Satu-satunya pintu pembuatan order. Browser hanya mengirim: id menu, jumlah, id pilihan,
// nomor meja, metode bayar, dan clientRequestId. Harga dihitung ulang di sini.
import { getAdmin } from './_lib/admin.js'
import { OrderError, priceCart } from './_lib/pricing.js'
import { createOrderTx, jakartaDateKey } from './_lib/orders.js'
import { chargeQris, extractQrUrl, parseMidtransTime } from './_lib/midtrans.js'
import { normalizeTable } from '../src/utils/table.js'
import { seedMenuItems } from '../src/data/menuData.js'
import { seedOptionGroups } from '../src/data/optionGroupsData.js'

const METHODS = { qris: 'QRIS', kasir: 'Bayar di Kasir' }
const REQUEST_ID = /^[A-Za-z0-9_-]{8,64}$/

// Sama seperti Customer App: kalau koleksi Firestore kosong, pakai data contoh.
async function loadCatalog(db) {
  const [menuSnap, groupSnap] = await Promise.all([db.collection('menuItems').get(), db.collection('optionGroups').get()])
  const menu = menuSnap.empty ? seedMenuItems : menuSnap.docs.map((d) => ({ ...d.data(), id: d.id }))
  const groupsRaw = groupSnap.empty ? seedOptionGroups : groupSnap.docs.map((d) => ({ ...d.data(), id: d.id }))
  return {
    menuById: new Map(menu.map((m) => [m.id, m])),
    groups: groupsRaw.filter((g) => g.active !== false),
  }
}

// Meminta QRIS ke Midtrans bila belum ada. Gagal -> order dibatalkan dan kunci anti-dobel dilepas
// supaya pelanggan bisa mencoba lagi dengan permintaan yang sama.
async function ensurePayment({ db, FieldValue }, orderId, order, clientRequestId) {
  if (order.paymentMethod !== METHODS.qris || order.payment) return order

  let charge
  try {
    charge = await chargeQris({ orderId, grossAmount: order.total })
  } catch (err) {
    console.error('Charge QRIS gagal:', err.message, err.data)
    await db.collection('orders').doc(orderId).update({ paymentStatus: 'gagal', status: 'dibatalkan' })
    await db.collection('orderRequests').doc(clientRequestId).delete()
    throw new OrderError('Pembayaran QRIS belum bisa dibuat. Coba lagi sebentar.', 502)
  }

  const payment = {
    provider: 'midtrans',
    environment: 'sandbox',
    midtransOrderId: orderId,
    transactionId: charge.transaction_id || null,
    qrUrl: extractQrUrl(charge),
    expiresAt: parseMidtransTime(charge.expiry_time, Date.now() + 15 * 60 * 1000),
    transactionStatus: charge.transaction_status || 'pending',
  }
  if (!payment.qrUrl) console.error('Respons charge tanpa URL QR:', JSON.stringify(charge))
  await db.collection('orders').doc(orderId).update({ payment })
  return { ...order, payment }
}

function respond(order, orderId) {
  return {
    orderId,
    orderCode: order.orderCode,
    total: order.total,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    qrUrl: order.payment?.qrUrl || null,
    expiresAt: order.payment?.expiresAt || null,
    sandbox: true,
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method tidak diizinkan.' })

  try {
    const admin = getAdmin()
    const { db, auth, FieldValue } = admin
    const body = req.body && typeof req.body === 'object' ? req.body : {}

    const rawSessionId = typeof body.tableSessionId === 'string' ? body.tableSessionId.trim() : ''
    const hasTableInput = body.tableNumber !== undefined && body.tableNumber !== null && String(body.tableNumber).trim() !== ''
    const requestedTable = hasTableInput ? normalizeTable(body.tableNumber) : null

    let tableNumber = null
    let orderType = 'takeaway'
    let validatedSessionId = null

    if (rawSessionId) {
      if (!/^[a-f0-9]{64}$/.test(rawSessionId)) {
        throw new OrderError('Sesi meja tidak valid. Silakan scan ulang QR meja.', 403)
      }
      const sessionSnap = await db.collection('tableSessions').doc(rawSessionId).get()
      if (!sessionSnap.exists) {
        throw new OrderError('Sesi meja tidak ditemukan. Silakan scan ulang QR meja.', 403)
      }
      const session = sessionSnap.data() || {}
      if (session.status !== 'active' || (typeof session.expiresAt === 'number' && session.expiresAt <= Date.now())) {
        throw new OrderError('Sesi meja sudah berakhir atau ditutup. Silakan scan ulang QR meja.', 403)
      }
      // Pastikan token meja masih aktif dan belum diregenerasi oleh admin
      const tableSnap = await db.collection('tables').doc(session.tableNumber).get()
      const tableData = tableSnap.exists ? tableSnap.data() || {} : null
      if (!tableData || tableData.tokenStatus !== 'active' || tableData.tokenHash !== session.tokenHash) {
        throw new OrderError('QR meja sudah tidak aktif atau diperbarui. Silakan scan ulang QR meja.', 403)
      }
      // Tolak jika frontend mencoba memanipulasi nomor meja berbeda dari sesi server
      if (hasTableInput && requestedTable !== session.tableNumber) {
        throw new OrderError('Manipulasi nomor meja ditolak.', 403)
      }
      tableNumber = session.tableNumber
      orderType = 'dine-in'
      validatedSessionId = rawSessionId
    } else if (hasTableInput || body.orderType === 'dine-in') {
      throw new OrderError('Akses Dine-in memerlukan validasi QR meja terlebih dahulu.', 403)
    }

    if (!METHODS[body.paymentMethod]) throw new OrderError('Metode pembayaran tidak valid.')
    const clientRequestId = String(body.clientRequestId || '')
    if (!REQUEST_ID.test(clientRequestId)) throw new OrderError('Permintaan tidak valid.')

    // Member (opsional): identitas dari token Firebase, bukan dari isi body.
    let userId = null
    const authz = req.headers.authorization || ''
    if (authz.startsWith('Bearer ')) {
      try {
        userId = (await auth.verifyIdToken(authz.slice(7))).uid
      } catch {
        throw new OrderError('Sesi login tidak valid. Muat ulang halaman.', 401)
      }
    }

    const { menuById, groups } = await loadCatalog(db)
    const { items, subtotal } = priceCart(body.items, menuById, groups)

    const rawCustomerName = String(body.customerName || '').trim()
    if (rawCustomerName && /\d/.test(rawCustomerName)) {
      throw new OrderError('Nama pemesan tidak boleh mengandung angka.', 400)
    }
    const customerName = rawCustomerName || 'Pelanggan'

    if (body.voucherDiscount !== undefined && body.voucherDiscount !== null) {
      if (typeof body.voucherDiscount === 'string' && /[^\d.]/.test(body.voucherDiscount.trim())) {
        throw new OrderError('Diskon voucher tidak valid (tidak boleh mengandung huruf).', 400)
      }
    }
    const discount = Math.max(0, Number(body.voucherDiscount || 0))
    if (isNaN(discount)) {
      throw new OrderError('Nominal diskon harus berupa angka.', 400)
    }
    const total = Math.max(0, subtotal - discount)
    const pointsEarned = Math.floor(total / 1000)

    const rawFcmToken = typeof body.fcmToken === 'string' ? body.fcmToken.trim() : ''
    const fcmToken = rawFcmToken && rawFcmToken.length <= 512 ? rawFcmToken : null

    const result = await createOrderTx(db, {
      clientRequestId,
      dateKey: jakartaDateKey(),
      serverTimestamp: FieldValue.serverTimestamp(),
      buildOrder: () => ({
        userId,
        fcmToken,
        customerName,
        tableNumber,
        orderType,
        items,
        subtotal,
        discount,
        voucherDiscount: discount,
        voucherName: body.voucherName || null,
        voucherId: body.voucherId || null,
        total,
        pointsEarned,
        paymentMethod: METHODS[body.paymentMethod],
        paymentStatus: 'belum_dibayar',
        status: body.paymentMethod === 'qris' ? 'menunggu_pembayaran' : 'menunggu',
        clientRequestId,
      }),
    })

    const snap = await db.collection('orders').doc(result.orderId).get()
    const order = await ensurePayment(admin, result.orderId, snap.data(), clientRequestId)
    return res.status(result.replay ? 200 : 201).json(respond(order, result.orderId))
  } catch (err) {
    if (err instanceof OrderError) return res.status(err.status).json({ error: err.message })
    console.error('create-order error:', err)
    return res.status(500).json({ error: 'Terjadi kesalahan di server.' })
  }
}
