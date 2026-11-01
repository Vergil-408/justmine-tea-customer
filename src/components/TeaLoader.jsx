export default function TeaLoader({
  message = 'Menyeduh tehmu...',
  submessage,
  size = 'md',
  fullScreen = false,
  overlay = false,
  className = '',
}) {
  const sizeMap = {
    sm: {
      svg: 36,
      circle: 'w-14 h-14',
      title: 'text-xs',
      sub: 'text-[11px]',
    },
    md: {
      svg: 52,
      circle: 'w-20 h-20',
      title: 'text-sm sm:text-base',
      sub: 'text-xs',
    },
    lg: {
      svg: 68,
      circle: 'w-24 h-24',
      title: 'text-base sm:text-lg',
      sub: 'text-xs sm:text-sm',
    },
  }

  const s = sizeMap[size] || sizeMap.md

  const content = (
    <div className={`flex flex-col items-center text-center select-none ${className}`}>
      {/* Container Ikon Cangkir & Uap Mengepul */}
      <div className="relative mb-3 flex items-center justify-center">
        {/* Glow lingkaran halus bertema botanical/sage */}
        <div
          className={`absolute rounded-full bg-primary-fixed/70 animate-tea-glow ${s.circle}`}
          aria-hidden="true"
        />

        {/* SVG Cangkir Teh dengan Uap Beranimasi */}
        <svg
          width={s.svg}
          height={s.svg}
          viewBox="0 0 50 50"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 drop-shadow-xs"
          aria-label="Animasi teh sedang diseduh"
        >
          {/* Uap 1 (Kiri) */}
          <path
            d="M19 18 C16 14, 21 10, 18 6 C17 4, 18 2, 19 1"
            stroke="#A1701F"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
            className="animate-steam-1"
          />

          {/* Uap 2 (Tengah) */}
          <path
            d="M25 17 C28 13, 23 9, 26 5 C27 3, 26 1.5, 25 0.5"
            stroke="#366A4E"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            className="animate-steam-2"
          />

          {/* Uap 3 (Kanan) */}
          <path
            d="M31 18 C34 14, 29 10, 32 6 C33 4, 32 2, 31 1"
            stroke="#A1701F"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
            className="animate-steam-3"
          />

          {/* Gagang Cangkir */}
          <path
            d="M36 24 C41 24, 43 29, 40 33 C38 35, 35 34, 34 33"
            stroke="#1E3A2F"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Badan Cangkir */}
          <path
            d="M12 22 C12 34, 17 37, 25 37 C33 37, 38 34, 38 22 Z"
            fill="#1E3A2F"
          />

          {/* Bibir Cangkir Atas */}
          <ellipse cx="25" cy="22" rx="13" ry="3.5" fill="#264B3C" />

          {/* Permukaan Teh Wangi / Melati di Dalam Cangkir */}
          <ellipse cx="25" cy="22.5" rx="11" ry="2.6" fill="#A1701F" opacity="0.95" />

          {/* Piringan / Tatakan Cangkir (Saucer) */}
          <ellipse cx="25" cy="40" rx="18" ry="2.8" fill="#366A4E" opacity="0.85" />
          <path
            d="M10 40 Q25 44 40 40"
            stroke="#1E3A2F"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Teks Pesan Loading */}
      {message && (
        <h4 className={`font-serif font-bold text-on-surface tracking-tight ${s.title}`}>
          {message}
        </h4>
      )}

      {/* Teks Deskripsi Tambahan Opsional */}
      {submessage && (
        <p className={`mt-1 text-on-surface-variant max-w-xs font-normal leading-relaxed ${s.sub}`}>
          {submessage}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-md p-6"
      >
        {content}
      </div>
    )
  }

  if (overlay) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 backdrop-blur-xs p-4"
      >
        <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-sm w-full mx-auto">
          {content}
        </div>
      </div>
    )
  }

  return (
    <div role="status" aria-live="polite" className="py-6">
      {content}
    </div>
  )
}
