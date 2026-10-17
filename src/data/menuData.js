// SEED/fallback untuk testing sebelum App Kasir ada.
// Struktur field HARUS sama dengan dokumen Firestore collection "menuItems".
//
// Kustomisasi = DATA per menu (bukan tipe menu):
//   customizable: saklar utama
//   optionGroupIds: id grup dari "optionGroups" (urutan = urutan tampil)
//   optionOverrides: { [groupId]: { defaultChoiceId?, hiddenChoiceIds? } }
//
// `category` sekarang hanya label/filter. Alur tidak lagi bergantung padanya
// (kecuali fallback menu lama tanpa optionGroupIds, lihat utils/options.js).
// `basePrice` di item cus-* dipertahankan sementara supaya Menu.jsx/Customize.jsx
// versi lama tetap jalan; hapus setelah keduanya diganti.

export const seedMenuItems = [
  {
    id: 'sig-1',
    category: 'signature',
    name: 'Jasmine Pure Tea',
    desc: 'Seduhan pucuk daun melati pegunungan aroma wangi lembut.',
    price: 22000,
    imageUrl: null,
    inStock: true,
    tag: null,
    customizable: true,
    optionGroupIds: ['es', 'gula'],
  },
  {
    id: 'sig-2',
    category: 'signature',
    name: 'Royal Earl Grey Lavender',
    desc: 'Seduhan teh hitam bergamot dengan infusi kuncup lavender.',
    price: 26000,
    imageUrl: null,
    inStock: true,
    tag: null,
    customizable: true,
    optionGroupIds: ['es', 'gula', 'catatan'],
  },
  {
    id: 'sig-3',
    category: 'signature',
    name: 'Roasted Oolong Reserve',
    desc: 'Oolong panggang tradisional arang bambu dengan aftertaste manis.',
    price: 28000,
    imageUrl: null,
    inStock: false,
    tag: null,
    customizable: true,
    optionGroupIds: ['es', 'gula'],
  },
  {
    id: 'sig-4',
    category: 'signature',
    name: 'Moonlight White Peony',
    desc: 'Daun teh putih lembut dipetik saat embun pagi dengan aroma floral.',
    price: 30000,
    imageUrl: null,
    inStock: true,
    tag: 'Limited',
    customizable: true,
    optionGroupIds: ['es', 'gula'],
    optionOverrides: { gula: { hiddenChoiceIds: ['g100'] } }, // contoh override
  },
  {
    id: 'cus-1',
    category: 'customizable',
    name: 'Jasmine Milk Tea (Custom)',
    desc: 'Teh melati harum dipadu susu segar pilihan, kustomisasi manis & topping.',
    price: 25000,
    basePrice: 25000, // legacy
    imageUrl: null,
    inStock: true,
    tag: null,
    customizable: true,
    optionGroupIds: ['base', 'es', 'gula', 'susu', 'topping', 'catatan'],
  },
  {
    id: 'cus-2',
    category: 'customizable',
    name: 'Oolong Botanical Blend',
    desc: 'Teh oolong dipadukan dengan pilihan susu oat dan jelly bunga osmanthus.',
    price: 27000,
    basePrice: 27000, // legacy
    imageUrl: null,
    inStock: true,
    tag: null,
    customizable: true,
    optionGroupIds: ['base', 'es', 'gula', 'susu', 'topping'],
    optionOverrides: { base: { defaultChoiceId: 'oolong' } },
  },
  {
    id: 'cus-3',
    category: 'customizable',
    name: 'Chamomile Herbal Cloud',
    desc: 'Infusi chamomile menenangkan dengan busa susu lembut dan madu.',
    price: 26000,
    basePrice: 26000, // legacy
    imageUrl: null,
    inStock: true,
    tag: null,
    customizable: true,
    optionGroupIds: ['base', 'es', 'gula', 'susu'],
    optionOverrides: { base: { defaultChoiceId: 'chamomile' }, es: { defaultChoiceId: 'panas' } },
  },

  // ---- Menu contoh tambahan (PLACEHOLDER, ganti dengan menu asli lewat App Kasir) ----
  {
    id: 'sig-5',
    category: 'signature',
    name: 'Green Tea Classic',
    desc: 'Teh hijau seduh murni tanpa tambahan. Contoh menu TANPA opsi.',
    price: 20000,
    imageUrl: null,
    inStock: true,
    tag: null,
    customizable: false,
    optionGroupIds: [],
  },
  {
    id: 'sig-6',
    category: 'signature',
    name: 'Black Tea Classic',
    desc: 'Teh hitam seduh klasik, bisa diatur es dan gula.',
    price: 20000,
    imageUrl: null,
    inStock: true,
    tag: null,
    customizable: true,
    optionGroupIds: ['es', 'gula'],
  },
  {
    id: 'cus-4',
    category: 'customizable',
    name: 'Lemon Black Tea',
    desc: 'Teh hitam segar dengan lemon, bisa ditambah topping.',
    price: 23000,
    basePrice: 23000, // legacy
    imageUrl: null,
    inStock: true,
    tag: null,
    customizable: true,
    optionGroupIds: ['es', 'gula', 'topping'],
  },
  {
    id: 'cus-5',
    category: 'customizable',
    name: 'Matcha Milk Tea',
    desc: 'Matcha dipadu susu, lengkap dengan pilihan susu dan topping.',
    price: 29000,
    basePrice: 29000, // legacy
    imageUrl: null,
    inStock: true,
    tag: null,
    customizable: true,
    optionGroupIds: ['es', 'gula', 'susu', 'topping', 'catatan'],
  },
]

// DEPRECATED: dipakai Customize.jsx lama saja. Hapus setelah Customize dinamis dipasang.
export const customizeOptions = {
  base: ['Jasmine', 'Oolong', 'Green Tea', 'Black Tea', 'Chamomile'],
  milk: ['Original', 'Oat'],
  toppings: [
    { id: 'pearl', name: 'Pearl', price: 3000 },
    { id: 'jelly', name: 'Jelly', price: 3000 },
    { id: 'lemon', name: 'Lemon Slice', price: 2000 },
  ],
}
