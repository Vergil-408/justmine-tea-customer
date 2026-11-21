import { doc, getDoc, setDoc, onSnapshot, updateDoc, increment } from 'firebase/firestore'
import { db } from './firebase.js'

// 4 Voucher Resmi Justmine Tea sesuai spesifikasi
export const AVAILABLE_VOUCHERS = [
  {
    id: 'vcr-sweet-discount-2k',
    name: 'Sweet Discount',
    benefit: 'Diskon Rp2.000',
    description: 'Potongan harga langsung Rp2.000 tanpa syarat minimum belanja.',
    rewardType: 'fixed_discount',
    discountAmount: 2000,
    pointsRequired: 100,
    minPurchase: 0,
    validityDays: 7,
    quota: 1000,
    remainingQuota: 640,
    allowBundle: true,
    category: 'discount',
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'vcr-tea-saver-5k',
    name: 'Tea Saver',
    benefit: 'Diskon Rp5.000',
    description: 'Potongan Rp5.000 untuk transaksi dengan minimum belanja Rp25.000.',
    rewardType: 'fixed_discount',
    discountAmount: 5000,
    pointsRequired: 250,
    minPurchase: 25000,
    validityDays: 7,
    quota: 500,
    remainingQuota: 158,
    allowBundle: true,
    category: 'discount',
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'vcr-tea-lover-10k',
    name: 'Tea Lover Reward',
    benefit: 'Diskon Rp10.000',
    description: 'Potongan spesial Rp10.000 untuk menikmati racikan teh premium bersama teman.',
    rewardType: 'fixed_discount',
    discountAmount: 10000,
    pointsRequired: 500,
    minPurchase: 45000,
    validityDays: 14,
    quota: 200,
    remainingQuota: 45,
    allowBundle: true,
    category: 'discount',
    imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'vcr-topping-treat',
    name: 'Topping Treat',
    benefit: 'Gratis 1 Topping Pilihan',
    description: 'Bebas pilih 1 topping lezat (Grass Jelly Alami, Boba, atau Nata de Coco).',
    rewardType: 'free_topping',
    freeToppingName: 'Grass Jelly / Boba',
    discountAmount: 3000, // Nilai ekuivalen topping
    pointsRequired: 150,
    minPurchase: 18000,
    validityDays: 7,
    quota: 300,
    remainingQuota: 105,
    allowBundle: true,
    category: 'topping',
    imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=400&q=80',
  },
]

const LOCAL_STORAGE_KEY_VOUCHERS = 'justmine_customer_vouchers'
const LOCAL_STORAGE_KEY_HISTORY = 'justmine_customer_point_history'

function getLocalData(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveLocalData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.warn('LocalStorage save failed:', e)
  }
}

/**
 * Dengarkan voucher milik customer yang sudah ditebus (My Vouchers)
 */
export function listenToCustomerVouchers(uid, callback) {
  if (!uid) {
    callback(getLocalData(LOCAL_STORAGE_KEY_VOUCHERS))
    return () => {}
  }
  const ref = doc(db, 'users', uid)
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        const vouchers = data.vouchers || getLocalData(LOCAL_STORAGE_KEY_VOUCHERS)
        callback(vouchers)
      } else {
        callback(getLocalData(LOCAL_STORAGE_KEY_VOUCHERS))
      }
    },
    (err) => {
      console.warn('Firestore listen vouchers fallback:', err)
      callback(getLocalData(LOCAL_STORAGE_KEY_VOUCHERS))
    }
  )
}

/**
 * Dengarkan riwayat mutasi poin customer
 */
export function listenToPointHistory(uid, callback) {
  const initialHistory = [
    {
      id: 'ph-01',
      type: 'earn',
      title: 'Pesanan Selesai #JT-20261121-081',
      points: 45,
      date: '2026-11-21T19:40:00Z',
      ref: '#JT-20261121-081',
    },
    {
      id: 'ph-02',
      type: 'redeem',
      title: 'Tukar Voucher Tea Saver',
      points: -250,
      date: '2026-11-18T14:15:00Z',
      ref: 'Tea Saver Rp5.000',
    },
    {
      id: 'ph-03',
      type: 'earn',
      title: 'Pesanan Selesai #JT-20261114-019',
      points: 60,
      date: '2026-11-14T11:20:00Z',
      ref: '#JT-20261114-019',
    },
    {
      id: 'ph-04',
      type: 'earn',
      title: 'Bonus Pendaftaran Member Baru',
      points: 10,
      date: '2026-11-01T09:00:00Z',
      ref: 'Selamat Datang',
    },
  ]

  if (!uid) {
    const list = getLocalData(LOCAL_STORAGE_KEY_HISTORY, initialHistory)
    callback(list)
    return () => {}
  }

  const ref = doc(db, 'users', uid)
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        const history = data.pointHistory || getLocalData(LOCAL_STORAGE_KEY_HISTORY, initialHistory)
        callback(history)
      } else {
        callback(getLocalData(LOCAL_STORAGE_KEY_HISTORY, initialHistory))
      }
    },
    (err) => {
      console.warn('Firestore listen point history fallback:', err)
      callback(getLocalData(LOCAL_STORAGE_KEY_HISTORY, initialHistory))
    }
  )
}

