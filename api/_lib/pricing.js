// Menghitung ulang harga di SERVER. Harga, nama, dan label opsi dari browser diabaikan sepenuhnya:
// yang dipakai hanya id menu, jumlah, dan id pilihan. Logika memakai helper yang sama dengan Customer App.
import {
  resolveOptions,
  normalizeSelection,
  validateSelection,
  buildSelectedOptions,
  computeUnitPrice,
} from '../../src/utils/options.js'
import { seedBundles } from '../../src/data/bundlesData.js'

const defaultBundlesById = new Map(seedBundles.map((b) => [b.id, b]))

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

export function priceCart(cartItems, menuById, groups, bundlesById = defaultBundlesById) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) throw new OrderError('Keranjang kosong.')
  if (cartItems.length > MAX_LINES) throw new OrderError('Terlalu banyak item dalam satu pesanan.')

  const items = []
  let subtotal = 0
  for (const line of cartItems) {
    const qty = Number(line?.qty)
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) throw new OrderError('Jumlah item tidak valid.')

    // ================= VALIDASI PAKET BUNDLING =================
    if (line?.isBundle) {
      const bundle = (bundlesById || defaultBundlesById).get(String(line.id))
      if (!bundle) throw new OrderError('Paket bundling sudah tidak tersedia.', 409)

      let unitPrice = bundle.price
      const formattedSlots = []

      for (const slot of bundle.slots || []) {
        const submittedSlot = (line.bundleSlots || []).find((s) => s.slotId === slot.id)
        if (!submittedSlot) throw new OrderError(`Pilihan minuman untuk ${slot.label || slot.id} belum lengkap.`)

        const chosenDrink = menuById.get(String(submittedSlot.menuId))
        if (!chosenDrink) throw new OrderError('Minuman yang dipilih dalam paket tidak valid.')
        if (chosenDrink.inStock === false) throw new OrderError(`${chosenDrink.name} sedang habis.`, 409)
        if (!slot.allowedCategories.includes(chosenDrink.category)) {
          throw new OrderError(`${chosenDrink.name} tidak termasuk dalam kategori paket ${bundle.name}.`)
        }

        let toppingPrice = 0
        if (submittedSlot.topping && !slot.freeTopping) {
          const toppingGroup = groups.find((g) => g.id === 'topping')
          const foundTopping = toppingGroup?.choices?.find((c) => c.id === submittedSlot.topping)
          toppingPrice = foundTopping?.priceDelta || 3000
          unitPrice += toppingPrice
        }

        formattedSlots.push({
          slotId: slot.id,
          slotTitle: slot.label,
          menuId: chosenDrink.id,
          drinkName: chosenDrink.name,
          sugar: submittedSlot.sugar || 'normal',
          sugarLabel: submittedSlot.sugarLabel || 'Normal',
          ice: submittedSlot.ice || 'normal',
          iceLabel: submittedSlot.iceLabel || 'Normal Ice',
          topping: submittedSlot.topping || null,
          toppingLabel: submittedSlot.toppingLabel || null,
          toppingPrice,
          note: String(submittedSlot.note || '').slice(0, 80),
        })
      }

      items.push({
        id: bundle.id,
        name: bundle.name,
        qty,
        price: unitPrice,
        type: 'bundle',
        isBundle: true,
        bundleSlots: formattedSlots,
        selectedOptions: [],
        detail: null,
      })
      subtotal += unitPrice * qty
      continue
    }

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
