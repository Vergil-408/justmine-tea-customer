// Firebase Admin (server-side). Melewati security rules, jadi HANYA dipakai di folder api/.
// Kredensial dibaca dari environment variable Vercel FIREBASE_SERVICE_ACCOUNT
// (isi file JSON service account, boleh dalam bentuk base64).
import { getApps, initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) throw new Error('Environment variable FIREBASE_SERVICE_ACCOUNT belum diatur.')
  const text = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8')
  return JSON.parse(text)
}

export function getAdmin() {
  if (!getApps().length) initializeApp({ credential: cert(loadServiceAccount()) })
  return { db: getFirestore(), auth: getAuth(), FieldValue }
}
