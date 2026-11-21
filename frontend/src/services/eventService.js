const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const getAdminHeaders = () => {
  const adminPin = sessionStorage.getItem('tomasph_admin_pin') || '';
  return {
    'Content-Type': 'application/json',
    ...(adminPin ? { 'X-Admin-Pin': adminPin } : {}),
  };
};

export const verifyAdminPassword = async (pin) => {
  const response = await fetch(`${API_BASE_URL}/admin/verify/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });

  if (!response.ok) {
    throw new Error('Contraseña incorrecta');
  }

  sessionStorage.setItem('tomasph_admin_pin', pin);
  return true;
};

export const getEvents = async () => {
  const response = await fetch(`${API_BASE_URL}/events/`, {
    headers: getAdminHeaders(),
  });
  if (!response.ok) throw new Error('Error al cargar eventos');
  return response.json();
};

export const unlockEventGallery = async (eventId, pin) => {
  const response = await fetch(`${API_BASE_URL}/events/${eventId}/unlock/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || 'PIN incorrecto');
  }

  return response.json();
};

export const trackEventView = async (eventId) => {
  try {
    await fetch(`${API_BASE_URL}/events/${eventId}/view/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    // Silencioso
  }
};

export const registerOrder = async (orderPayload) => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
};

export const getAdminAnalytics = async () => {
  const response = await fetch(`${API_BASE_URL}/admin/analytics/`, {
    headers: getAdminHeaders(),
  });
  if (!response.ok) throw new Error('Error al cargar estadísticas');
  return response.json();
};

export const updateOrderManage = async (orderId, payload) => {
  const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/`, {
    method: 'PATCH',
    headers: getAdminHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Error al actualizar el pedido');
  return response.json();
};

export const deleteOrder = async (orderId) => {
  const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/`, {
    method: 'DELETE',
    headers: getAdminHeaders(),
  });
  if (!response.ok) throw new Error('Error al eliminar el pedido');
  return true;
};

export const getDeliveryOrder = async (token) => {
  const response = await fetch(`${API_BASE_URL}/delivery/${token}/`);
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || 'Enlace de entrega no disponible');
  }
  return response.json();
};

export const trackDeliveryDownload = async (token) => {
  try {
    await fetch(`${API_BASE_URL}/delivery/${token}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    // Silencioso
  }
};

export const createEvent = async (newEventData) => {
  const response = await fetch(`${API_BASE_URL}/events/`, {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify(newEventData),
  });

  if (!response.ok) throw new Error('Error al crear el evento');
  return response.json();
};

export const updateEvent = async (eventId, updatedFields) => {
  const response = await fetch(`${API_BASE_URL}/events/${eventId}/`, {
    method: 'PATCH',
    headers: getAdminHeaders(),
    body: JSON.stringify(updatedFields),
  });

  if (!response.ok) throw new Error('Error al actualizar el evento');
  return response.json();
};

export const deleteEvent = async (eventId) => {
  const response = await fetch(`${API_BASE_URL}/events/${eventId}/`, {
    method: 'DELETE',
    headers: getAdminHeaders(),
  });

  if (!response.ok) throw new Error('Error al eliminar evento');
  return response.json();
};