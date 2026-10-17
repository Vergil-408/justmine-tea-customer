/**
 * Format angka menjadi format Rupiah
 * @param {number} number Angka harga
 * @returns {string} String format "Rp22.000"
 */
export const formatRupiah = (number) => {
  const value = Number(number) || 0;
  return `Rp${value.toLocaleString('id-ID')}`;
};
