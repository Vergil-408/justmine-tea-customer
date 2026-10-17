import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

function GoogleIcon({ className = 'w-4 h-4' }) {
    return (
        <svg className={className} viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
        </svg>
    )
}

// Placeholder untuk emblem/logo — nanti diganti file logo asli Justmine Tea
function EmblemPlaceholder({ className = '' }) {
    return (
        <div className={`bg-gradient-to-b from-tea-100 to-tea-50 flex items-center justify-center ${className}`}>
            <span className="material-symbols-outlined text-tea-600 text-[36px]">spa</span>
        </div>
    )
}

export default function Login() {
    const { loginWithGoogle } = useAuth()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()
    const location = useLocation()
    const from = location.state?.from || '/'

    async function handleLogin() {
        setLoading(true)
        setError('')
        try {
            await loginWithGoogle()
            navigate(from, { replace: true })
        } catch (err) {
            setError('Gagal login. Coba lagi ya.')
        } finally {
            setLoading(false)
        }
    }

    function handleGuest() {
        navigate(from, { replace: true })
    }

    return (
        <div className="min-h-screen bg-tea-50 font-sans text-tea-950 relative overflow-hidden">
            {/* Ambient background glow, pengganti texture image */}
            <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-tea-150/60 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-tea-150/60 blur-3xl pointer-events-none" />

            {/* ================= MOBILE ================= */}
            <div className="lg:hidden relative z-10 min-h-screen flex flex-col justify-between px-6 py-6">
                <div className="text-center pt-2">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-tea-100/70 border border-tea-150">
                        <span className="w-1.5 h-1.5 rounded-full bg-tea-500" />
                        <span className="text-[10px] uppercase tracking-[0.24em] text-tea-700 font-semibold">Seduhan Murni Sejak 1928</span>
                    </div>
                </div>

                <div className="flex flex-col items-center text-center my-auto py-4">
                    <div className="relative mb-6">
                        <div className="absolute -inset-2 rounded-full bg-gradient-to-b from-tea-300/20 to-tea-600/10 blur-xl pointer-events-none" />
                        <div className="relative w-40 h-40 rounded-full p-2.5 bg-white border border-tea-150 shadow-lg flex items-center justify-center">
                            <div className="w-full h-full rounded-full border border-dashed border-tea-300/80 p-2.5 flex items-center justify-center">
                                <EmblemPlaceholder className="w-full h-full rounded-full" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 max-w-[310px] mx-auto">
                        <h1 className="font-serif text-[42px] leading-[1.08] font-normal tracking-tight text-tea-950">
                            Justmine <span className="italic font-medium text-tea-600">Tea</span>
                        </h1>

                        <div className="flex items-center justify-center gap-2 py-0.5 opacity-60">
                            <span className="w-8 h-px bg-tea-200" />
                            <span className="w-1.5 h-1.5 rounded-full bg-tea-700/60" />
                            <span className="w-8 h-px bg-tea-200" />
                        </div>

                        <p className="font-serif text-base leading-relaxed text-tea-700 italic px-2">
                            "Ruang jeda dan ketenangan di setiap tegukan."
                        </p>
                    </div>
                </div>

                <div className="space-y-3 pb-1">
                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="w-full h-[52px] flex items-center justify-center gap-3 px-6 bg-white hover:bg-tea-50 active:scale-[0.985] rounded-full border border-tea-150 shadow-md text-sm font-semibold text-tea-950 transition-all disabled:opacity-60"
                    >
                        <GoogleIcon />
                        <span>{loading ? 'Memproses...' : 'Lanjutkan dengan Akun Google'}</span>
                    </button>

                    {error && <p className="text-xs text-center text-red-600">{error}</p>}

                    <div className="text-center pt-0.5">
                        <button
                            onClick={handleGuest}
                            className="inline-flex items-center justify-center gap-1 px-4 py-2 text-[13px] font-semibold text-tea-600 hover:text-tea-800 rounded-full transition-all group"
                        >
                            <span>Masuk sebagai Tamu</span>
                            <span className="transition-transform group-hover:translate-x-1">→</span>
                        </button>
                    </div>

                    <footer className="pt-2 pb-1 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5 text-[11px] text-tea-700/80 mb-2 font-medium">
                            <span className="material-symbols-outlined text-[14px]">shield</span>
                            <span>Terenkripsi &amp; Tanpa Password</span>
                        </div>
                        <div className="text-[11px] text-tea-700/70 flex items-center justify-center gap-2 font-normal tracking-wide">
                            <a className="hover:text-tea-950 transition-colors" href="#privasi">Privasi</a>
                            <span className="text-tea-300">•</span>
                            <a className="hover:text-tea-950 transition-colors" href="#syarat">Syarat Layanan</a>
                        </div>
                    </footer>
                </div>
            </div>

            {/* ================= DESKTOP ================= */}
            <div className="hidden lg:flex relative z-10 min-h-screen flex-col justify-between">
                <header className="w-full pt-8 pb-4 px-8 flex justify-between items-center max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 text-xs tracking-widest text-tea-700/85 uppercase font-semibold">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-tea-500" />
                        Kebun Teh Gunung Halimun
                    </div>
                    <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/80 border border-tea-150 text-tea-800 text-xs tracking-[0.22em] font-medium shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-tea-500" />
                        <span>Seduhan Murni Sejak 1928</span>
                    </div>
                    <div className="text-xs text-tea-700/80 tracking-wider hover:text-tea-950 transition-colors cursor-pointer font-medium">
                        Bantuan Atelier
                    </div>
                </header>

                <main className="flex-1 flex items-center justify-center px-4 py-8">
                    <div className="w-full max-w-md bg-white/90 border border-tea-150 shadow-xl rounded-3xl p-10 text-center">
                        <div className="flex justify-center mb-6">
                            <div className="w-32 h-32 rounded-full p-1.5 bg-gradient-to-b from-tea-100 to-tea-50 border border-tea-150 flex items-center justify-center shadow-sm">
                                <EmblemPlaceholder className="w-full h-full rounded-full border border-tea-200/70" />
                            </div>
                        </div>

                        <div className="space-y-2.5 mb-6">
                            <h1 className="font-serif text-4xl sm:text-5xl text-tea-950 tracking-tight font-normal">
                                Justmine <span className="italic text-tea-600 font-light ml-1">Tea</span>
                            </h1>
                            <p className="text-xs uppercase tracking-[0.26em] text-tea-700 font-medium">
                                Atelier Seduhan Melati Pilihan
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-3 w-44 mx-auto my-5">
                            <span className="h-px flex-1 bg-tea-200" />
                            <span className="w-1.5 h-1.5 rounded-full bg-tea-500" />
                            <span className="h-px flex-1 bg-tea-200" />
                        </div>

                        <p className="font-serif italic text-lg text-tea-800 mb-8 tracking-wide px-4 leading-relaxed">
                            "Ruang jeda dan ketenangan di setiap tegukan."
                        </p>

                        <div className="space-y-3 max-w-sm mx-auto">
                            <button
                                onClick={handleLogin}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-tea-50/70 text-tea-950 font-medium py-3.5 px-6 rounded-full transition-all shadow-sm hover:shadow border border-tea-200 hover:border-tea-300 text-sm disabled:opacity-60"
                            >
                                <GoogleIcon />
                                <span>{loading ? 'Memproses...' : 'Lanjutkan dengan Akun Google'}</span>
                            </button>

                            {error && <p className="text-xs text-red-600">{error}</p>}

                            <button
                                onClick={handleGuest}
                                className="w-full flex items-center justify-center gap-1.5 bg-tea-50/80 hover:bg-tea-100/70 border border-tea-200 hover:border-tea-300 text-tea-800 font-medium py-3 px-6 rounded-full transition-all text-sm tracking-wide group"
                            >
                                <span>Masuk sebagai Tamu</span>
                                <span className="text-tea-500 font-semibold transition-transform group-hover:translate-x-1">→</span>
                            </button>
                        </div>

                        <div className="mt-8 pt-5 border-t border-tea-150 space-y-2 text-xs text-tea-700/80 font-normal">
                            <div className="flex items-center justify-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px] text-tea-600">shield</span>
                                <span>Terenkripsi &amp; Tanpa Password</span>
                            </div>
                            <div className="flex items-center justify-center gap-2 pt-0.5 text-tea-600/75">
                                <a className="hover:text-tea-950 transition-colors" href="#privasi">Privasi</a>
                                <span>•</span>
                                <a className="hover:text-tea-950 transition-colors" href="#syarat">Syarat Layanan</a>
                            </div>
                        </div>
                    </div>
                </main>

                <footer className="w-full py-5 px-8 flex flex-col sm:flex-row justify-between items-center text-[11px] text-tea-700/80 max-w-7xl mx-auto gap-2 border-t border-tea-200/60">
                    <p>© 2025 Justmine Tea Atelier • Racikan Tradisi Teh Melati Murni</p>
                    <div className="flex items-center gap-4">
                        <span>Bandung &amp; Halimun, Jawa Barat</span>
                        <span className="w-1 h-1 rounded-full bg-tea-300" />
                    </div>
                </footer>
            </div>
        </div>
    )
}