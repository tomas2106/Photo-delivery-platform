import { useState, useEffect } from 'react';
import {
  Lock,
  Calendar,
  MapPin,
  ShoppingBag,
  ArrowLeft,
  Eye,
  Loader2,
  Settings,
  Image as ImageIcon,
} from 'lucide-react';
import { getEvents, unlockEventGallery } from './services/eventService';
import { EVENT_CATEGORIES, STUDIO_CONFIG } from './data/eventsData';
import { formatCOP } from './utils/formatters';
import PhotoCard from './components/PhotoCard';
import LightboxModal from './components/LightboxModal';
import CheckoutDrawer from './components/CheckoutDrawer';
import Footer from './components/Footer';
import AdminPanel from './components/AdminPanel';

export default function App() {
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const [activeEvent, setActiveEvent] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockedEvents, setUnlockedEvents] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [onlySelectedFilter, setOnlySelectedFilter] = useState(false);
  const [zoomPhotoIndex, setZoomPhotoIndex] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const loadEvents = async () => {
    setLoadingEvents(true);
    try {
      const data = await getEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error cargando eventos:', error);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (activeEvent) {
      const saved = localStorage.getItem(`selection_${activeEvent.id}`);
      setSelectedIds(saved ? JSON.parse(saved) : []);
      setOnlySelectedFilter(false);
    }
  }, [activeEvent]);

  useEffect(() => {
    if (activeEvent) {
      localStorage.setItem(`selection_${activeEvent.id}`, JSON.stringify(selectedIds));
    }
  }, [selectedIds, activeEvent]);

  const handleUnlock = async (e) => {
    e.preventDefault();
    setIsUnlocking(true);
    setPinError('');

    try {
      const fullEventData = await unlockEventGallery(activeEvent.id, pinInput);
      setActiveEvent(fullEventData);
      setUnlockedEvents((prev) => ({ ...prev, [activeEvent.id]: true }));
      setPinInput('');
    } catch (err) {
      setPinError(err.message || 'PIN incorrecto. Verifica el código enviado por el fotógrafo.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const toggleSelectPhoto = (photoId) => {
    setSelectedIds((prev) =>
      prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId]
    );
  };

  // VISTA ADMINISTRADOR
  if (isAdminOpen) {
    return (
      <AdminPanel
        events={events}
        onEventsUpdated={loadEvents}
        onClose={() => setIsAdminOpen(false)}
      />
    );
  }

  // VISTA 1: Catálogo de Eventos por Categoría
  if (!activeEvent) {
    const filteredEvents =
      selectedCategory === 'Todos'
        ? events
        : events.filter((ev) => ev.category === selectedCategory);

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        {/* Header con Logo Negro TOMASPH */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <button
              onClick={() => setSelectedCategory('Todos')}
              className="font-black text-2xl tracking-tighter text-black uppercase"
            >
              {STUDIO_CONFIG.name}
            </button>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                Galería de Clientes
              </span>
              <button
                onClick={() => setIsAdminOpen(true)}
                title="Panel de Administración"
                className="p-2 rounded-full text-slate-500 hover:text-black hover:bg-slate-100 transition"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl w-full mx-auto px-4 pt-8 flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Eventos y Sesiones</h1>
          <p className="text-sm text-slate-500 mt-1">
            Selecciona una categoría, elige tu evento e ingresa el PIN enviado a tu WhatsApp.
          </p>

          {/* Barra de Categorías (Scroll horizontal en celular) */}
          <div className="flex items-center gap-2 overflow-x-auto py-5 no-scrollbar">
            {['Todos', ...EVENT_CATEGORIES].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-black text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loadingEvents ? (
            <div className="flex items-center justify-center py-20 text-[#0284C7]">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center my-4">
              <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-sm">
                Aún no hay eventos en {selectedCategory}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Pronto publicaremos nuevas galerías en esta sección.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filteredEvents.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => setActiveEvent(ev)}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-md transition cursor-pointer group"
                >
                  <div className="aspect-[16/10] overflow-hidden relative bg-slate-200">
                    <img
                      src={ev.coverImage}
                      alt={ev.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span className="absolute top-3 left-3 bg-white/95 text-black text-[11px] font-bold px-3 py-1 rounded-full shadow-xs">
                      {ev.category}
                    </span>
                    <span className="absolute top-3 right-3 bg-black/75 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> Privado
                    </span>
                  </div>
                  <div className="p-5">
                    <h2 className="font-bold text-lg text-slate-900 leading-snug">{ev.title}</h2>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#0284C7]" /> {ev.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#0284C7]" /> {ev.location}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Footer de Contacto Oficial */}
        <Footer />
      </div>
    );
  }

  // VISTA 2: Acceso por PIN
  if (!unlockedEvents[activeEvent.id]) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white w-full max-w-sm rounded-2xl p-6 border border-slate-200 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center mx-auto mb-4">
            <Lock className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0284C7]">
            {activeEvent.category}
          </span>
          <h2 className="font-bold text-lg text-slate-900 mt-1">{activeEvent.title}</h2>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            Ingresa el PIN de acceso para ver la galería de muestras
          </p>

          <form onSubmit={handleUnlock} className="space-y-3">
            <input
              type="password"
              inputMode="numeric"
              placeholder="••••"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full text-center text-2xl tracking-[0.5em] font-bold py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-black"
            />
            {pinError && <p className="text-xs text-red-600 font-medium">{pinError}</p>}
            <button
              type="submit"
              disabled={isUnlocking}
              className="w-full py-3 rounded-xl bg-black hover:bg-slate-800 text-white font-bold text-sm transition flex items-center justify-center gap-2"
            >
              {isUnlocking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ingresar a la galería'}
            </button>
          </form>

          <button
            onClick={() => {
              setActiveEvent(null);
              setPinError('');
              setPinInput('');
            }}
            className="mt-4 text-xs text-slate-500 hover:text-black inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Volver a eventos
          </button>
        </div>
      </div>
    );
  }

  // VISTA 3: Galería de Selección del Evento
  const extraCount = Math.max(0, selectedIds.length - activeEvent.includedPhotos);
  const extraCost = extraCount * activeEvent.extraPhotoPrice;
  const displayedPhotos = onlySelectedFilter
    ? activeEvent.photos.filter((p) => selectedIds.includes(p.id))
    : activeEvent.photos;

  const selectedPhotoObjects = selectedIds
    .map((id) => activeEvent.photos.find((p) => p.id === id))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-white pb-28">
      <header className="bg-white/95 backdrop-blur-xs border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => setActiveEvent(null)}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-black"
          >
            <ArrowLeft className="w-4 h-4" /> Eventos
          </button>
          <span className="font-black text-lg tracking-tighter text-black uppercase">
            {STUDIO_CONFIG.name}
          </span>
          <button
            onClick={() => setIsCheckoutOpen(true)}
            className="relative p-2 text-black"
          >
            <ShoppingBag className="w-5 h-5" />
            {selectedIds.length > 0 && (
              <span className="absolute top-0.5 right-0.5 bg-[#0284C7] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {selectedIds.length}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#0284C7]">
          {activeEvent.category}
        </span>
        <h1 className="text-xl font-bold text-slate-900 leading-tight">{activeEvent.title}</h1>
        <p className="text-xs text-slate-500 mt-1">
          {activeEvent.photos.length} fotos disponibles • Toca una foto para seleccionarla.
        </p>

        <div className="mt-4 bg-sky-50 border border-sky-100 rounded-xl p-3.5 text-xs text-slate-700 flex items-center justify-between">
          <div>
            <span className="font-bold text-[#0284C7]">
              Tu paquete incluye {activeEvent.includedPhotos} fotos.
            </span>{' '}
            Cada foto adicional tiene un valor de{' '}
            <span className="font-bold">{formatCOP(activeEvent.extraPhotoPrice)}</span>.
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 mb-4">
          <button
            onClick={() => setOnlySelectedFilter(false)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
              !onlySelectedFilter
                ? 'bg-black text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas ({activeEvent.photos.length})
          </button>
          <button
            onClick={() => setOnlySelectedFilter(true)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
              onlySelectedFilter
                ? 'bg-black text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Seleccionadas ({selectedIds.length})
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {displayedPhotos.map((photo, idx) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              isSelected={selectedIds.includes(photo.id)}
              selectionIndex={selectedIds.indexOf(photo.id)}
              includedLimit={activeEvent.includedPhotos}
              extraPrice={activeEvent.extraPhotoPrice}
              watermarkText={activeEvent.watermarkText || STUDIO_CONFIG.watermark}
              onToggleSelect={toggleSelectPhoto}
              onZoom={() => setZoomPhotoIndex(idx)}
            />
          ))}
        </div>
      </main>

      <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-slate-900">
              {selectedIds.length} / {activeEvent.includedPhotos} incluidas
              {extraCount > 0 && (
                <span className="ml-1.5 text-amber-600 font-extrabold">
                  (+{extraCount} extras)
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500">
              Adicional a pagar:{' '}
              <span className="font-bold text-[#0284C7] text-sm">
                {formatCOP(extraCost)}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsCheckoutOpen(true)}
            disabled={selectedIds.length === 0}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm text-white transition ${
              selectedIds.length > 0
                ? 'bg-[#0284C7] hover:bg-[#0369A1] shadow-sm'
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            Confirmar ({selectedIds.length})
          </button>
        </div>
      </div>

      {zoomPhotoIndex !== null && displayedPhotos[zoomPhotoIndex] && (
        <LightboxModal
          photo={displayedPhotos[zoomPhotoIndex]}
          isSelected={selectedIds.includes(displayedPhotos[zoomPhotoIndex].id)}
          selectionIndex={selectedIds.indexOf(displayedPhotos[zoomPhotoIndex].id)}
          includedLimit={activeEvent.includedPhotos}
          extraPrice={activeEvent.extraPhotoPrice}
          watermarkText={activeEvent.watermarkText || STUDIO_CONFIG.watermark}
          onClose={() => setZoomPhotoIndex(null)}
          onToggleSelect={toggleSelectPhoto}
          onPrev={() =>
            setZoomPhotoIndex((prev) =>
              prev > 0 ? prev - 1 : displayedPhotos.length - 1
            )
          }
          onNext={() =>
            setZoomPhotoIndex((prev) =>
              prev < displayedPhotos.length - 1 ? prev + 1 : 0
            )
          }
        />
      )}

      <CheckoutDrawer
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        event={activeEvent}
        selectedPhotos={selectedPhotoObjects}
      />
    </div>
  );
}