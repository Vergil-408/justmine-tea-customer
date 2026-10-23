import { createContext, useContext, useEffect, useState } from 'react'
import {
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    updateProfile,
} from 'firebase/auth'
import { auth, db } from '../api/firebase.js'
import { ensureUserProfile, updateUserPhone as updatePhoneInDb } from '../api/users.js'
import { doc, getDoc } from 'firebase/firestore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser)
            if (firebaseUser) {
                await ensureUserProfile(firebaseUser)
                try {
                    const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
                    if (snap.exists()) setProfile(snap.data())
                } catch (e) {
                    console.warn('Gagal membaca profil user:', e)
                }
            } else {
                setProfile(null)
            }
            setLoading(false)
        })
        return () => unsub()
    }, [])

    async function registerWithEmail({ name, phone, email, password }) {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
        if (name) {
            await updateProfile(cred.user, { displayName: name }).catch(() => {})
        }
        await ensureUserProfile(cred.user, { displayName: name, phone, email: email.trim().toLowerCase() })
        setUser(cred.user)
        setProfile({ displayName: name, phone, email: email.trim().toLowerCase(), points: 0, totalOrders: 0 })
        return cred.user
    }

    async function loginWithEmail(email, password) {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password)
        setUser(cred.user)
        try {
            const snap = await getDoc(doc(db, 'users', cred.user.uid))
            if (snap.exists()) setProfile(snap.data())
        } catch {}
        return cred.user
    }

    async function resetPassword(email) {
        auth.languageCode = 'id'
        await sendPasswordResetEmail(auth, email.trim())
    }

    async function loginWithGoogle() {
        const provider = new GoogleAuthProvider()
        const cred = await signInWithPopup(auth, provider)
        await ensureUserProfile(cred.user)
        try {
            const snap = await getDoc(doc(db, 'users', cred.user.uid))
            if (snap.exists()) setProfile(snap.data())
        } catch {}
        return cred.user
    }

    async function updateUserPhone(phone) {
        if (!user) return
        await updatePhoneInDb(user.uid, phone)
        setProfile((prev) => ({ ...prev, phone }))
    }

    async function logout() {
        await signOut(auth)
        setUser(null)
        setProfile(null)
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                loading,
                registerWithEmail,
                loginWithEmail,
                resetPassword,
                loginWithGoogle,
                updateUserPhone,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}