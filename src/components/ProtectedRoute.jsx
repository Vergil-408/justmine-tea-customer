import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import TeaLoader from './TeaLoader.jsx'

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return (
            <TeaLoader
                fullScreen
                message="Menyiapkan akunmu..."
                submessage="Menghubungkan sesi autentikasi Justmine Tea"
            />
        )
    }

    if (!user) {
        // Simpan halaman tujuan biar setelah login bisa balik ke sini lagi
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    return children
}
