import { createContext, useContext, useState } from 'react'

const CartSheetContext = createContext(null)

export function CartSheetProvider({ children }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <CartSheetContext.Provider value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}>
            {children}
        </CartSheetContext.Provider>
    )
}

export function useCartSheet() {
    return useContext(CartSheetContext)
}