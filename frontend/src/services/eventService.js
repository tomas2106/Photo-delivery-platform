import { INITIAL_EVENTS_DATA } from '../data/eventsData';

const USE_BACKEND_API = false;
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
const STORAGE_KEY = 'tomasph_events_db';

// Helper para leer eventos combinados (iniciales + creados desde el Admin)
const getLocalEvents = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_EVENTS_DATA));
    return INITIAL_EVENTS_DATA;
  }
  return JSON.parse(saved);
};

export const getEvents = async () => {
  if (!USE_BACKEND_API) {
    return getLocalEvents();
  }
  const response = await fetch(`${API_BASE_URL}/events/`);
  if (!response.ok) throw new Error('Error al cargar eventos');
  return response.json();
};

export const unlockEventGallery = async (eventId, pin) => {
  if (!USE_BACKEND_API) {
    const events = getLocalEvents();
    const event = events.find((ev) => ev.id === eventId);
    if (!event || event.pin !== pin.trim()) {
      throw new Error('PIN incorrecto');
    }
    return event;
  }

  const response = await fetch(`${API_BASE_URL}/events/${eventId}/unlock/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });
  if (!response.ok) throw new Error('PIN incorrecto');
  return response.json();
};

export const createEvent = async (newEventData) => {
  if (!USE_BACKEND_API) {
    const events = getLocalEvents();
    const updated = [newEventData, ...events];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newEventData;
  }

  const response = await fetch(`${API_BASE_URL}/events/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newEventData),
  });
  if (!response.ok) throw new Error('Error al crear el evento');
  return response.json();
};

export const deleteEvent = async (eventId) => {
  if (!USE_BACKEND_API) {
    const events = getLocalEvents();
    const updated = events.filter((ev) => ev.id !== eventId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  }

  const response = await fetch(`${API_BASE_URL}/events/${eventId}/`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Error al eliminar evento');
  return true;
};