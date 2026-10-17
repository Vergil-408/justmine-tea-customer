import { createContext, useContext, useEffect, useState } from 'react'
import {
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
} from 'firebase/auth'
import { auth } from '../api/firebase.js'
import { ensureUserProfile } from '../api/users.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser)
            setLoading(false)
            if (firebaseUser) {
                // Kalau user baru pertama kali login, bikinkan dokumen profil dengan poin awal 0
                await ensureUserProfile(firebaseUser)
            }
        })
        return () => unsub()
    }, [])

    async function loginWithGoogle() {
        const provider = new GoogleAuthProvider()
        try {
            await signInWithPopup(auth, provider)
        } catch (err) {
            console.error('Gagal login dengan Google:', err)
            throw err
        }
    }

    async function logout() {
        await signOut(auth)
    }

    return (
        <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}