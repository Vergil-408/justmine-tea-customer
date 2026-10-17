// Klien Midtrans untuk SANDBOX saja. Host sengaja ditulis tetap (bukan dari env)
// supaya tidak mungkin tersambung ke produksi secara tidak sengaja.
import crypto from 'node:crypto'

const BASE = 'https://api.sandbox.midtrans.com'

export class MidtransError extends Error {
  constructor(message, data) {
    super(message)
    this.data = data
  }
}

function authHeader() {
  const key = process.env.MIDTRANS_SERVER_KEY
  if (!key) throw new Error('Environment variable MIDTRANS_SERVER_KEY belum diatur.')
  return 'Basic ' + Buffer.from(`${key}:`).toString('base64')
}

async function call(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: authHeader() },
  })
  const data = await res.json().catch(() => ({}))
  return { res, data }
}

// Midtrans membalas HTTP 200 dengan `status_code` di body ("201" = charge sukses).
export async function chargeQris({ orderId, grossAmount }) {
  const { res, data } = await call('/v2/charge', {
    method: 'POST',
    body: JSON.stringify({
      payment_type: 'qris',
      transaction_details: { order_id: orderId, gross_amount: grossAmount },
      qris: { acquirer: 'gopay' },
    }),
  })
  const code = String(data.status_code ?? res.status)
  if (!code.startsWith('2')) throw new MidtransError(data.status_message || 'Charge QRIS gagal.', data)
  return data
}

export async function getTransactionStatus(orderId) {
  const { data } = await call(`/v2/${encodeURIComponent(orderId)}/status`, { method: 'GET' })
  return data
}

// URL gambar QR dari respons charge.
export function extractQrUrl(data) {
  const actions = Array.isArray(data?.actions) ? data.actions : []
  const hit =
    actions.find((a) => a.name === 'generate-qr-code-v2') ||
    actions.find((a) => String(a.name || '').includes('generate-qr-code'))
  return hit?.url || null
}

// Midtrans memakai format "yyyy-MM-dd HH:mm:ss" dalam WIB (+07:00).
export function parseMidtransTime(text, fallbackMs) {
  if (!text) return fallbackMs
  const ms = Date.parse(String(text).replace(' ', 'T') + '+07:00')
  return Number.isNaN(ms) ? fallbackMs : ms
}

// signature_key = SHA512(order_id + status_code + gross_amount + ServerKey)
export function verifySignature(body, serverKey) {
  if (!body || !serverKey || typeof body.signature_key !== 'string') return false
  const expected = crypto
    .createHash('sha512')
    .update(`${body.order_id}${body.status_code}${body.gross_amount}${serverKey}`)
    .digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(body.signature_key.toLowerCase())
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

// transaction_status Midtrans -> paymentStatus kita. null = abaikan (mis. refund).
export function mapPaymentStatus(transactionStatus, fraudStatus) {
  switch (transactionStatus) {
    case 'settlement':
      return 'dibayar'
    case 'capture':
      return !fraudStatus || fraudStatus === 'accept' ? 'dibayar' : 'belum_dibayar'
    case 'pending':
      return 'belum_dibayar'
    case 'expire':
      return 'kedaluwarsa'
    case 'cancel':
    case 'deny':
    case 'failure':
      return 'gagal'
    default:
      return null
  }
}
