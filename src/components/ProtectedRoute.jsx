import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <p className="text-sm text-on-surface-variant">Memuat...</p>
            </div>
        )
    }

    if (!user) {
        // Simpan halaman tujuan biar setelah login bisa balik ke sini lagi
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    return children
}