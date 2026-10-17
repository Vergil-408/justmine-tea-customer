import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../api/firebase.js'
import { seedMenuItems } from '../data/menuData.js'

// Membaca collection "menuItems" di Firestore secara real-time.
// Kalau kasir belum pernah nulis data (collection kosong), pakai seed data
// supaya development/demo tetap jalan sebelum App Kasir selesai dibuat.
export function useMenuItems() {
  const [items, setItems] = useState(seedMenuItems)
  const [loading, setLoading] = useState(true)
  const [usingSeed, setUsingSeed] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'menuItems'),
      (snap) => {
        if (snap.empty) {
          setItems(seedMenuItems)
          setUsingSeed(true)
        } else {
          setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
          setUsingSeed(false)
        }
        setLoading(false)
      },
      (err) => {
        console.warn('Gagal baca menuItems dari Firestore, pakai seed data:', err)
        setItems(seedMenuItems)
        setUsingSeed(true)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [])

  return { items, loading, usingSeed }
}