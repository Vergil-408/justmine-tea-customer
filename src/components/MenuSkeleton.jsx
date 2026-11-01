export function SkeletonCard() {
  return (
    <div
      aria-hidden="true"
      className="bg-surface-container-lowest rounded-2xl lg:rounded-3xl border border-outline-variant/50 shadow-xs p-2 lg:p-3 flex flex-col justify-between"
    >
      <div>
        {/* Placeholder Foto Menu */}
        <div className="relative rounded-xl lg:rounded-2xl overflow-hidden mb-2.5 bg-surface-container skeleton-shimmer w-full h-32 lg:h-48" />

        {/* Placeholder Kategori & Nama Menu */}
        <div className="px-1 space-y-2">
          <div className="h-3 w-24 rounded-full bg-surface-container skeleton-shimmer" />
          <div className="h-4 w-4/5 rounded-md bg-surface-container skeleton-shimmer" />
          <div className="space-y-1 pt-0.5">
            <div className="h-2.5 w-full rounded-sm bg-surface-container/70 skeleton-shimmer" />
            <div className="h-2.5 w-3/5 rounded-sm bg-surface-container/70 skeleton-shimmer" />
          </div>
        </div>
      </div>

      {/* Placeholder Harga & Tombol Tambah */}
      <div className="flex items-center justify-between mt-3 px-1 pt-2 border-t border-outline-variant/40">
        <div className="space-y-1">
          <div className="h-2 w-12 rounded-sm bg-surface-container/70 skeleton-shimmer" />
          <div className="h-4 w-20 rounded-md bg-surface-container skeleton-shimmer" />
        </div>
        <div className="w-8 h-8 rounded-full bg-surface-container skeleton-shimmer" />
      </div>
    </div>
  )
}

export default function MenuSkeleton({ count = 6 }) {
  const cards = Array.from({ length: count }, (_, i) => i)

  return (
    <div
      role="status"
      aria-label="Memuat menu..."
      className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 lg:gap-6"
    >
      {cards.map((idx) => (
        <SkeletonCard key={idx} />
      ))}
    </div>
  )
}
