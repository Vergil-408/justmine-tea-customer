import { doc, getDoc, setDoc, onSnapshot, increment, updateDoc } from 'firebase/firestore'
import { db } from './firebase.js'

// Dipanggil saat user login / register.
// Menyimpan data profil (nama, email, phone, poin awal 0) jika belum ada.
export async function ensureUserProfile(user, extraData = {}) {
    if (!user?.uid) return
    const ref = doc(db, 'users', user.uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
        await setDoc(ref, {
            displayName: extraData.displayName || user.displayName || '',
            email: extraData.email || user.email || '',
            phone: extraData.phone || '',
            photoURL: user.photoURL || '',
            points: 0,
            totalOrders: 0,
            createdAt: new Date().toISOString(),
        })
    } else {
        const data = snap.data()
        const updates = {}
        if (extraData.phone && !data.phone) updates.phone = extraData.phone
        if (extraData.displayName && !data.displayName) updates.displayName = extraData.displayName
        if (Object.keys(updates).length > 0) {
            await updateDoc(ref, updates).catch(() => {})
        }
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

// Update nomor telepon user
export async function updateUserPhone(uid, phone) {
    if (!uid) return
    const ref = doc(db, 'users', uid)
    await updateDoc(ref, { phone })
}

// Update data profil user (nama lengkap, nomor telepon, foto profil) secara real-time ke Firestore
export async function updateUserProfileDoc(uid, { displayName, phone, photoURL }) {
    if (!uid) return
    const ref = doc(db, 'users', uid)
    const updates = { updatedAt: new Date().toISOString() }
    if (displayName !== undefined) updates.displayName = displayName
    if (phone !== undefined) updates.phone = phone
    if (photoURL !== undefined) updates.photoURL = photoURL
    await updateDoc(ref, updates)
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