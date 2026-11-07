import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { clearTableStorage, loadTable, readTableFromSearch, saveTable } from '../utils/table.js'

const TableContext = createContext({
  table: null,
  setTableNumber: () => {},
  clearTable: () => {},
  isScannerOpen: false,
  openScanner: () => {},
  closeScanner: () => {},
})

// Membaca ?meja=NN dari URL setiap navigasi, menyimpannya, lalu menyediakannya ke seluruh app.
// Scan QR meja lain otomatis menimpa nomor yang lama.
export function TableProvider({ children }) {
  const { search } = useLocation()
  const [table, setTable] = useState(loadTable)
  const [isScannerOpen, setIsScannerOpen] = useState(false)

  useEffect(() => {
    const fromUrl = readTableFromSearch(search)
    if (fromUrl) {
      saveTable(fromUrl)
      setTable(fromUrl)
    }
  }, [search])

  const setTableNumber = (num) => {
    if (!num) {
      clearTableStorage()
      setTable(null)
      return
    }
    saveTable(num)
    setTable(num)
  }

  const clearTable = () => {
    clearTableStorage()
    setTable(null)
  }

  const openScanner = () => setIsScannerOpen(true)
  const closeScanner = () => setIsScannerOpen(false)

  const value = useMemo(
    () => ({
      table,
      setTableNumber,
      clearTable,
      isScannerOpen,
      openScanner,
      closeScanner,
    }),
    [table, isScannerOpen]
  )

  return <TableContext.Provider value={value}>{children}</TableContext.Provider>
}

export function useTable() {
  return useContext(TableContext)
}
