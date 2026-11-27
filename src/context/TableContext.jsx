import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  clearTableStorage,
  loadTable,
  loadTableLocked,
  loadTableSession,
  readTableTokenFromSearch,
  saveTable,
  saveTableLocked,
  saveTableSession,
} from '../utils/table.js'

const TableContext = createContext({
  table: null,
  tableSessionId: null,
  isLocked: false,
  validatingTable: false,
  tableError: '',
  clearTableError: () => {},
  validateQrPayload: async () => ({ valid: false }),
  clearTable: () => {},
  isScannerOpen: false,
  openScanner: () => {},
  closeScanner: () => {},
})

export function TableProvider({ children }) {
  const { search } = useLocation()
  const [table, setTable] = useState(() => {
    const t = loadTable()
    const s = loadTableSession()
    return t && s ? t : null
  })
  const [tableSessionId, setTableSessionId] = useState(loadTableSession)
  const [isLocked, setIsLocked] = useState(() => Boolean(loadTable() && loadTableSession() && loadTableLocked()))
  const [validatingTable, setValidatingTable] = useState(false)
  const [tableError, setTableError] = useState('')
  const [isScannerOpen, setIsScannerOpen] = useState(false)

  const clearTable = useCallback(() => {
    clearTableStorage()
    setTable(null)
    setTableSessionId(null)
    setIsLocked(false)
  }, [])

  const validateQrPayload = useCallback(async ({ table: rawTable, token }) => {
    if (!rawTable || !token) {
      clearTable()
      const msg = 'QR meja tidak memiliki token yang valid. Mode dialihkan ke Takeaway.'
      setTableError(msg)
      return { valid: false, error: msg }
    }

    setValidatingTable(true)
    setTableError('')
    try {
      const res = await fetch('/api/table/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: rawTable, token }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 429) {
        const msg = data.error || 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.'
        setTableError(msg)
        return { valid: false, error: msg }
      }
      if (!res.ok || !data.valid || !data.sessionId || !data.tableNumber) {
        clearTable()
        const msg = data.error || 'QR meja tidak valid atau sudah tidak aktif.'
        setTableError(msg)
        return { valid: false, error: msg }
      }

      saveTable(data.tableNumber)
      saveTableSession(data.sessionId)
      saveTableLocked(true)
      setTable(data.tableNumber)
      setTableSessionId(data.sessionId)
      setIsLocked(true)
      return { valid: true, sessionId: data.sessionId, tableNumber: data.tableNumber }
    } catch {
      const msg = 'Gagal memverifikasi QR meja ke server. Periksa koneksi internet.'
      setTableError(msg)
      return { valid: false, error: msg }
    } finally {
      setValidatingTable(false)
    }
  }, [clearTable])

  useEffect(() => {
    const parsed = readTableTokenFromSearch(search)
    if (!parsed) return

    // Skenario C: URL punya ?table=X tapi tanpa token -> tolak Dine-in & fallback Takeaway
    if (!parsed.token) {
      clearTable()
      setTableError('Akses meja memerlukan scan QR resmi di meja. Mode dialihkan ke Takeaway.')
      return
    }

    validateQrPayload(parsed)
  }, [search, clearTable, validateQrPayload])

  const openScanner = useCallback(() => {
    setIsScannerOpen(true)
  }, [])

  const closeScanner = useCallback(() => setIsScannerOpen(false), [])
  const clearTableError = useCallback(() => setTableError(''), [])

  const value = useMemo(
    () => ({
      table,
      tableSessionId,
      isLocked,
      validatingTable,
      tableError,
      clearTableError,
      validateQrPayload,
      clearTable,
      isScannerOpen,
      openScanner,
      closeScanner,
    }),
    [
      table,
      tableSessionId,
      isLocked,
      validatingTable,
      tableError,
      clearTableError,
      validateQrPayload,
      clearTable,
      isScannerOpen,
      openScanner,
      closeScanner,
    ]
  )

  return <TableContext.Provider value={value}>{children}</TableContext.Provider>
}

export function useTable() {
  return useContext(TableContext)
}
