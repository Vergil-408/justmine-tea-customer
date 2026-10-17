import React from 'react';
import { formatRupiah } from '../utils/formatPrice.js';

/**
 * Kartu menu generik (dipakai untuk item signature maupun customizable).
 * @param {Object} item - data item menu (name, desc, price/basePrice, imageUrl, inStock, tag)
 * @param {Function} onAdd - dipanggil saat tombol tambah ditekan (item diteruskan sebagai argumen)
 * @param {Function} onClick - dipanggil saat kartu ditekan (misal untuk buka detail/customize)
 */
const MenuCard = ({ item, onAdd, onClick }) => {
  if (!item) return null;

  const price = item.price ?? item.basePrice ?? 0;
  const outOfStock = item.inStock === false;

  function handleAdd(e) {
    e.stopPropagation();
    if (outOfStock) return;
    onAdd?.(item);
  }

  return (
    <div
      className={`menu-item-v2${outOfStock ? ' out-of-stock' : ''}`}
      onClick={() => onClick?.(item)}
      role="button"
      tabIndex={0}
    >
      <div className="menu-item-v2-thumb">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} />
        ) : (
          <div className="icon-placeholder icon-placeholder-thumb" />
        )}
        {outOfStock && <div className="stock-overlay">Habis</div>}
      </div>

      <div className="menu-item-info">
        <h3>
          {item.name}
          {item.tag && <span className="badge-limited badge">{item.tag}</span>}
        </h3>
        <p>{item.desc}</p>
        <span className="price-tag">{formatRupiah(price)}</span>
      </div>

      <button
        type="button"
        className="round-add-btn"
        onClick={handleAdd}
        disabled={outOfStock}
        aria-label={`Tambah ${item.name}`}
      >
        +
      </button>
    </div>
  );
};

export default MenuCard;
