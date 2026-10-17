// File ini berisi fungsi-fungsi terkait order ke Firestore
import { collection, addDoc, doc, onSnapshot, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase.js'

/**
 * Membuat order baru
 * @param {Object} orderData data order yang akan disimpan
 * @returns {Promise<string>} ID dokumen order yang baru dibuat
 */
export const createOrder = async (orderData) => {
  const docRef = await addDoc(collection(db, 'orders'), {
    ...orderData,
    status: orderData.status || 'menunggu', // menunggu -> diproses -> siap
    createdAt: serverTimestamp(),
  })
  return docRef.id
};

/**
 * Mendengarkan perubahan data order berdasarkan ID
 * @param {string} orderId ID dari order
 * @param {Function} callback Fungsi callback saat data berubah, menerima { id, ...data } atau null
 * @returns {Function} unsubscribe function
 */
export const listenToOrder = (orderId, callback) => {
  if (!orderId) return () => {}
  return onSnapshot(doc(db, 'orders', orderId), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null)
  })
};

/**
 * Mendengarkan posisi antrian order (hitung order lain dengan status
 * 'menunggu'/'diproses' yang dibuat lebih dulu dari order ini).
 * @param {string} orderId ID dari order
 * @param {Function} callback Fungsi callback saat posisi berubah, menerima number|null
 * @returns {Function} unsubscribe function
 */
export const listenToQueuePosition = (orderId, callback) => {
  if (!orderId) return () => {}
  const q = query(
    collection(db, 'orders'),
    where('status', 'in', ['menunggu', 'diproses']),
    orderBy('createdAt', 'asc')
  )
  return onSnapshot(q, (snap) => {
    const ids = snap.docs.map((d) => d.id)
    const idx = ids.indexOf(orderId)
    callback(idx >= 0 ? idx + 1 : null)
  })
};
