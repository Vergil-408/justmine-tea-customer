import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { CartSheetProvider } from './context/CartSheetContext.jsx'
import CartSheet from './components/CartSheet.jsx'
import MiniCartBar from './components/MiniCartBar.jsx'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <CartSheetProvider>
            <App />
            <CartSheet />
            <MiniCartBar />
          </CartSheetProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)