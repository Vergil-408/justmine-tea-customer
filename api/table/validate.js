// POST /api/table/validate
// Memvalidasi QR Token meja di backend dan membuat/mengembalikan Secure Table Session.
import crypto from 'node:crypto'
import { getAdmin } from '../_lib/admin.js'
import { normalizeTable } from '../../src/utils/table.js'

const SESSION_TTL_MS = 4 * 60 * 60 * 1000 // 4 jam
const RATE_WINDOW_MS = 60 * 1000 // 1 menit
const RATE_MAX_REQ = 30
const rateBuckets = new Map()

function checkRateLimit(ip) {
  const now = Date.now()
  const entry = rateBuckets.get(ip)
  if (!entry || now - entry.start > RATE_WINDOW_MS) {
    rateBuckets.set(ip, { start: now, count: 1 })
    return true
  }
  entry.count += 1
  return entry.count <= RATE_MAX_REQ
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex')
}

function safeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length || a.length === 0) {
    return false
  }
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'))
  } catch {
    return false
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ valid: false, error: 'Method tidak diizinkan.' })
  }

  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
    .split(',')[0]
    .trim()
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ valid: false, error: 'Terlalu banyak percobaan. Coba lagi sebentar.' })
  }

  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {}
    const tableNumber = normalizeTable(body.table)
    const token = typeof body.token === 'string' ? body.token.trim() : ''

    if (!tableNumber || !token || token.length < 16) {
      return res.status(403).json({ valid: false, error: 'QR meja tidak valid.' })
    }

    const { db, FieldValue } = getAdmin()
    const tableSnap = await db.collection('tables').doc(tableNumber).get()

    if (!tableSnap.exists) {
      return res.status(403).json({ valid: false, error: 'QR meja tidak terdaftar atau tidak aktif.' })
    }

    const tableData = tableSnap.data() || {}
    if (tableData.tokenStatus !== 'active' || !tableData.tokenHash) {
      return res.status(403).json({ valid: false, error: 'QR meja sudah dinonaktifkan.' })
    }

    const incomingHash = hashToken(token)
    if (!safeEqualHex(incomingHash, tableData.tokenHash)) {
      return res.status(403).json({ valid: false, error: 'QR meja tidak valid atau sudah diperbarui.' })
    }

    // Cek apakah sudah ada sesi aktif untuk meja + tokenHash yang sama
    const now = Date.now()
    const existingSnap = await db
      .collection('tableSessions')
      .where('tableNumber', '==', tableNumber)
      .where('status', '==', 'active')
      .limit(5)
      .get()

    const reusable = existingSnap.docs.find((d) => {
      const data = d.data() || {}
      return data.tokenHash === incomingHash && typeof data.expiresAt === 'number' && data.expiresAt > now
    })

    if (reusable) {
      await reusable.ref.update({
        lastActivityAt: FieldValue.serverTimestamp(),
        expiresAt: now + SESSION_TTL_MS,
      })
      return res.status(200).json({
        valid: true,
        sessionId: reusable.id,
        tableNumber,
      })
    }

    // Buat sesi baru dengan identifier 256-bit cryptographically secure
    const sessionId = crypto.randomBytes(32).toString('hex')
    await db.collection('tableSessions').doc(sessionId).set({
      tableNumber,
      tokenHash: incomingHash,
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
      lastActivityAt: FieldValue.serverTimestamp(),
      expiresAt: now + SESSION_TTL_MS,
    })

    return res.status(200).json({
      valid: true,
      sessionId,
      tableNumber,
    })
  } catch (err) {
    console.error('Validasi QR meja gagal:', err)
    return res.status(500).json({ valid: false, error: 'Terjadi kesalahan saat memvalidasi meja.' })
  }
}
