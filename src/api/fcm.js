// FCM Web Push — token management & permission request
// Dipakai oleh NotificationContext untuk mendaftarkan browser pelanggan ke Firebase Cloud Messaging.

import { getMessaging, getToken, deleteToken } from 'firebase/messaging'
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore'
import { initializeApp, getApps, getApp } from 'firebase/app'
import { db } from './firebase.js'

// VAPID key dari Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
// Ganti dengan VAPID key milik project kamu (lihat langkah setup di README)
const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY || ''

const firebaseConfig = {
  apiKey: 'AIzaSyDiQISTMea-z9H7Gdd5oR3hTrrTSJ6_VvM',
  authDomain: 'justmine-tea.firebaseapp.com',
  projectId: 'justmine-tea',
  storageBucket: 'justmine-tea.firebasestorage.app',
  messagingSenderId: '567738805461',
  appId: '1:567738805461:web:06b546c1d723eabfea865c',
}

function getFirebaseApp() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig)
}

/**
 * Minta izin notifikasi dari browser, dapatkan FCM token, dan simpan ke Firestore.
 * @param {string|null} uid - Firebase Auth UID. Null = tamu (token tidak disimpan ke DB).
 * @returns {Promise<string|null>} FCM token atau null jika ditolak/gagal.
 */
export async function registerPushToken(uid) {
  // Cek dukungan browser
  if (typeof window === 'undefined') return null
  if (!('Notification' in window)) return null
  if (!('serviceWorker' in navigator)) return null
  if (!VAPID_KEY) {
    console.warn('[FCM] VITE_FCM_VAPID_KEY belum diatur. Skipping push registration.')
    return null
  }

  try {
    // Minta izin notifikasi
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.info('[FCM] Izin notifikasi ditolak oleh pengguna.')
      return null
    }

    // Registrasi service worker
    const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    })
    await navigator.serviceWorker.ready

    const messaging = getMessaging(getFirebaseApp())
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    })

    if (!token) return null

    // Simpan token ke Firestore user document jika login
    if (uid) {
      await saveFcmToken(uid, token)
    }

    // Simpan juga ke localStorage sebagai cache
    localStorage.setItem('justmine_fcm_token', token)
    return token
  } catch (err) {
    console.warn('[FCM] Gagal registrasi push token:', err)
    return null
  }
}

/**
 * Simpan/update FCM token ke Firestore /users/{uid}
 */
export async function saveFcmToken(uid, token) {
  if (!uid || !token) return
  try {
    const userRef = doc(db, 'users', uid)
    const snap = await getDoc(userRef)
    if (snap.exists()) {
      await updateDoc(userRef, { fcmToken: token, fcmUpdatedAt: new Date().toISOString() })
    } else {
      await setDoc(userRef, { fcmToken: token, fcmUpdatedAt: new Date().toISOString() }, { merge: true })
    }
  } catch (err) {
    console.warn('[FCM] Gagal menyimpan token ke Firestore:', err)
  }
}

/**
 * Hapus FCM token (dipanggil saat logout)
 */
export async function unregisterPushToken(uid) {
  try {
    const messaging = getMessaging(getFirebaseApp())
    await deleteToken(messaging)
    localStorage.removeItem('justmine_fcm_token')

    if (uid) {
      const userRef = doc(db, 'users', uid)
      await updateDoc(userRef, { fcmToken: null }).catch(() => {})
    }
  } catch (err) {
    console.warn('[FCM] Gagal hapus push token:', err)
  }
}

