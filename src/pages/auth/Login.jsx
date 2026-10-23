import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import {
    isValidEmail,
    isValidPhone,
    loginErrorMessage,
    registerErrorMessage,
    resetErrorMessage
} from '../../utils/authErrors.js'

function GoogleIcon({ className = 'w-5 h-5' }) {
    return (
        <svg className={className} viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
        </svg>
    )
}

function EmblemPlaceholder({ className = '' }) {
    return (
        <div className={`bg-gradient-to-b from-[#EAE6D6] to-[#FAF7F0] flex items-center justify-center ${className}`}>
            <span className="material-symbols-outlined text-primary text-[32px]">spa</span>
        </div>
    )
}

const inputCls =
    'w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all'

export default function Login() {
    const { user, loginWithGoogle, registerWithEmail, loginWithEmail, resetPassword } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const from = location.state?.from || '/'
    const isFromCheckout = from === '/checkout' || location.state?.promptSignup

    // 'signup' | 'login' | 'reset'
    const [mode, setMode] = useState(isFromCheckout ? 'signup' : 'login')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    // Form inputs
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    // Jika sudah login, langsung lanjutkan ke halaman asal
    useEffect(() => {
        if (user) {
            navigate(from, { replace: true })
        }
    }, [user, from, navigate])

    function switchMode(next) {
        setMode(next)
        setError('')
        setNotice('')
    }

    async function handleRegister(e) {
        e.preventDefault()
        setError('')
        setNotice('')

        if (!name.trim()) return setError('Nama lengkap wajib diisi.')
        if (!phone.trim()) return setError('Nomor WhatsApp / HP wajib diisi.')
        if (!isValidPhone(phone)) return setError('Format nomor HP tidak valid (contoh: 08123456789).')
        if (!isValidEmail(email)) return setError('Format email tidak valid.')
        if (!password || password.length < 6) return setError('Password minimal 6 karakter.')

        setLoading(true)
        try {
            await registerWithEmail({
                name: name.trim(),
                phone: phone.trim(),
                email: email.trim().toLowerCase(),
                password,
            })
            // AuthContext onAuthStateChanged will handle navigate back to 'from'
        } catch (err) {
            setError(registerErrorMessage(err.code))
            setLoading(false)
        }
    }

    async function handleLoginEmail(e) {
        e.preventDefault()
        setError('')
        setNotice('')

        if (!isValidEmail(email)) return setError('Format email tidak valid.')
        if (!password) return setError('Password wajib diisi.')

        setLoading(true)
        try {
            await loginWithEmail(email.trim().toLowerCase(), password)
            // AuthContext will navigate back
        } catch (err) {
            setError(loginErrorMessage(err.code))
            setLoading(false)
        }
    }

    async function handleResetPassword(e) {
        e.preventDefault()
        setError('')
        setNotice('')

        if (!isValidEmail(email)) return setError('Masukkan email yang valid.')

        setLoading(true)
        try {
            await resetPassword(email.trim().toLowerCase())
            setNotice('Tautan untuk membuat password baru sudah dikirim ke email kamu. Cek Inbox (atau Spam).')
        } catch (err) {
            const msg = resetErrorMessage(err.code)
            if (msg) setError(msg)
            else setNotice('Tautan untuk membuat password baru sudah dikirim ke email kamu. Cek Inbox (atau Spam).')
        } finally {
            setLoading(false)
        }
    }

    async function handleGoogleLogin() {
        setLoading(true)
        setError('')
        try {
            await loginWithGoogle()
            navigate(from, { replace: true })
        } catch (err) {
            if (err.code !== 'auth/popup-closed-by-user') {
                setError('Gagal masuk dengan Google. Coba lagi atau gunakan email & password.')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background font-sans text-on-surface py-8 px-4 flex flex-col justify-center items-center relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-secondary-container/50 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-secondary-container/50 blur-3xl pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                {/* Brand Header */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full mx-auto p-1 bg-surface-container-lowest border border-outline-variant/60 shadow-sm flex items-center justify-center mb-3">
                        <EmblemPlaceholder className="w-full h-full rounded-full" />
                    </div>
                    <h1 className="font-serif text-3xl font-medium tracking-tight text-primary">
                        Justmine <span className="italic">Tea</span>
                    </h1>
                    <p className="text-xs text-on-surface-variant mt-1">
                        {isFromCheckout ? 'Daftar akun member untuk melanjutkan pesanan' : 'Sistem Keanggotaan & Loyalty Member'}
                    </p>
                </div>

                {/* Banner kalau diarahkan dari Checkout */}
                {isFromCheckout && (
                    <div className="mb-4 p-3.5 rounded-2xl bg-secondary-container text-on-secondary-container border border-primary/20 text-xs flex items-center gap-2.5 shadow-sm">
                        <span className="material-symbols-outlined text-[20px] text-primary shrink-0">shopping_bag</span>
                        <span>Pesananmu sudah tersimpan! Selesaikan pendaftaran di bawah agar pesanan langsung diproses.</span>
                    </div>
                )}

                {/* Kotak Utama Card Auth */}
                <div className="bg-surface-container-lowest border border-outline-variant/60 shadow-md rounded-3xl p-6 sm:p-8">
                    {/* Mode Tabs (Daftar / Masuk) */}
                    {mode !== 'reset' && (
                        <div className="flex rounded-xl bg-surface-container-low p-1 mb-6">
                            <button
                                type="button"
                                onClick={() => switchMode('signup')}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                                    mode === 'signup'
                                        ? 'bg-white text-primary shadow-sm'
                                        : 'text-on-surface-variant hover:text-on-surface'
                                }`}
                            >
                                Daftar Baru
                            </button>
                            <button
                                type="button"
                                onClick={() => switchMode('login')}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                                    mode === 'login'
                                        ? 'bg-white text-primary shadow-sm'
                                        : 'text-on-surface-variant hover:text-on-surface'
                                }`}
                            >
                                Masuk Akun
                            </button>
                        </div>
                    )}

                    {/* FORM SIGN UP */}
                    {mode === 'signup' && (
                        <form onSubmit={handleRegister} className="space-y-3.5" noValidate>
                            <div>
                                <label className="block text-xs font-bold text-on-surface-variant mb-1" htmlFor="signup-name">
                                    Nama Lengkap
                                </label>
                                <input
                                    id="signup-name"
                                    type="text"
                                    autoComplete="name"
                                    placeholder="Contoh: Hafidz Diaz"
                                    value={name}
                                    onChange={(e) => { setName(e.target.value); setError('') }}
                                    className={inputCls}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-on-surface-variant mb-1" htmlFor="signup-phone">
                                    Nomor WhatsApp / HP <span className="font-normal text-[11px] text-on-surface-variant">(ID Member Kasir)</span>
                                </label>
                                <input
                                    id="signup-phone"
                                    type="tel"
                                    autoComplete="tel"
                                    placeholder="Contoh: 081234567890"
                                    value={phone}
                                    onChange={(e) => { setPhone(e.target.value); setError('') }}
                                    className={inputCls}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-on-surface-variant mb-1" htmlFor="signup-email">
                                    Email
                                </label>
                                <input
                                    id="signup-email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="nama@email.com"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setError('') }}
                                    className={inputCls}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-on-surface-variant mb-1" htmlFor="signup-password">
                                    Kata Sandi <span className="font-normal text-[11px] text-on-surface-variant">(Min. 6 karakter)</span>
                                </label>
                                <div className="relative">
                                    <input
                                        id="signup-password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); setError('') }}
                                        className={`${inputCls} pr-11`}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">
                                            {showPassword ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {error && <p className="text-xs font-medium text-error text-center pt-1">{error}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-2 bg-primary hover:bg-primary-container text-white py-3.5 rounded-full text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
                            >
                                {loading ? 'Mendaftarkan Akun…' : 'Daftar & Lanjutkan'}
                            </button>
                        </form>
                    )}

                    {/* FORM LOGIN */}
                    {mode === 'login' && (
                        <form onSubmit={handleLoginEmail} className="space-y-3.5" noValidate>
                            <div>
                                <label className="block text-xs font-bold text-on-surface-variant mb-1" htmlFor="login-email">
                                    Email
                                </label>
                                <input
                                    id="login-email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="nama@email.com"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setError('') }}
                                    className={inputCls}
                                    required
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-xs font-bold text-on-surface-variant" htmlFor="login-password">
                                        Kata Sandi
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => switchMode('reset')}
                                        className="text-[11px] font-semibold text-primary hover:underline"
                                    >
                                        Lupa kata sandi?
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        id="login-password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); setError('') }}
                                        className={`${inputCls} pr-11`}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">
                                            {showPassword ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {error && <p className="text-xs font-medium text-error text-center pt-1">{error}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-2 bg-primary hover:bg-primary-container text-white py-3.5 rounded-full text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
                            >
                                {loading ? 'Memeriksa Akun…' : 'Masuk'}
                            </button>
                        </form>
                    )}

                    {/* FORM RESET PASSWORD */}
                    {mode === 'reset' && (
                        <form onSubmit={handleResetPassword} className="space-y-3.5 text-center" noValidate>
                            <span className="material-symbols-outlined text-[36px] text-primary">lock_reset</span>
                            <h2 className="text-base font-bold">Atur Ulang Kata Sandi</h2>
                            <p className="text-xs text-on-surface-variant leading-relaxed">
                                Masukkan email yang terdaftar. Kami akan mengirimkan tautan untuk membuat kata sandi baru.
                            </p>

                            <div className="text-left pt-2">
                                <label className="block text-xs font-bold text-on-surface-variant mb-1" htmlFor="reset-email">
                                    Email Terdaftar
                                </label>
                                <input
                                    id="reset-email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="nama@email.com"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setError(''); setNotice('') }}
                                    className={inputCls}
                                    required
                                />
                            </div>

                            {error && <p className="text-xs font-medium text-error text-center">{error}</p>}
                            {notice && (
                                <p className="text-xs font-semibold text-primary bg-secondary-container p-3 rounded-xl">
                                    {notice}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-2 bg-primary hover:bg-primary-container text-white py-3.5 rounded-full text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
                            >
                                {loading ? 'Mengirim Tautan…' : 'Kirim Tautan Reset'}
                            </button>

                            <button
                                type="button"
                                onClick={() => switchMode('login')}
                                className="w-full text-xs font-bold text-on-surface-variant hover:text-primary py-2"
                            >
                                ← Kembali ke halaman Masuk
                            </button>
                        </form>
                    )}

                    {/* Social Login Divider */}
                    {mode !== 'reset' && (
                        <div className="mt-6 pt-5 border-t border-outline-variant/60">
                            <div className="relative flex py-2 items-center justify-center mb-3">
                                <div className="flex-grow border-t border-outline-variant/40" />
                                <span className="flex-shrink mx-3 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                                    atau lanjutkan dengan
                                </span>
                                <div className="flex-grow border-t border-outline-variant/40" />
                            </div>

                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-surface-container-low active:scale-[0.99] border border-outline-variant/80 py-3 px-4 rounded-full text-xs font-bold text-on-surface shadow-sm transition-all disabled:opacity-50"
                            >
                                <GoogleIcon />
                                <span>Google</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer privasi */}
                <p className="text-[11px] text-center text-on-surface-variant mt-6">
                    Dengan mendaftar, kamu menyetujui Ketentuan & Kebijakan Privasi Justmine Tea.
                </p>
            </div>
        </div>
    )
}