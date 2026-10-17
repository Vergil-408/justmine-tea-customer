import { createContext, useContext, useState } from 'react'
import { lineKey } from '../utils/options.js'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])

  // item: { id, name, price, qty, type?, selectedOptions? }
  //  - price = harga SATUAN final (harga dasar + Σ priceDelta). Kontrak lama tidak berubah.
  //  - selectedOptions = snapshot [{ groupId, groupLabel, choiceId, choiceLabel, priceDelta, summary? }]
  // Identitas baris (cartId) = id menu + pilihan terurut:
  // teh sama dengan pilihan berbeda = baris berbeda, pilihan sama = qty bertambah.
  function addItem(item) {
    const selectedOptions = item.selectedOptions ?? []
    const cartId = lineKey(item.id, selectedOptions)
    const qty = item.qty ?? 1
    setItems((prev) => {
      const hit = prev.find((i) => i.cartId === cartId)
      if (hit) {
        return prev.map((i) => (i.cartId === cartId ? { ...i, qty: i.qty + qty } : i))
      }
      return [
        ...prev,
        {
          ...item,
          qty,
          selectedOptions,
          type: item.type ?? (selectedOptions.length > 0 ? 'custom' : 'signature'),
          detail: null, // field lama; dikosongkan supaya pembaca lama tidak crash
          cartId,
        },
      ]
    })
  }

  function removeItem(cartId) {
    setItems((prev) => prev.filter((i) => i.cartId !== cartId))
  }

  function updateQty(cartId, qty) {
    if (qty < 1) return
    setItems((prev) => prev.map((i) => (i.cartId === cartId ? { ...i, qty } : i)))
  }

  function clearCart() {
    setItems([])
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, subtotal }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