/**
 * Tukar Poin untuk Memperoleh Voucher
 */
export async function redeemRewardVoucher(user, voucher, currentPoints) {
  if (currentPoints < voucher.pointsRequired) {
    throw new Error('Poin belum mencukupi untuk menukarkan voucher ini.')
  }

  const now = new Date()
  const expiryDate = new Date(now.getTime() + voucher.validityDays * 24 * 60 * 60 * 1000)

  const redeemedVoucher = {
    userVoucherId: 'uvcr-' + Date.now(),
    voucherId: voucher.id,
    name: voucher.name,
    benefit: voucher.benefit,
    description: voucher.description,
    rewardType: voucher.rewardType,
    discountAmount: voucher.discountAmount,
    freeToppingName: voucher.freeToppingName || null,
    minPurchase: voucher.minPurchase || 0,
    pointsPaid: voucher.pointsRequired,
    redeemedAt: now.toISOString(),
    expiresAt: expiryDate.toISOString(),
    status: 'ready', // 'ready' | 'used' | 'expired'
    allowBundle: voucher.allowBundle,
  }

  const newHistoryItem = {
    id: 'ph-' + Date.now(),
    type: 'redeem',
    title: `Tukar ${voucher.name}`,
    points: -voucher.pointsRequired,
    date: now.toISOString(),
    ref: voucher.name,
  }

  // Update in localStorage
  const localVouchers = getLocalData(LOCAL_STORAGE_KEY_VOUCHERS)
  localVouchers.unshift(redeemedVoucher)
  saveLocalData(LOCAL_STORAGE_KEY_VOUCHERS, localVouchers)

  const localHistory = getLocalData(LOCAL_STORAGE_KEY_HISTORY)
  localHistory.unshift(newHistoryItem)
  saveLocalData(LOCAL_STORAGE_KEY_HISTORY, localHistory)

  // Update in Firestore if user is authenticated
  if (user?.uid) {
    try {
      const userRef = doc(db, 'users', user.uid)
      const userSnap = await getDoc(userRef)
      if (userSnap.exists()) {
        const userData = userSnap.data()
        const existingVouchers = userData.vouchers || []
        const existingHistory = userData.pointHistory || []

        await updateDoc(userRef, {
          points: increment(-voucher.pointsRequired),
          vouchers: [redeemedVoucher, ...existingVouchers],
          pointHistory: [newHistoryItem, ...existingHistory],
        })
      }
    } catch (err) {
      console.warn('Firestore update failed during redeem, local saved:', err)
    }
  }

  return redeemedVoucher
}

/**
 * Tandai voucher yang sudah dipakai saat checkout
 */
export async function markVoucherAsUsed(uid, userVoucherId) {
  if (!userVoucherId) return

  // Update di LocalStorage
  const localVouchers = getLocalData(LOCAL_STORAGE_KEY_VOUCHERS)
  const updated = localVouchers.map((v) =>
    v.userVoucherId === userVoucherId ? { ...v, status: 'used', usedAt: new Date().toISOString() } : v
  )
  saveLocalData(LOCAL_STORAGE_KEY_VOUCHERS, updated)

  // Update di Firestore jika user login
  if (uid) {
    try {
      const userRef = doc(db, 'users', uid)
      const userSnap = await getDoc(userRef)
      if (userSnap.exists()) {
        const userData = userSnap.data()
        const userVouchers = (userData.vouchers || []).map((v) =>
          v.userVoucherId === userVoucherId ? { ...v, status: 'used', usedAt: new Date().toISOString() } : v
        )
        await updateDoc(userRef, { vouchers: userVouchers })
      }
    } catch (e) {
      console.warn('Failed to mark voucher as used in Firestore:', e)
    }
  }
}

