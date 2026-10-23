import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { listenToUserProfile } from '../api/users.js'

// Kalau belum login, otomatis return points: 0
export function useUserProfile() {
    const { user } = useAuth()
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) {
            setProfile(null)
            setLoading(false)
            return
        }
        setLoading(true)
        const unsub = listenToUserProfile(user.uid, (data) => {
            setProfile(data)
            setLoading(false)
        })
        return () => unsub()
    }, [user])

    return {
        points: profile?.points ?? 0,
        totalOrders: profile?.totalOrders ?? 0,
        phone: profile?.phone ?? '',
        profile,
        loading,
        isLoggedIn: !!user,
    }
}