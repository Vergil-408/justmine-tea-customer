import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { useTable } from '../context/TableContext.jsx'
import { parseTableFromInput } from '../utils/table.js'

const QUICK_TABLES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '12', '15']

export default function TableScannerModal() {
  const { table, setTableNumber, clearTable, isScannerOpen, closeScanner } = useTable()

  const [activeTab, setActiveTab] = useState('camera') // 'camera' | 'manual'
  const [manualInput, setManualInput] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [successTable, setSuccessTable] = useState('')
  const [cameraPermissionError, setCameraPermissionError] = useState(false)
  const [isInitializingCamera, setIsInitializingCamera] = useState(false)
  const [availableCameras, setAvailableCameras] = useState([])
  const [selectedCameraIndex, setSelectedCameraIndex] = useState(0)

  const scannerRef = useRef(null)
  const isStoppingRef = useRef(false)

  // Reset state saat modal dibuka
  useEffect(() => {
    if (isScannerOpen) {
      setErrorMsg('')
      setSuccessTable('')
      setCameraPermissionError(false)
      setManualInput(table || '')
    }
  }, [isScannerOpen, table])

  // Lifecycle scanner kamera (Mendukung Kamera HP & Webcam Laptop/PC)
  useEffect(() => {
    if (!isScannerOpen || activeTab !== 'camera' || successTable) {
      stopScanner()
      return
    }

    let isMounted = true
    isStoppingRef.current = false
    setIsInitializingCamera(true)
    setErrorMsg('')
    setCameraPermissionError(false)

    const qrElementId = 'justmine-table-qr-reader'

    const timer = setTimeout(async () => {
      if (!isMounted) return
      const container = document.getElementById(qrElementId)
      if (!container) return

      try {
        const html5Qr = new Html5Qrcode(qrElementId)
        scannerRef.current = html5Qr

        // 1. Coba deteksi daftar kamera yang tersedia di perangkat (HP atau Laptop)
        let devices = []
        try {
          devices = await Html5Qrcode.getCameras()
          if (isMounted && devices && devices.length > 0) {
            setAvailableCameras(devices)
          }
        } catch (e) {
          console.warn('Tidak dapat membaca daftar kamera via getCameras:', e)
        }

        // 2. Tentukan kamera yang akan digunakan
        let cameraConfig = null

        if (devices && devices.length > 0) {
          // Jika user memilih kamera tertentu via tombol switch
          if (selectedCameraIndex < devices.length) {
            cameraConfig = devices[selectedCameraIndex].id
          } else {
            // Prioritaskan kamera belakang jika di smartphone
            const backCam = devices.find((d) =>
              /back|rear|environment|belakang/i.test(d.label || '')
            )
            cameraConfig = backCam ? backCam.id : devices[0].id
          }
        } else {
          // Fallback ke facingMode environment
          cameraConfig = { facingMode: 'environment' }
        }

        const scanConfig = {
          fps: 10,
          qrbox: { width: 230, height: 230 },
          aspectRatio: 1.0,
        }

        // 3. Jalankan pemindaian kamera
        try {
          await html5Qr.start(
            cameraConfig,
            scanConfig,
            (decodedText) => {
              handleScanSuccess(decodedText)
            },
            () => {}
          )
        } catch (initialErr) {
          console.warn('Gagal dengan kamera primer, mencoba fallback webcam laptop/user:', initialErr)
          // Fallback penting untuk Laptop / Webcam yang tidak memiliki facingMode environment:
          await html5Qr.start(
            { facingMode: 'user' },
            scanConfig,
            (decodedText) => {
              handleScanSuccess(decodedText)
            },
            () => {}
          )
        }

        if (isMounted) {
          setIsInitializingCamera(false)
        }
      } catch (err) {
        console.warn('Gagal total mengakses kamera:', err)
        if (isMounted) {
          setIsInitializingCamera(false)
          setCameraPermissionError(true)
          setErrorMsg(
            'Kamera/webcam tidak dapat diakses atau izin belum diberikan di browser. Silakan izinkan akses kamera atau gunakan input manual.'
          )
        }
      }
    }, 150)

    return () => {
      isMounted = false
      clearTimeout(timer)
      stopScanner()
    }
  }, [isScannerOpen, activeTab, successTable, selectedCameraIndex])

  function stopScanner() {
    if (isStoppingRef.current) return
    isStoppingRef.current = true

    if (scannerRef.current) {
      const scanner = scannerRef.current
      scannerRef.current = null

      try {
        if (scanner.isScanning) {
          scanner
            .stop()
            .then(() => scanner.clear())
            .catch(() => {})
        } else {
          scanner.clear()
        }
      } catch (e) {
        console.warn('Error saat menghentikan scanner:', e)
      }
    }
  }

  function handleSwitchCamera() {
    if (availableCameras.length <= 1) return
    stopScanner()
    setSelectedCameraIndex((prev) => (prev + 1) % availableCameras.length)
  }

  function handleScanSuccess(rawResult) {
    const parsed = parseTableFromInput(rawResult)
    if (parsed) {
      setSuccessTable(parsed)
      setTableNumber(parsed)
      setErrorMsg('')
      stopScanner()

      // Tutup otomatis setelah feedback
      setTimeout(() => {
        closeScanner()
      }, 1400)
    } else {
      setErrorMsg(`QR tidak dikenali sebagai meja Justmine Tea (${rawResult.slice(0, 25)}...)`)
    }
  }

  function handleManualSubmit(e) {
    e?.preventDefault()
    setErrorMsg('')
    const parsed = parseTableFromInput(manualInput)
    if (!parsed) {
      setErrorMsg('Masukkan nomor meja yang valid (contoh: 12, A1, VIP-1)')
      return
    }

    setSuccessTable(parsed)
    setTableNumber(parsed)
    setTimeout(() => {
      closeScanner()
    }, 1000)
  }

  function handleSelectChip(val) {
    setManualInput(val)
    setErrorMsg('')
  }

  function handleClearTable() {
    clearTable()
    setManualInput('')
    setSuccessTable('')
    closeScanner()
  }

  if (!isScannerOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={closeScanner}
      role="dialog"
      aria-modal="true"
      aria-label="Scan QR Meja"
    >
      <div
        className="relative w-full max-w-sm rounded-3xl bg-[#FFFDF7] text-[#124734] shadow-2xl border border-stone-200/80 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif" }}
      >
        {/* Header Modal */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-stone-100">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[#124734]/10 text-[#124734] flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[18px]">table_restaurant</span>
            </span>
            <div>
              <h3 className="text-base font-bold text-[#124734] leading-tight">Pilih Nomor Meja</h3>
              <p className="text-[11px] text-[#124734]/70">Untuk pengantaran pesanan di outlet</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeScanner}
            className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 active:scale-90 flex items-center justify-center transition-transform"
            aria-label="Tutup"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Tab Navigasi: Kamera vs Input Manual */}
        <div className="p-3 bg-stone-50 border-b border-stone-100 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'camera'
                ? 'bg-[#124734] text-white shadow-xs'
                : 'bg-white text-stone-600 hover:bg-stone-100'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
            Kamera / Webcam
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'manual'
                ? 'bg-[#124734] text-white shadow-xs'
                : 'bg-white text-stone-600 hover:bg-stone-100'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">edit_note</span>
            Ketik Meja
          </button>
        </div>

        {/* Status Berhasil Terhubung */}
        {successTable ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs animate-bounce">
              <span className="material-symbols-outlined text-[32px]">check_circle</span>
            </div>
            <div>
              <p className="text-xs text-stone-500 font-medium">Berhasil Terhubung</p>
              <h4 className="text-2xl font-bold text-[#124734]">Meja {successTable}</h4>
            </div>
            <p className="text-xs text-stone-600 max-w-xs">
              Pesananmu akan langsung diantarkan ke meja ini.
            </p>
          </div>
        ) : (
          <div className="p-5">
            {/* TAB 1: SCAN KAMERA / WEBCAM */}
            {activeTab === 'camera' && (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-square flex items-center justify-center border border-stone-300">
                  {/* Container video HTML5 QR Code */}
                  <div id="justmine-table-qr-reader" className="w-full h-full" />

                  {/* Tombol Ganti Kamera jika ada lebih dari 1 kamera/webcam */}
                  {availableCameras.length > 1 && !isInitializingCamera && !cameraPermissionError && (
                    <button
                      type="button"
                      onClick={handleSwitchCamera}
                      className="absolute top-3 right-3 px-2.5 py-1.5 rounded-full bg-black/60 text-white text-[11px] font-semibold flex items-center gap-1 backdrop-blur-xs hover:bg-black/80 active:scale-95 transition-all shadow-md z-10"
                      title="Ganti kamera / webcam"
                    >
                      <span className="material-symbols-outlined text-[15px]">cameraswitch</span>
                      <span>Ganti</span>
                    </button>
                  )}

                  {/* Loading saat buka kamera */}
                  {isInitializingCamera && (
                    <div className="absolute inset-0 bg-stone-900/80 flex flex-col items-center justify-center text-white gap-2 text-xs">
                      <span className="material-symbols-outlined text-[28px] animate-spin">
                        progress_activity
                      </span>
                      <span>Membuka kamera / webcam...</span>
                    </div>
                  )}

                  {/* Viewfinder overlay laser */}
                  {!cameraPermissionError && !isInitializingCamera && (
                    <div className="pointer-events-none absolute inset-6 border-2 border-white/60 rounded-xl flex items-center justify-center">
                      <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse" />
                    </div>
                  )}

                  {/* Jika izin kamera ditolak / tidak tersedia */}
                  {cameraPermissionError && (
                    <div className="absolute inset-0 bg-stone-900/90 text-white p-5 flex flex-col items-center justify-center text-center gap-2.5">
                      <span className="material-symbols-outlined text-[32px] text-amber-400">
                        videocam_off
                      </span>
                      <p className="text-xs leading-relaxed text-stone-300">
                        Kamera atau webcam tidak dapat diakses. Pastikan izin kamera sudah diberikan di browser.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('manual')}
                        className="mt-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-full active:scale-95 transition-transform"
                      >
                        Pilih Nomor Meja Manual
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-center text-xs text-stone-500 leading-relaxed">
                  Arahkan QR Code meja ke webcam laptop atau kamera HP-mu.
                </p>
              </div>
            )}

            {/* TAB 2: INPUT MANUAL */}
            {activeTab === 'manual' && (
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label htmlFor="table-input" className="block text-xs font-bold text-[#124734] mb-1.5">
                    Nomor Meja
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="table-input"
                      type="text"
                      maxLength={6}
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      placeholder="Misal: 12 atau A1"
                      className="flex-1 px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-bold text-[#124734] uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#124734]"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={!manualInput.trim()}
                      className="px-5 py-2.5 bg-[#124734] text-white text-xs font-bold rounded-xl disabled:opacity-40 hover:bg-[#092D20] active:scale-95 transition-all shadow-xs"
                    >
                      Pilih
                    </button>
                  </div>
                </div>

                {/* Quick Table Chips */}
                <div>
                  <p className="text-[11px] font-semibold text-stone-500 mb-2">Pilihan Cepat Meja:</p>
                  <div className="grid grid-cols-4 gap-2">
                    {QUICK_TABLES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleSelectChip(t)}
                        className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all ${
                          manualInput.toUpperCase() === t
                            ? 'bg-[#124734] text-white border-[#124734] shadow-xs'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        Meja {t}
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            )}

            {/* Pesan Error */}
            {errorMsg && (
              <div className="mt-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer Meja Saat Ini & Tombol Lepas Meja */}
        {table && !successTable && (
          <div className="px-5 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-stone-600">
              Meja saat ini: <strong className="text-[#124734]">Meja {table}</strong>
            </span>
            <button
              type="button"
              onClick={handleClearTable}
              className="text-red-600 font-semibold hover:underline"
            >
              Lepas Meja
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
