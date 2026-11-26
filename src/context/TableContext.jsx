import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  clearTableStorage,
  loadTable,
  loadTableLocked,
  readTableFromSearch,
  saveTable,
  saveTableLocked,
} from '../utils/table.js'

const TableContext = createContext({
  table: null,
  isLocked: false,
  setTableNumber: () => {},
  clearTable: () => {},
  isScannerOpen: false,
  openScanner: () => {},
  closeScanner: () => {},
})

// Membaca ?meja=NN atau ?table=NN dari URL setiap navigasi.
// Jika didapat dari URL / hasil scan QR, nomor meja dikunci (read-only) agar tidak bisa diubah sembarangan.
export function TableProvider({ children }) {
  const { search } = useLocation()
  const [table, setTable] = useState(loadTable)
  const [isLocked, setIsLocked] = useState(loadTableLocked)
  const [isScannerOpen, setIsScannerOpen] = useState(false)

  useEffect(() => {
    const fromUrl = readTableFromSearch(search)
    if (fromUrl) {
      saveTable(fromUrl)
      saveTableLocked(true)
      setTable(fromUrl)
      setIsLocked(true)
    }
  }, [search])

  const setTableNumber = (num, { locked = false } = {}) => {
    if (!num) {
      clearTableStorage()
      setTable(null)
      setIsLocked(false)
      return
    }
    saveTable(num)
    saveTableLocked(locked)
    setTable(num)
    setIsLocked(locked)
  }

  const clearTable = () => {
    clearTableStorage()
    setTable(null)
    setIsLocked(false)
  }

  const openScanner = () => {
    if (isLocked) return
    setIsScannerOpen(true)
  }
  const closeScanner = () => setIsScannerOpen(false)

  const value = useMemo(
    () => ({
      table,
      isLocked,
      setTableNumber,
      clearTable,
      isScannerOpen,
      openScanner,
      closeScanner,
    }),
    [table, isLocked, isScannerOpen]
  )

  return <TableContext.Provider value={value}>{children}</TableContext.Provider>
}

export function useTable() {
  return useContext(TableContext)
}
