// File ini berisi fungsi terkait data menu dari Firestore
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from './firebase.js'
import { seedMenuItems } from '../data/menuData.js'

/**
 * Mendengarkan perubahan data menu di collection "menuItems".
 * Kalau collection kosong (App Kasir belum pernah menulis data),
 * otomatis fallback ke seed data supaya demo tetap bisa jalan.
 * @param {Function} callback Fungsi callback saat data menu berubah, menerima array item
 * @returns {Function} unsubscribe function
 */
export const listenToMenuItems = (callback) => {
  return onSnapshot(
    collection(db, 'menuItems'),
    (snap) => {
      if (snap.empty) {
        callback(seedMenuItems)
      } else {
        callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      }
    },
    (err) => {
      console.warn('Gagal baca menuItems dari Firestore, pakai seed data:', err)
      callback(seedMenuItems)
    }
  )
};
