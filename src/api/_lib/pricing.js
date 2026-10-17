// Menghitung ulang harga di SERVER. Harga, nama, dan label opsi dari browser diabaikan sepenuhnya:
// yang dipakai hanya id menu, jumlah, dan id pilihan. Logika memakai helper yang sama dengan Customer App.
import {
  resolveOptions,
  normalizeSelection,
  validateSelection,
  buildSelectedOptions,
  computeUnitPrice,
} from '../../src/utils/options.js'

export class OrderError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.status = status
  }
}

const MAX_LINES = 30
const MAX_QTY = 50

// selectedOptions (snapshot keranjang) -> selection { [groupId]: string[] | string(note) }
export function selectionFromOptions(selectedOptions) {
  const sel = {}
  for (const o of Array.isArray(selectedOptions) ? selectedOptions : []) {
    if (!o || typeof o.groupId !== 'string') continue
    if (o.choiceId === 'note') {
      sel[o.groupId] = String(o.choiceLabel || '').slice(0, 120)
    } else {
      const list = sel[o.groupId] || []
      const id = String(o.choiceId)
      if (!list.includes(id)) list.push(id) // buang duplikat supaya topping tidak ditagih dobel
      sel[o.groupId] = list
    }
  }
  return sel
}

export function priceCart(cartItems, menuById, groups) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) throw new OrderError('Keranjang kosong.')
  if (cartItems.length > MAX_LINES) throw new OrderError('Terlalu banyak item dalam satu pesanan.')

  const items = []
  let subtotal = 0
  for (const line of cartItems) {
    const qty = Number(line?.qty)
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) throw new OrderError('Jumlah item tidak valid.')

    const menu = menuById.get(String(line?.id))
    if (!menu) throw new OrderError('Ada menu yang sudah tidak tersedia. Muat ulang halaman menu.', 409)
    if (menu.inStock === false) throw new OrderError(`${menu.name} sedang habis.`, 409)

    const resolved = resolveOptions(menu, groups)
    const selection = normalizeSelection(resolved, selectionFromOptions(line.selectedOptions))
    const { valid, errors } = validateSelection(resolved, selection)
    if (!valid) throw new OrderError(`${menu.name}: ${errors[0].message}`, 409)

    const selectedOptions = buildSelectedOptions(resolved, selection)
    const price = computeUnitPrice(menu, selectedOptions)
    if (!Number.isInteger(price) || price <= 0) throw new OrderError(`Harga ${menu.name} tidak valid.`, 500)

    items.push({
      id: menu.id,
      name: menu.name,
      qty,
      price,
      type: selectedOptions.length > 0 ? 'custom' : 'signature',
      selectedOptions,
      detail: null,
    })
    subtotal += price * qty
  }
  return { items, subtotal }
}
