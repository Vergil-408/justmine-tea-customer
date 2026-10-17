import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { loadTable, readTableFromSearch, saveTable } from '../utils/table.js'

const TableContext = createContext({ table: null })

// Membaca ?meja=NN dari URL setiap navigasi, menyimpannya, lalu menyediakannya ke seluruh app.
// Scan QR meja lain otomatis menimpa nomor yang lama.
export function TableProvider({ children }) {
  const { search } = useLocation()
  const [table, setTable] = useState(loadTable)

  useEffect(() => {
    const fromUrl = readTableFromSearch(search)
    if (fromUrl) {
      saveTable(fromUrl)
      setTable(fromUrl)
    }
  }, [search])

  const value = useMemo(() => ({ table }), [table])
  return <TableContext.Provider value={value}>{children}</TableContext.Provider>
}

export function useTable() {
  return useContext(TableContext)
}
