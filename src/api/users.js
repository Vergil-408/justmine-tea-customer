import { doc, getDoc, setDoc, onSnapshot, increment, updateDoc, collection, query, where, getDocs } from 'firebase/firestore'
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

// Dipanggil setelah order berhasil dibuat atau dibayar.
// pointsEarned dihitung dari total belanja (1 poin tiap Rp1.000).
export async function addPointsAfterOrder(uid, orderTotal, orderId = null, orderCode = '') {
    if (!uid) return 0
    const pointsEarned = Math.floor(Number(orderTotal || 0) / 1000)
    if (pointsEarned <= 0) return 0

    try {
        const userRef = doc(db, 'users', uid)
        const userSnap = await getDoc(userRef)
        if (userSnap.exists()) {
            const userData = userSnap.data()
            const syncedOrderIds = userData.syncedOrderIds || []

            // Cegah duplikasi jika order ini sudah pernah dicatat
            if (orderId && syncedOrderIds.includes(orderId)) {
                return pointsEarned
            }

            const existingHistory = userData.pointHistory || []
            const historyItem = {
                id: 'ph-' + Date.now(),
                type: 'earn',
                title: `Pesanan Selesai #${orderCode || orderId || 'Pesanan'}`,
                points: pointsEarned,
                date: new Date().toISOString(),
                ref: `#${orderCode || orderId || ''}`,
            }

            const updates = {
                points: increment(pointsEarned),
                totalOrders: increment(1),
                pointHistory: [historyItem, ...existingHistory],
            }
            if (orderId) {
                updates.syncedOrderIds = [...syncedOrderIds, orderId]
            }

            await updateDoc(userRef, updates)
        }
    } catch (err) {
        console.warn('Gagal menambah poin setelah order:', err)
    }
    return pointsEarned
}

// Sinkronisasi otomatis poin dari seluruh riwayat pesanan yang sudah dibayar.
// Memastikan semua pesanan customer yang berhasil langsung terhitung poinnya.
export async function syncUserPointsFromOrders(uid) {
    if (!uid) return
    try {
        const userRef = doc(db, 'users', uid)
        const userSnap = await getDoc(userRef)
        if (!userSnap.exists()) return

        const userData = userSnap.data()
        const syncedOrderIds = new Set(userData.syncedOrderIds || [])

        const q = query(collection(db, 'orders'), where('userId', '==', uid))
        const snap = await getDocs(q)
        if (snap.empty) return

        let unawardedPoints = 0
        let unawardedOrdersCount = 0
        const newHistoryItems = []
        const newlySyncedIds = []

        snap.docs.forEach((docSnap) => {
            const order = docSnap.data()
            const orderId = docSnap.id
            const isPaid = order.paymentStatus === 'dibayar' || order.status === 'siap' || order.status === 'selesai'

            if (isPaid && !syncedOrderIds.has(orderId)) {
                const total = Number(order.total ?? order.subtotal ?? 0)
                const earned = Math.floor(total / 1000)
                if (earned > 0) {
                    unawardedPoints += earned
                    unawardedOrdersCount += 1
                    newlySyncedIds.push(orderId)
                    newHistoryItems.push({
                        id: 'ph-' + orderId,
                        type: 'earn',
                        title: `Pesanan Selesai #${order.orderCode || orderId.slice(0, 8)}`,
                        points: earned,
                        date: order.createdAt?.toDate ? order.createdAt.toDate().toISOString() : new Date().toISOString(),
                        ref: `#${order.orderCode || orderId.slice(0, 8)}`,
                    })
                }
            }
        })

        if (unawardedPoints > 0) {
            const existingHistory = userData.pointHistory || []
            await updateDoc(userRef, {
                points: increment(unawardedPoints),
                totalOrders: increment(unawardedOrdersCount),
                syncedOrderIds: [...Array.from(syncedOrderIds), ...newlySyncedIds],
                pointHistory: [...newHistoryItems, ...existingHistory],
            })
        } else if (newlySyncedIds.length > 0) {
            await updateDoc(userRef, {
                syncedOrderIds: [...Array.from(syncedOrderIds), ...newlySyncedIds],
            })
        }
    } catch (err) {
        console.warn('Gagal sinkronisasi poin dari riwayat pesanan:', err)
    }
}