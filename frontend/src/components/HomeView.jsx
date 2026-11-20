import { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Camera,
  Images,
  MessageCircle,
  Award,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  CalendarCheck,
  Clock,
  MapPin,
} from 'lucide-react';
import { PORTFOLIO_DATA, PORTFOLIO_PHOTOS } from '../data/portfolioData';
import { STUDIO_CONFIG } from '../data/eventsData';

function InstagramIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

const COVERAGE_TYPES = [
  'Motociclismo / Válida en pista',
  'Torneo o Partido de Fútbol',
  'Evento Deportivo Empresarial / Club',
  'Sesión Personalizada (Piloto / Jugador)',
  'Evento Social (Matrimonio / XV Años)',
];

const COVERAGE_DURATIONS = [
  '2 horas (Sesión puntual)',
  'Media jornada (4 horas)',
  'Jornada completa (8 horas)',
  'Fin de semana completo',
];

export default function HomeView({ onGoToGallery }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Estado del Cotizador Interactivo de Disponibilidad
  const [quoteType, setQuoteType] = useState(COVERAGE_TYPES[0]);
  const [quoteDuration, setQuoteDuration] = useState(COVERAGE_DURATIONS[1]);
  const [quoteCity, setQuoteCity] = useState('');
  const [quoteDate, setQuoteDate] = useState('');

  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const totalSlides = PORTFOLIO_PHOTOS.length;

  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, totalSlides]);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const handleTouchStart = (e) => {
    setIsPaused(true);
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const distance = touchStartX.current - touchEndX.current;
      const minSwipeDistance = 40;
      if (distance > minSwipeDistance) {
        handleNext();
      } else if (distance < -minSwipeDistance) {
        handlePrev();
      }
    }
    setIsPaused(false);
  };

  const buildContactWhatsApp = (customTopic = '') => {
    const cleanPhone = String(STUDIO_CONFIG.whatsapp || '').replace(/\D/g, '');
    const text = customTopic
      ? `Hola ${STUDIO_CONFIG.name}, vi tu portafolio en la web y me gustaría cotizar cobertura fotográfica para: ${customTopic}.`
      : `Hola ${STUDIO_CONFIG.name}, vi tu portafolio en la página web y me gustaría información para cubrir mi próximo evento deportivo.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  const buildInteractiveQuoteUrl = () => {
    const cleanPhone = String(STUDIO_CONFIG.whatsapp || '').replace(/\D/g, '');
    const lines = [
      `Hola ${STUDIO_CONFIG.name}! Quisiera consultar disponibilidad y cotización para una cobertura:`,
      '',
      `• *Tipo de cobertura:* ${quoteType}`,
      `• *Duración estimada:* ${quoteDuration}`,
      `• *Ciudad / Pista / Cancha:* ${quoteCity.trim() || 'Por definir'}`,
      `• *Fecha tentativa:* ${quoteDate.trim() || 'Por confirmar'}`,
    ];
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(lines.join('\n'))}`;
  };

  const activePhoto = PORTFOLIO_PHOTOS[currentSlide] || PORTFOLIO_PHOTOS[0];

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="flex-1 bg-[#FAFAFA] text-neutral-900 select-none"
    >
      {/* SECCIÓN 1: HERO LUMINOSO Y EDITORIAL */}
      <section className="relative bg-gradient-to-br from-white via-amber-50/40 to-stone-100 border-b border-neutral-200/80 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 border border-amber-200/80 px-3.5 py-1.5 rounded-full mb-5">
              <Camera className="w-3.5 h-3.5 text-amber-700" />
              {PORTFOLIO_DATA.tagline}
            </span>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.12] text-neutral-950">
              {PORTFOLIO_DATA.heroTitle}
            </h1>

            <p className="text-sm sm:text-base text-neutral-600 mt-5 leading-relaxed">
              {PORTFOLIO_DATA.heroSubtitle}
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-8">
              <a
                href="#cotizador"
                className="px-6 py-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm inline-flex items-center gap-2 shadow-sm transition"
              >
                <CalendarCheck className="w-4 h-4 text-amber-400" />
                Solicitar Disponibilidad
              </a>

              <button
                type="button"
                onClick={onGoToGallery}
                className="px-6 py-3.5 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-900 font-bold text-sm inline-flex items-center gap-2 shadow-2xs transition"
              >
                <Images className="w-4 h-4 text-amber-600" />
                Galería de Clientes
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 sm:gap-6 mt-12 pt-7 border-t border-neutral-200/80">
              {PORTFOLIO_DATA.highlights.map((item, idx) => (
                <div key={idx}>
                  <div className="text-xl sm:text-2xl font-black text-neutral-950">
                    {item.number}
                  </div>
                  <div className="text-[11px] sm:text-xs text-neutral-500 mt-0.5">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white p-3 rounded-3xl border border-neutral-200 shadow-xl">
              <div className="relative rounded-2xl overflow-hidden aspect-[4/5] bg-neutral-100">
                <img
                  src={activePhoto?.url}
                  alt={activePhoto?.title}
                  draggable={false}
                  className="w-full h-full object-cover transition-all duration-700 pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                <div className="absolute bottom-4 inset-x-4 text-white flex items-end justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300">
                      {activePhoto?.category}
                    </span>
                    <p className="text-sm font-bold leading-snug">{activePhoto?.title}</p>
                  </div>
                  <span className="text-[10px] font-semibold bg-white/20 backdrop-blur-xs px-2.5 py-1 rounded-full">
                    {STUDIO_CONFIG.name}
                  </span>
                </div>
              </div>

              <div className="pt-3 px-1 flex items-center justify-between text-xs">
                <a
                  href={PORTFOLIO_DATA.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-bold text-neutral-800 hover:text-amber-700 transition"
                >
                  <InstagramIcon className="w-4 h-4 text-pink-600" />
                  {PORTFOLIO_DATA.instagramHandle}
                </a>
                <span className="text-[11px] text-neutral-500 font-medium">
                  Cobertura en Colombia
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 2: CARRUSEL DE PORTAFOLIO DESLIZABLE */}
      <section className="max-w-5xl mx-auto px-4 py-14 sm:py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-amber-700">
              Portafolio Destacado
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-950 mt-1">
              Momentos capturados en acción
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Desliza hacia los lados o usa las flechas para explorar nuestras mejores tomas.
            </p>
          </div>

          <a
            href="#cotizador"
            className="text-xs font-bold text-neutral-900 hover:text-amber-700 inline-flex items-center gap-1 transition"
          >
            Cotizar cobertura para mi evento <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative rounded-3xl overflow-hidden bg-neutral-900 aspect-[4/3] sm:aspect-[16/9] shadow-lg border border-neutral-200 touch-pan-y cursor-grab active:cursor-grabbing"
        >
          <img
            src={activePhoto.url}
            alt={activePhoto.title}
            draggable={false}
            className="w-full h-full object-cover transition-all duration-500 pointer-events-none"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent pointer-events-none" />

          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-xs px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest text-neutral-900 uppercase shadow-xs pointer-events-none">
            {STUDIO_CONFIG.watermark}
          </div>

          <button
            type="button"
            onClick={handlePrev}
            aria-label="Foto anterior"
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-neutral-900 flex items-center justify-center shadow-md transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Foto siguiente"
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-neutral-900 flex items-center justify-center shadow-md transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white">
            <div>
              <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest text-amber-300 mb-1">
                {activePhoto.category} • {currentSlide + 1} / {totalSlides}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold">{activePhoto.title}</h3>
            </div>

            <a
              href={buildContactWhatsApp(activePhoto.category)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs inline-flex items-center gap-2 transition self-start sm:self-auto shadow-md"
            >
              <MessageCircle className="w-4 h-4" />
              Contratar cobertura similar
            </a>
          </div>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pt-4 pb-2 no-scrollbar">
          {PORTFOLIO_PHOTOS.map((photo, idx) => {
            const isActive = idx === currentSlide;
            return (
              <button
                key={photo.id}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                className={`relative w-20 h-14 sm:w-24 sm:h-16 rounded-xl overflow-hidden shrink-0 border-2 transition ${
                  isActive
                    ? 'border-amber-600 scale-105 shadow-md'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={photo.url}
                  alt={photo.title}
                  draggable={false}
                  className="w-full h-full object-cover pointer-events-none"
                />
              </button>
            );
          })}
        </div>
      </section>

      {/* SECCIÓN 3: SOBRE MÍ (+4 AÑOS DE EXPERIENCIA E INSTAGRAM) */}
      <section className="bg-white border-y border-neutral-200/80 py-14 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-amber-700">
              <Award className="w-4 h-4" />
              Sobre mí y trayectoria
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-950">
              {PORTFOLIO_DATA.aboutTitle}
            </h2>

            {PORTFOLIO_DATA.aboutParagraphs.map((paragraph, index) => (
              <p key={index} className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                {paragraph}
              </p>
            ))}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                +4 años en fotografía de eventos deportivos
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                Cobertura en motociclismo y fútbol
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                Edición profesional de color y nitidez
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                Galerías digitales rápidas y seguras
              </div>
            </div>

            <div className="pt-3">
              <a
                href={PORTFOLIO_DATA.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-pink-600 to-purple-600 text-white font-bold text-xs shadow-sm hover:opacity-95 transition"
              >
                <InstagramIcon className="w-4 h-4" />
                Ver más en Instagram ({PORTFOLIO_DATA.instagramHandle})
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 bg-gradient-to-br from-amber-50 via-orange-50/70 to-stone-100 rounded-3xl p-7 border border-amber-200/80 shadow-sm">
            <Sparkles className="w-7 h-7 text-amber-600 mb-3" />
            <h3 className="text-xl font-black text-neutral-950">
              Hagamos de tu evento deportivo un recuerdo inolvidable
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 mt-2 leading-relaxed">
              ¿Organizas un torneo de fútbol, una válida de motociclismo o deseas cobertura personalizada para tu equipo? Escríbeme y planeemos la cobertura ideal.
            </p>

            <div className="mt-6 space-y-2.5">
              <a
                href="#cotizador"
                className="w-full py-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-sm"
              >
                <CalendarCheck className="w-4 h-4 text-amber-400" />
                Configurar cotización rápida
              </a>

              <button
                type="button"
                onClick={onGoToGallery}
                className="w-full py-3 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-900 font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                Ya participé en un evento • Buscar mis fotos
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 4: SERVICIOS */}
      <section className="max-w-5xl mx-auto px-4 pt-14 sm:pt-16 pb-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-extrabold uppercase tracking-widest text-amber-700">
            Servicios Fotográficos
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-950 mt-1">
            Coberturas diseñadas para destacar
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PORTFOLIO_DATA.services.map((service, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-full">
                  {service.tag}
                </span>
                <h3 className="text-lg font-bold text-neutral-950 mt-3">
                  {service.title}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 mt-2 leading-relaxed">
                  {service.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setQuoteType(service.title);
                  document.getElementById('cotizador')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="mt-6 pt-4 border-t border-neutral-100 text-xs font-bold text-neutral-900 hover:text-amber-700 inline-flex items-center justify-between transition w-full"
              >
                <span>Cotizar este servicio</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* SECCIÓN 5: COTIZADOR INTERACTIVO DE DISPONIBILIDAD */}
      <section id="cotizador" className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-md overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-5 bg-neutral-950 text-white p-7 sm:p-9 flex flex-col justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                Reserva y Disponibilidad
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mt-4 leading-tight">
                Cotiza la cobertura de tu próximo evento
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-3 leading-relaxed">
                Selecciona el tipo de cobertura y la duración estimada. Recibirás una propuesta personalizada directa en tu WhatsApp.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 space-y-2.5 text-xs text-zinc-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Entrega en galería digital privada o pública</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Atención a pilotos, equipos, marcas y organizadores</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 p-7 sm:p-9 space-y-5">
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-2">
                1. Tipo de cobertura
              </label>
              <div className="flex flex-wrap gap-2">
                {COVERAGE_TYPES.map((type) => {
                  const active = quoteType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setQuoteType(type)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition border ${
                        active
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                          : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-400'
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-800 mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                2. Duración estimada
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {COVERAGE_DURATIONS.map((duration) => {
                  const active = quoteDuration === duration;
                  return (
                    <button
                      key={duration}
                      type="button"
                      onClick={() => setQuoteDuration(duration)}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition border ${
                        active
                          ? 'bg-amber-50 text-amber-950 border-amber-500 font-bold'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                      }`}
                    >
                      {duration}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-neutral-800 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  3. Ciudad o escenario
                </label>
                <input
                  type="text"
                  placeholder="Ej. Autódromo Tocancipá / Bogotá"
                  value={quoteCity}
                  onChange={(e) => setQuoteCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs select-text focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-800 mb-1.5 flex items-center gap-1.5">
                  <CalendarCheck className="w-3.5 h-3.5 text-amber-600" />
                  4. Fecha estimada
                </label>
                <input
                  type="text"
                  placeholder="Ej. Próximo domingo / 15 de diciembre"
                  value={quoteDate}
                  onChange={(e) => setQuoteDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs select-text focus:outline-none focus:border-neutral-900"
                />
              </div>
            </div>

            <div className="pt-2">
              <a
                href={buildInteractiveQuoteUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-sm flex items-center justify-center gap-2 shadow-md transition"
              >
                <MessageCircle className="w-5 h-5" />
                Solicitar disponibilidad por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}