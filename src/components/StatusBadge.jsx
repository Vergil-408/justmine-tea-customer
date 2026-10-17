import React from 'react';

const STATUS_LABELS = {
  menunggu: 'Menunggu',
  diproses: 'Diproses',
  siap: 'Siap Diambil',
  selesai: 'Selesai',
  dibatalkan: 'Dibatalkan',
};

/**
 * Badge status pesanan. Memakai class CSS .status-badge / .status-<status>
 * yang sudah didefinisikan di styles.css (menunggu / diproses / siap).
 * @param {string} status - salah satu dari: menunggu, diproses, siap, selesai, dibatalkan
 */
const StatusBadge = ({ status }) => {
  const label = STATUS_LABELS[status] || status;
  return (
    <span className={`status-badge status-${status}`}>
      {label}
    </span>
  );
};

export default StatusBadge;
