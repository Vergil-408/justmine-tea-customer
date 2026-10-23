export const isValidEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || '').trim())

export const isValidPhone = (s) => {
  const clean = String(s || '').replace(/[\s-]/g, '')
  return /^(\+62|62|0)8[1-9][0-9]{6,11}$/.test(clean)
}

export function formatPhoneId(s) {
  let clean = String(s || '').replace(/[\s-]/g, '').trim()
  if (clean.startsWith('0')) clean = '62' + clean.slice(1)
  if (clean.startsWith('+62')) clean = clean.slice(1)
  return clean
}

export function loginErrorMessage(code) {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'Email atau password salah.'
    case 'auth/user-disabled':
      return 'Akun ini dinonaktifkan. Hubungi admin Justmine Tea.'
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.'
    case 'auth/network-request-failed':
      return 'Koneksi internet terputus. Silakan periksa jaringanmu.'
    case 'auth/operation-not-allowed':
      return 'Login Email/Password belum diaktifkan di Firebase Console.'
    default:
      return 'Gagal masuk. Silakan coba lagi.'
  }
}

export function registerErrorMessage(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Email ini sudah terdaftar. Silakan klik Masuk.'
    case 'auth/invalid-email':
      return 'Format email tidak valid.'
    case 'auth/weak-password':
      return 'Password minimal 6 karakter.'
    case 'auth/operation-not-allowed':
      return 'Pendaftaran akun email belum diaktifkan di Firebase Console.'
    case 'auth/network-request-failed':
      return 'Koneksi internet terputus. Silakan periksa jaringanmu.'
    default:
      return 'Gagal mendaftar. Silakan coba lagi.'
  }
}

export function resetErrorMessage(code) {
  switch (code) {
    case 'auth/user-not-found':
      return null
    case 'auth/invalid-email':
      return 'Format email tidak valid.'
    case 'auth/too-many-requests':
      return 'Terlalu banyak permintaan reset. Tunggu beberapa saat.'
    case 'auth/network-request-failed':
      return 'Koneksi internet terputus. Silakan periksa jaringanmu.'
    default:
      return 'Gagal mengirim email reset. Silakan coba lagi.'
  }
}
