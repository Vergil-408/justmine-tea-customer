// Helper untuk mengompres foto profil avatar pengguna di browser.
// Menghasilkan crop persegi 1:1, maksimal 256x256, format WebP / JPEG (data URL base64).
// Ukuran file hasil kompresi biasanya ~10-25 KB, aman dan cepat disimpan di dokumen Firestore.

export const MAX_AVATAR_DIM = 256
export const MAX_FILE_BYTES = 10 * 1024 * 1024 // Batas upload 10 MB

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('File yang dipilih bukan gambar yang valid.'))
    }
    img.src = url
  })
}

function canEncodeWebp() {
  const c = document.createElement('canvas')
  c.width = c.height = 1
  return c.toDataURL('image/webp').startsWith('data:image/webp')
}

/**
 * Kompres file gambar menjadi data URL persegi 1:1
 * @param {File} file
 * @returns {Promise<string>} dataUrl string
 */
export async function compressAvatar(file) {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Pilih file gambar yang valid (JPG, PNG, atau WebP).')
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('Ukuran foto terlalu besar (maksimal 10 MB).')
  }

  const img = await loadImage(file)
  const nw = img.naturalWidth || img.width
  const nh = img.naturalHeight || img.height

  if (!nw || !nh) {
    throw new Error('Dimensi gambar tidak terbaca.')
  }

  // Crop tengah persegi (1:1)
  const size = Math.min(nw, nh)
  const sx = Math.round((nw - size) / 2)
  const sy = Math.round((nh - size) / 2)

  const canvas = document.createElement('canvas')
  const outSize = Math.min(size, MAX_AVATAR_DIM)
  canvas.width = outSize
  canvas.height = outSize

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Browser tidak mendukung pengolahan gambar.')

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, sx, sy, size, size, 0, 0, outSize, outSize)

  const mime = canEncodeWebp() ? 'image/webp' : 'image/jpeg'
  return canvas.toDataURL(mime, 0.85)
}
