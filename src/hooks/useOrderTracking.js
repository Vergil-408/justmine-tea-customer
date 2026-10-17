import { useState, useEffect } from 'react';
import { listenToOrder, listenToQueuePosition } from '../api/orders';

/**
 * Custom hook untuk melacak order dan antrian
 * @param {string} orderId 
 * @returns {Object} { order, queuePosition, loading }
 */
export const useOrderTracking = (orderId) => {
  const [order, setOrder] = useState(null);
  const [queuePosition, setQueuePosition] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false)
      return
    }
    setLoading(true)

    const unsubOrder = listenToOrder(orderId, (data) => {
      setOrder(data)
      setLoading(false)
    })
    const unsubQueue = listenToQueuePosition(orderId, (position) => {
      setQueuePosition(position)
    })

    return () => {
      unsubOrder()
      unsubQueue()
    }
  }, [orderId]);

  return { order, queuePosition, loading };
};
