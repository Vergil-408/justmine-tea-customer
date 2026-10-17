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

    const tableNumber = normalizeTable(body.tableNumber)
    if (!tableNumber) throw new OrderError('Nomor meja belum ada. Scan QR di mejamu dulu.')
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

    const result = await createOrderTx(db, {
      clientRequestId,
      dateKey: jakartaDateKey(),
      serverTimestamp: FieldValue.serverTimestamp(),
      buildOrder: () => ({
        userId,
        tableNumber,
        items,
        subtotal,
        total: subtotal,
        paymentMethod: METHODS[body.paymentMethod],
        paymentStatus: 'belum_dibayar',
        status: 'menunggu',
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
