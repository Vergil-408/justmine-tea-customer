import { doc, getDoc, setDoc, onSnapshot, increment, updateDoc } from 'firebase/firestore'
import { db } from './firebase.js'

// Dipanggil sekali setiap kali user login — kalau belum ada dokumen profilnya
// di Firestore (user baru), otomatis dibuatkan dengan poin awal 0.
export async function ensureUserProfile(user) {
    if (!user) return
    const ref = doc(db, 'users', user.uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
        await setDoc(ref, {
            displayName: user.displayName || '',
            email: user.email || '',
            photoURL: user.photoURL || '',
            points: 0,
            totalOrders: 0,
            createdAt: new Date().toISOString(),
        })
    }
}

// Real-time listener untuk profil user (poin, total pesanan, dll)
export function listenToUserProfile(uid, callback) {
    if (!uid) return () => { }
    const ref = doc(db, 'users', uid)
    return onSnapshot(ref, (snap) => {
        callback(snap.exists() ? snap.data() : null)
    })
}

// Dipanggil setelah order berhasil dibuat, hanya kalau user sedang login.
// pointsEarned dihitung dari total belanja (contoh: 1 poin tiap Rp1.000).
export async function addPointsAfterOrder(uid, orderTotal) {
    if (!uid) return
    const pointsEarned = Math.floor(orderTotal / 1000)
    const ref = doc(db, 'users', uid)
    await updateDoc(ref, {
        points: increment(pointsEarned),
        totalOrders: increment(1),
    })
    return pointsEarned
}