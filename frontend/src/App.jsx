import { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  MapPin,
  ShoppingBag,
  ArrowLeft,
  ArrowUpRight,
  Eye,
  Loader2,
  Settings,
  Image as ImageIcon,
  Search,
  X,
  ShieldAlert,
  ChevronDown,
  Share2,
  Check,
  Tag,
  Clock,
  CalendarClock,
} from 'lucide-react';
import {
  getEvents,
  unlockEventGallery,
  trackEventView,
} from './services/eventService';
import { CATEGORY_STRUCTURE, STUDIO_CONFIG } from './data/eventsData';
import {
  formatCOP,
  parseEventDateBadge,
  calculateOrderPricing,
  getOptimizedCloudinaryUrl,
} from './utils/formatters';
import PhotoCard from './components/PhotoCard';
import LightboxModal from './components/LightboxModal';
import CheckoutDrawer from './components/CheckoutDrawer';
import Footer from './components/Footer';
import AdminPanel from './components/AdminPanel';
import StudioLogo from './components/StudioLogo';
import HomeView from './components/HomeView';
import DeliveryPortal from './components/DeliveryPortal';

const EVENTS_PER_PAGE = 9;

const isEventExpired = (expiresAt) => {
  if (!expiresAt) return false;
  const todayStr = new Date().toISOString().slice(0, 10);
  return expiresAt < todayStr;
};

const formatExpiryDateLabel = (expiresAt) => {
  if (!expiresAt) return '';
  const [year, month, day] = expiresAt.split('-');
  if (!year || !month || !day) return expiresAt;
  return `${day}/${month}/${year}`;
};

const getTimePeriodKey = (hour) => {
  if (hour === null || hour === undefined) return null;
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'night';
};

