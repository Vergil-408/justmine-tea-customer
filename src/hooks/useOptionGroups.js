import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../api/firebase.js'
import { seedOptionGroups } from '../data/optionGroupsData.js'

const sortGroups = (list) =>
  [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

// Membaca collection "optionGroups" secara real-time (template kustomisasi dari admin).
// Pola sama dengan useMenuItems: kalau kosong / error -> pakai seed lokal.
// State awal sengaja [] + loading true (bukan seed) supaya Menu tidak sempat
// bercabang memakai definisi grup yang salah sebelum data asli datang.
// Grup dengan active === false dibuang di sini, jadi resolveOptions tidak melihatnya.
export function useOptionGroups() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [usingSeed, setUsingSeed] = useState(false)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'optionGroups'),
      (snap) => {
        if (snap.empty) {
          setGroups(sortGroups(seedOptionGroups))
          setUsingSeed(true)
        } else {
          const list = snap.docs
            .map((d) => ({ ...d.data(), id: d.id }))
            .filter((g) => g.active !== false)
          setGroups(sortGroups(list))
          setUsingSeed(false)
        }
        setLoading(false)
      },
      (err) => {
        console.warn('Gagal baca optionGroups dari Firestore, pakai seed data:', err)
        setGroups(sortGroups(seedOptionGroups))
        setUsingSeed(true)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [])

  return { groups, loading, usingSeed }
}