export default function App() {
  const [deliveryToken, setDeliveryToken] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('entrega') || null;
  });

  const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'gallery'
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedSubcategory, setSelectedSubcategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleEventsCount, setVisibleEventsCount] = useState(EVENTS_PER_PAGE);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const [activeEvent, setActiveEvent] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockedEvents, setUnlockedEvents] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [onlySelectedFilter, setOnlySelectedFilter] = useState(false);
  const [timePeriodFilter, setTimePeriodFilter] = useState('all');
  const [zoomPhotoIndex, setZoomPhotoIndex] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [copiedEventId, setCopiedEventId] = useState(null);

  const [isPrivacyShieldActive, setIsPrivacyShieldActive] = useState(false);

  const syncUrlEventParam = (eventId) => {
    const url = new URL(window.location.href);
    url.searchParams.delete('entrega');
    if (eventId) {
      url.searchParams.set('evento', eventId);
    } else {
      url.searchParams.delete('evento');
    }
    window.history.replaceState({}, '', url.toString());
  };

  const handleOpenEvent = (ev) => {
    setPinInput('');
    setPinError('');
    setTimePeriodFilter('all');
    setActiveEvent(ev);
    syncUrlEventParam(ev.id);

    if (ev.requiresPin === false) {
      setUnlockedEvents({ [ev.id]: true });
      trackEventView(ev.id);
    } else {
      setUnlockedEvents({});
    }
  };

  const loadEvents = async (autoOpenDeepLink = false) => {
    setLoadingEvents(true);
    try {
      const data = await getEvents();
      setEvents(data);

      if (autoOpenDeepLink) {
        const params = new URLSearchParams(window.location.search);
        const deepEventId = params.get('evento');
        if (deepEventId) {
          const matched = data.find(
            (ev) =>
              String(ev.id) === String(deepEventId) &&
              ev.isActive !== false &&
              !isEventExpired(ev.expiresAt)
          );
          if (matched) {
            setCurrentPage('gallery');
            handleOpenEvent(matched);
          }
        }
      }
    } catch (error) {
      console.error('Error cargando eventos:', error);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    if (!deliveryToken) {
      loadEvents(true);
    }
  }, [deliveryToken]);

  useEffect(() => {
    setVisibleEventsCount(EVENTS_PER_PAGE);
  }, [selectedCategory, selectedSubcategory, searchQuery]);

  useEffect(() => {
    if (!activeEvent || !unlockedEvents[activeEvent.id]) {
      setIsPrivacyShieldActive(false);
      return;
    }

    const handleKeyUp = (e) => {
      if (e.key === 'PrintScreen') {
        setIsPrivacyShieldActive(true);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText('').catch(() => {});
        }
        setTimeout(() => setIsPrivacyShieldActive(false), 2500);
      }
    };

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && ['s', 'p', 'u'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };

    const handleWindowBlur = () => setIsPrivacyShieldActive(true);
    const handleWindowFocus = () => setIsPrivacyShieldActive(false);
    const handleVisibilityChange = () => {
      setIsPrivacyShieldActive(document.hidden);
    };

    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeEvent, unlockedEvents]);

  useEffect(() => {
    if (activeEvent) {
      const saved = localStorage.getItem(`selection_${activeEvent.id}`);
      const parsedIds = saved ? JSON.parse(saved) : [];
      const validPhotoIds = new Set(activeEvent.photos.map((p) => p.id));
      const cleanIds = parsedIds.filter((id) => validPhotoIds.has(id));

      setSelectedIds(cleanIds);
      setOnlySelectedFilter(false);
      setTimePeriodFilter('all');
    }
  }, [activeEvent]);

  useEffect(() => {
    if (activeEvent) {
      localStorage.setItem(`selection_${activeEvent.id}`, JSON.stringify(selectedIds));
    }
  }, [selectedIds, activeEvent]);

  const handleSelectMainCategory = (catName) => {
    setSelectedCategory(catName);
    setSelectedSubcategory('Todos');
  };

  const handleCloseEvent = () => {
    setActiveEvent(null);
    setUnlockedEvents({});
    setPinInput('');
    setPinError('');
    setZoomPhotoIndex(null);
    setIsCheckoutOpen(false);
    setIsPrivacyShieldActive(false);
    setTimePeriodFilter('all');
    syncUrlEventParam(null);
  };

  const handleNavigate = (page) => {
    handleCloseEvent();
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShareEventLink = async (e, ev) => {
    if (e) e.stopPropagation();
    const shareUrl = `${window.location.origin}/?evento=${ev.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedEventId(ev.id);
      setTimeout(() => setCopiedEventId(null), 2500);
    } catch {
      window.prompt('Copia este enlace directo de la galería:', shareUrl);
    }
  };

  const handleUnlock = async (e) => {
    e.preventDefault();
    setIsUnlocking(true);
    setPinError('');

    try {
      const fullEventData = await unlockEventGallery(activeEvent.id, pinInput);
      setActiveEvent(fullEventData);
      setUnlockedEvents({ [activeEvent.id]: true });
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

  const handleClearSelection = () => {
    setSelectedIds([]);
    setOnlySelectedFilter(false);
  };

  if (deliveryToken) {
    return (
      <DeliveryPortal
        token={deliveryToken}
        onBackToHome={() => {
          setDeliveryToken(null);
          syncUrlEventParam(null);
          loadEvents(false);
        }}
      />
    );
  }

  if (isAdminOpen) {
    return (
      <AdminPanel
        events={events}
        onEventsUpdated={() => loadEvents(false)}
        onClose={() => setIsAdminOpen(false)}
      />
    );
  }

  const renderNavbar = () => (
    <header className="w-full bg-white/95 backdrop-blur-xs border-b border-neutral-200 sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-1.5">
        <button
          type="button"
          onClick={() => handleNavigate('home')}
          className="text-left focus:outline-none shrink-0"
        >
          <StudioLogo />
        </button>

        <nav className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleNavigate('home')}
            className={`px-2.5 sm:px-3.5 py-2 rounded-full text-[11px] sm:text-xs font-bold transition ${
              currentPage === 'home'
                ? 'bg-neutral-900 text-white shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100'
            }`}
          >
            Inicio
          </button>

          <button
            type="button"
            onClick={() => {
              handleSelectMainCategory('Todos');
              setSearchQuery('');
              handleNavigate('gallery');
            }}
            className={`px-2.5 sm:px-3.5 py-2 rounded-full text-[11px] sm:text-xs font-bold transition whitespace-nowrap ${
              currentPage === 'gallery'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
            }`}
          >
            Galería
          </button>

          <button
            type="button"
            onClick={() => setIsAdminOpen(true)}
            title="Panel de Administración"
            className="p-2 rounded-full text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 transition"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </nav>
      </div>
    </header>
  );

  if (currentPage === 'home' && !activeEvent) {
    return (
      <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#FAFAFA] text-neutral-900 flex flex-col">
        {renderNavbar()}
        <HomeView onGoToGallery={() => handleNavigate('gallery')} />
        <Footer />
      </div>
    );
  }

  if (!activeEvent) {
    const activeCatObj = CATEGORY_STRUCTURE.find((c) => c.name === selectedCategory);
    const subcategories = activeCatObj ? activeCatObj.subcategories : [];

    const publicEvents = events.filter(
      (ev) => ev.isActive !== false && !isEventExpired(ev.expiresAt)
    );
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filteredEvents = publicEvents.filter((ev) => {
      if (selectedCategory !== 'Todos' && ev.category !== selectedCategory) return false;
      if (
        selectedCategory !== 'Todos' &&
        subcategories.length > 0 &&
        selectedSubcategory !== 'Todos' &&
        ev.subcategory !== selectedSubcategory
      ) {
        return false;
      }

      if (normalizedQuery) {
        const matchTitle = ev.title.toLowerCase().includes(normalizedQuery);
        const matchDate = (ev.date || '').toLowerCase().includes(normalizedQuery);
        const matchLocation = (ev.location || '').toLowerCase().includes(normalizedQuery);
        return matchTitle || matchDate || matchLocation;
      }

      return true;
    });

    const paginatedEvents = filteredEvents.slice(0, visibleEventsCount);
    const hasMoreEvents = filteredEvents.length > visibleEventsCount;
    const remainingEventsCount = filteredEvents.length - visibleEventsCount;

    return (
      <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#FAFAFA] text-neutral-900 flex flex-col">
        {renderNavbar()}

        <main className="max-w-5xl w-full mx-auto px-4 pt-8 pb-12 flex-1">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-neutral-950">Eventos y Sesiones</h1>
              <p className="text-sm text-neutral-500 mt-1">
                Busca tu evento por nombre o fecha y selecciona tus fotografías favoritas.
              </p>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o fecha..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white border border-neutral-300 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pt-5 pb-3 no-scrollbar">
            <button
              onClick={() => handleSelectMainCategory('Todos')}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === 'Todos'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-400'
              }`}
            >
              Todos
            </button>
            {CATEGORY_STRUCTURE.map((cat) => (
              <button
                key={cat.name}
                onClick={() => handleSelectMainCategory(cat.name)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === cat.name
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-400'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {subcategories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar">
              <span className="text-[11px] font-semibold text-neutral-400 mr-1">
                Disciplina:
              </span>
              <button
                onClick={() => setSelectedSubcategory('Todos')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  selectedSubcategory === 'Todos'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                Todas en {selectedCategory}
              </button>
              {subcategories.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubcategory(sub)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                    selectedSubcategory === sub
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}

          {loadingEvents ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-3">
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className="rounded-3xl bg-neutral-200/80 aspect-[3/4] p-5 flex flex-col justify-between animate-pulse"
                >
                  <div className="flex justify-between">
                    <div className="w-14 h-12 rounded-xl bg-neutral-300" />
                    <div className="w-20 h-6 rounded-full bg-neutral-300" />
                  </div>
                  <div className="space-y-2.5">
                    <div className="w-24 h-3 rounded bg-neutral-300" />
                    <div className="w-3/4 h-5 rounded bg-neutral-300" />
                    <div className="w-1/2 h-3 rounded bg-neutral-300" />
                    <div className="pt-3 border-t border-neutral-300/70 flex justify-between items-center">
                      <div className="w-24 h-6 rounded bg-neutral-300" />
                      <div className="w-16 h-8 rounded-xl bg-neutral-300" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center my-4">
              <ImageIcon className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <h3 className="font-bold text-neutral-800 text-sm">
                No se encontraron eventos
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                {searchQuery
                  ? `No hay coincidencias para "${searchQuery}". Intenta con otro nombre o fecha.`
                  : 'Pronto publicaremos nuevas galerías en esta sección.'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-bold"
                >
                  Mostrar todos los eventos
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-3">
                {paginatedEvents.map((ev) => {
                  const isPrivate = ev.requiresPin !== false;
                  const dateBadge = parseEventDateBadge(ev.date);
                  const tagLabel = ev.subcategory || ev.category;
                  const isCopied = copiedEventId === ev.id;
                  const coverUrl = getOptimizedCloudinaryUrl(ev.coverImage, 'cover');

                  return (
                    <div
                      key={ev.id}
                      onClick={() => handleOpenEvent(ev)}
                      onContextMenu={(e) => e.preventDefault()}
                      className="relative rounded-3xl overflow-hidden bg-zinc-950 aspect-[3/4] border border-neutral-200/80 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group select-none"
                    >
                      <img
                        src={coverUrl}
                        alt={ev.title}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500 pointer-events-none"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-black/20" />

                      <div className="absolute top-4 inset-x-4 flex items-start justify-between gap-2">
                        <div className="bg-zinc-950/85 backdrop-blur-md border border-white/15 border-l-4 border-l-amber-500 rounded-r-xl rounded-l-sm px-3 py-1.5 text-white shadow-lg">
                          <div className="text-xl font-black leading-none tracking-tight">
                            {dateBadge.day}
                          </div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mt-1 leading-none">
                            {dateBadge.month} {dateBadge.year}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handleShareEventLink(e, ev)}
                            title="Copiar enlace directo de esta galería"
                            className="bg-zinc-900/80 hover:bg-amber-500 hover:text-zinc-950 backdrop-blur-xs border border-white/15 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1 transition"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3 h-3" /> Copiado
                              </>
                            ) : (
                              <>
                                <Share2 className="w-3 h-3" /> Link
                              </>
                            )}
                          </button>

                          {isPrivate ? (
                            <span className="bg-zinc-900/80 backdrop-blur-xs border border-white/15 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                              <Lock className="w-3 h-3 text-slate-300" /> Privado
                            </span>
                          ) : (
                            <span className="bg-emerald-600/95 text-white text-[11px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 shadow-xs">
                              <Unlock className="w-3 h-3" /> Público
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col justify-end text-white">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400">
                            {tagLabel}
                          </span>
                          {ev.volumeDiscountEnabled && ev.volumeDiscountPercent > 0 && (
                            <span className="text-[10px] font-bold bg-amber-500/20 border border-amber-400/40 text-amber-300 px-2 py-0.5 rounded-full">
                              -{ev.volumeDiscountPercent}% x {ev.volumeDiscountMinPhotos}+{' '}
                              {ev.includedPhotos === 0 ? 'fotos' : 'extras'}
                            </span>
                          )}
                        </div>

                        <h2 className="font-bold text-xl leading-snug text-white line-clamp-2">
                          {ev.title}
                        </h2>

                        <div className="flex items-center gap-1.5 text-xs text-zinc-300 mt-2">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="truncate">{ev.location}</span>
                        </div>

                        <div className="mt-4 pt-3.5 border-t border-white/15 flex items-center justify-between gap-3">
                          <div className="text-xs">
                            {ev.includedPhotos === 0 ? (
                              <>
                                <p className="font-bold text-white">
                                  Desde {formatCOP(ev.extraPhotoPrice)}
                                </p>
                                <p className="text-[11px] text-zinc-400">
                                  Selección individual
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="font-bold text-white">
                                  Paquete {ev.includedPhotos} fotos
                                </p>
                                <p className="text-[11px] text-zinc-400">
                                  Extra {formatCOP(ev.extraPhotoPrice)} c/u
                                </p>
                              </>
                            )}
                          </div>

                          <span className="px-3.5 py-2 rounded-xl bg-white text-zinc-950 group-hover:bg-amber-500 group-hover:text-zinc-950 font-bold text-xs inline-flex items-center gap-1 transition-colors shrink-0 shadow-sm">
                            Abrir
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {hasMoreEvents && (
                <div className="mt-10 flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleEventsCount((prev) => prev + EVENTS_PER_PAGE)
                    }
                    className="px-6 py-3 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-900 font-bold text-xs inline-flex items-center gap-2 shadow-2xs transition"
                  >
                    Ver más eventos ({remainingEventsCount}{' '}
                    {remainingEventsCount === 1 ? 'restante' : 'restantes'})
                    <ChevronDown className="w-4 h-4 text-amber-600" />
                  </button>
                  <span className="text-[11px] text-neutral-400">
                    Mostrando {paginatedEvents.length} de {filteredEvents.length} eventos
                  </span>
                </div>
              )}
            </>
          )}
        </main>

        <Footer />
      </div>
    );
  }

  if (!unlockedEvents[activeEvent.id]) {
    return (
      <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#FAFAFA] flex flex-col items-center justify-center p-4">
        <div className="bg-white w-full max-w-sm rounded-2xl p-6 border border-neutral-200 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-neutral-900 text-white flex items-center justify-center mx-auto mb-4">
            <Lock className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
            {activeEvent.category} {activeEvent.subcategory ? `• ${activeEvent.subcategory}` : ''}
          </span>
          <h2 className="font-bold text-lg text-neutral-950 mt-1">{activeEvent.title}</h2>
          <p className="text-xs text-neutral-500 mt-1 mb-5">
            Ingresa el PIN de acceso para ver la galería de muestras
          </p>

          <form onSubmit={handleUnlock} className="space-y-3">
            <input
              type="password"
              inputMode="numeric"
              placeholder="••••"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full text-center text-2xl tracking-[0.5em] font-bold py-3 rounded-xl border border-neutral-300 focus:outline-none focus:border-neutral-900"
            />
            {pinError && <p className="text-xs text-red-600 font-medium">{pinError}</p>}
            <button
              type="submit"
              disabled={isUnlocking}
              className="w-full py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm transition flex items-center justify-center gap-2"
            >
              {isUnlocking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ingresar a la galería'}
            </button>
          </form>

          <button
            onClick={handleCloseEvent}
            className="mt-4 text-xs text-neutral-500 hover:text-neutral-950 inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Ver todos los eventos
          </button>
        </div>
      </div>
    );
  }

  const pricing = calculateOrderPricing(activeEvent, selectedIds.length);

  // Calcular disponibilidad de tandas horarias si el admin habilitó timeFilterEnabled
  const availableTimePeriods = activeEvent.timeFilterEnabled
    ? {
        morning: activeEvent.photos.some((p) => getTimePeriodKey(p.capturedHour) === 'morning'),
        afternoon: activeEvent.photos.some((p) => getTimePeriodKey(p.capturedHour) === 'afternoon'),
        night: activeEvent.photos.some((p) => getTimePeriodKey(p.capturedHour) === 'night'),
      }
    : { morning: false, afternoon: false, night: false };

  const hasAnyTimePeriod =
    availableTimePeriods.morning ||
    availableTimePeriods.afternoon ||
    availableTimePeriods.night;

  const displayedPhotos = activeEvent.photos.filter((p) => {
    if (onlySelectedFilter && !selectedIds.includes(p.id)) return false;
    if (
      activeEvent.timeFilterEnabled &&
      hasAnyTimePeriod &&
      timePeriodFilter !== 'all' &&
      getTimePeriodKey(p.capturedHour) !== timePeriodFilter
    ) {
      return false;
    }
    return true;
  });

  const selectedPhotoObjects = selectedIds
    .map((id) => activeEvent.photos.find((p) => p.id === id))
    .filter(Boolean);

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="min-h-screen w-full max-w-full overflow-x-hidden bg-white pb-28 select-none relative"
    >
      {isPrivacyShieldActive && (
        <div className="fixed inset-0 z-[100] bg-zinc-950/95 backdrop-blur-xl flex flex-col items-center justify-center text-center p-6 text-white">
          <ShieldAlert className="w-12 h-12 text-amber-500 mb-3" />
          <h3 className="text-lg font-bold">Contenido protegido por {STUDIO_CONFIG.name}</h3>
          <p className="text-xs text-zinc-400 max-w-xs mt-1">
            Las fotografías de muestra están protegidas contra capturas y descargas no autorizadas.
          </p>
        </div>
      )}

      <header className="w-full bg-white/95 backdrop-blur-xs border-b border-neutral-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2">
          <button
            onClick={handleCloseEvent}
            className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-neutral-700 hover:text-neutral-950 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" /> Eventos
          </button>

          <StudioLogo className="scale-90" />

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={(e) => handleShareEventLink(e, activeEvent)}
              className="px-2 sm:px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold inline-flex items-center gap-1 transition"
            >
              {copiedEventId === activeEvent.id ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Copiado</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Compartir</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="relative p-2 text-neutral-950"
            >
              <ShoppingBag className="w-5 h-5" />
              {selectedIds.length > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-amber-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {selectedIds.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
          {activeEvent.category} {activeEvent.subcategory ? `• ${activeEvent.subcategory}` : ''}
        </span>
        <h1 className="text-xl font-bold text-neutral-950 leading-tight">{activeEvent.title}</h1>
        <p className="text-xs text-neutral-500 mt-1">
          Toca una fotografía para seleccionarla o usa la lupa para verla en detalle.
        </p>

        <div className="mt-4 bg-amber-50/80 border border-amber-200/80 rounded-xl p-3.5 text-xs text-neutral-700 space-y-1.5">
          {pricing.isPayPerPhoto ? (
            <div>
              <span className="font-bold text-amber-800">
                Galería de selección individual.
              </span>{' '}
              Cada fotografía seleccionada tiene un valor de{' '}
              <span className="font-bold">{formatCOP(activeEvent.extraPhotoPrice)}</span>.
            </div>
          ) : (
            <div>
              <span className="font-bold text-amber-800">
                Tu paquete incluye {activeEvent.includedPhotos} fotos.
              </span>{' '}
              Cada foto adicional tiene un valor de{' '}
              <span className="font-bold">{formatCOP(activeEvent.extraPhotoPrice)}</span>.
            </div>
          )}

          {pricing.discountEnabled && pricing.minPhotos > 0 && pricing.discountPercent > 0 && (
            <div className="flex items-center gap-1.5 text-emerald-800 font-semibold pt-1 border-t border-amber-200/60">
              <Tag className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>
                Promoción activa: Lleva {pricing.minPhotos} o más{' '}
                {pricing.isPayPerPhoto ? 'fotos' : 'fotos adicionales'} y obtén{' '}
                {pricing.discountPercent}% de descuento automático
                {pricing.qualifiesForDiscount
                  ? ` (ahora a ${formatCOP(pricing.effectiveExtraPrice)} c/u).`
                  : '.'}
              </span>
            </div>
          )}

          {activeEvent.expiresAt && (
            <div className="flex items-center gap-1.5 text-neutral-800 font-semibold pt-1 border-t border-amber-200/60">
              <CalendarClock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>
                Galería disponible para selección hasta el{' '}
                <strong>{formatExpiryDateLabel(activeEvent.expiresAt)}</strong>.
              </span>
            </div>
          )}
        </div>

        {/* Filtro opcional por horario / tandas si el administrador lo activó */}
        {activeEvent.timeFilterEnabled && hasAnyTimePeriod && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-3 no-scrollbar">
            <span className="text-[11px] font-bold text-neutral-500 inline-flex items-center gap-1 mr-1 shrink-0">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> Horario:
            </span>
            <button
              type="button"
              onClick={() => setTimePeriodFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                timePeriodFilter === 'all'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
              }`}
            >
              Todo el día
            </button>
            {availableTimePeriods.morning && (
              <button
                type="button"
                onClick={() => setTimePeriodFilter('morning')}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  timePeriodFilter === 'morning'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                }`}
              >
                Mañana (6am - 12pm)
              </button>
            )}
            {availableTimePeriods.afternoon && (
              <button
                type="button"
                onClick={() => setTimePeriodFilter('afternoon')}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  timePeriodFilter === 'afternoon'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                }`}
              >
                Tarde (12pm - 6pm)
              </button>
            )}
            {availableTimePeriods.night && (
              <button
                type="button"
                onClick={() => setTimePeriodFilter('night')}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  timePeriodFilter === 'night'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                }`}
              >
                Noche (6pm+)
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 mt-4 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOnlySelectedFilter(false)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                !onlySelectedFilter
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setOnlySelectedFilter(true)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
                onlySelectedFilter
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Seleccionadas ({selectedIds.length})
            </button>
          </div>

          {selectedIds.length > 0 && (
            <button
              onClick={handleClearSelection}
              className="text-xs font-semibold text-red-600 hover:underline"
            >
              Limpiar selección
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {displayedPhotos.map((photo, idx) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              isSelected={selectedIds.includes(photo.id)}
              selectionIndex={selectedIds.indexOf(photo.id)}
              includedLimit={activeEvent.includedPhotos}
              extraPrice={pricing.effectiveExtraPrice}
              watermarkText={activeEvent.watermarkText || STUDIO_CONFIG.watermark}
              onToggleSelect={toggleSelectPhoto}
              onZoom={() => setZoomPhotoIndex(idx)}
            />
          ))}
        </div>
      </main>

      <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-neutral-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div
            onClick={() => selectedIds.length > 0 && setIsCheckoutOpen(true)}
            className={selectedIds.length > 0 ? 'cursor-pointer min-w-0' : 'min-w-0'}
          >
            {pricing.isPayPerPhoto ? (
              <>
                <div className="text-xs font-bold text-neutral-900 flex items-center gap-1.5 flex-wrap">
                  <span>
                    {selectedIds.length}{' '}
                    {selectedIds.length === 1 ? 'foto seleccionada' : 'fotos seleccionadas'}
                  </span>
                  {pricing.qualifiesForDiscount && (
                    <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">
                      -{pricing.discountPercent}% OFF
                    </span>
                  )}
                </div>
                <div className="text-xs text-neutral-500">
                  Total a pagar:{' '}
                  <span className="font-bold text-amber-700 text-sm">
                    {formatCOP(pricing.finalTotal)}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="text-xs font-bold text-neutral-900 flex items-center gap-1.5 flex-wrap">
                  <span>
                    {selectedIds.length} / {activeEvent.includedPhotos} incluidas
                  </span>
                  {pricing.billableCount > 0 && (
                    <span className="text-amber-600 font-extrabold">
                      (+{pricing.billableCount} extras)
                    </span>
                  )}
                  {pricing.qualifiesForDiscount && (
                    <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">
                      -{pricing.discountPercent}% OFF
                    </span>
                  )}
                </div>
                <div className="text-xs text-neutral-500">
                  Adicional a pagar:{' '}
                  <span className="font-bold text-amber-700 text-sm">
                    {formatCOP(pricing.finalTotal)}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {selectedIds.length > 0 && (
              <button
                onClick={() => setIsCheckoutOpen(true)}
                className="hidden sm:inline-flex px-3.5 py-2.5 rounded-xl font-semibold text-xs text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition"
              >
                Ver elegidas
              </button>
            )}
            <button
              onClick={() => setIsCheckoutOpen(true)}
              disabled={selectedIds.length === 0}
              className={`px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white transition ${
                selectedIds.length > 0
                  ? 'bg-neutral-900 hover:bg-neutral-800 shadow-sm'
                  : 'bg-neutral-300 cursor-not-allowed'
              }`}
            >
              Confirmar ({selectedIds.length})
            </button>
          </div>
        </div>
      </div>

      {zoomPhotoIndex !== null && displayedPhotos[zoomPhotoIndex] && (
        <LightboxModal
          photo={displayedPhotos[zoomPhotoIndex]}
          currentIndex={zoomPhotoIndex}
          totalPhotos={displayedPhotos.length}
          selectedCount={selectedIds.length}
          onlySelectedMode={onlySelectedFilter}
          onToggleOnlySelected={() => {
            setOnlySelectedFilter((prev) => !prev);
            setZoomPhotoIndex(0);
          }}
          isSelected={selectedIds.includes(displayedPhotos[zoomPhotoIndex].id)}
          selectionIndex={selectedIds.indexOf(displayedPhotos[zoomPhotoIndex].id)}
          includedLimit={activeEvent.includedPhotos}
          extraPrice={pricing.effectiveExtraPrice}
          watermarkText={activeEvent.watermarkText || STUDIO_CONFIG.watermark}
          onClose={() => setZoomPhotoIndex(null)}
          onToggleSelect={(photoId) => {
            toggleSelectPhoto(photoId);
            if (
              onlySelectedFilter &&
              selectedIds.length === 1 &&
              selectedIds[0] === photoId
            ) {
              setOnlySelectedFilter(false);
              setZoomPhotoIndex(null);
            } else if (
              onlySelectedFilter &&
              selectedIds.includes(photoId) &&
              zoomPhotoIndex >= displayedPhotos.length - 1
            ) {
              setZoomPhotoIndex(Math.max(0, zoomPhotoIndex - 1));
            }
          }}
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
        onRemovePhoto={toggleSelectPhoto}
        onClearAll={handleClearSelection}
      />
    </div>
  );
}