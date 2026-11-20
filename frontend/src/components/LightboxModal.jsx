import { useEffect, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
} from 'lucide-react';
import { formatCOP } from '../utils/formatters';

export default function LightboxModal({
  photo,
  isSelected,
  selectionIndex,
  includedLimit,
  extraPrice,
  watermarkText = 'TOMASPH_PHOTOS',
  onClose,
  onToggleSelect,
  onPrev,
  onNext,
}) {
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // Bloqueo estricto del scroll trasero en móviles (iOS/Android) y PC
  useEffect(() => {
    if (!photo) return;

    const scrollY = window.scrollY;
    const body = document.body;
    const html = document.documentElement;

    const prevBodyOverflow = body.style.overflow;
    const prevBodyPosition = body.style.position;
    const prevBodyTop = body.style.top;
    const prevBodyWidth = body.style.width;
    const prevHtmlOverflow = html.style.overflow;

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.position = prevBodyPosition;
      body.style.top = prevBodyTop;
      body.style.width = prevBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [photo]);

  // Navegación por teclado en PC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrev, onNext]);

  if (!photo) return null;

  const isPayPerPhoto = includedLimit === 0;
  const isExtra = isSelected && (isPayPerPhoto || selectionIndex >= includedLimit);

  // Deslizamiento táctil (Swipe) para pasar fotos en celular
  const handleTouchStart = (e) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const distance = touchStartX.current - touchEndX.current;
      if (distance > 45) onNext();
      if (distance < -45) onPrev();
    }
  };

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-50 h-[100dvh] w-full bg-black/95 flex flex-col justify-between select-none overflow-hidden touch-none overscroll-none"
    >
      {/* Barra superior */}
      <div className="flex items-center justify-between px-4 py-3 text-white z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-xs sm:text-sm font-bold bg-white/10 px-3 py-1 rounded-full truncate">
            {photo.code}
          </span>
          {isSelected && (
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                isExtra
                  ? 'bg-amber-500 text-black'
                  : 'bg-neutral-100 text-neutral-950'
              }`}
            >
              {isPayPerPhoto
                ? `Elegida • ${formatCOP(extraPrice)}`
                : isExtra
                ? `Extra • +${formatCOP(extraPrice)}`
                : `Incluida #${selectionIndex + 1}`}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar vista previa"
          className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Contenedor central de la imagen + marca de agua */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center px-3 sm:px-16 overflow-hidden">
        {/* Flecha anterior (Escritorio) */}
        <button
          type="button"
          onClick={onPrev}
          aria-label="Foto anterior"
          className="hidden sm:flex absolute left-4 z-20 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white items-center justify-center transition"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Imagen protegida con patrón diagonal limpio */}
        <div className="relative max-h-full max-w-full flex items-center justify-center overflow-hidden rounded-lg">
          <img
            src={photo.url}
            alt={photo.code}
            draggable={false}
            className="max-h-[72dvh] sm:max-h-[78dvh] max-w-full object-contain pointer-events-none select-none"
          />

          {/* Marca de agua diagonal repetida de lado a lado */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none overflow-hidden flex flex-col justify-between py-5 opacity-35"
          >
            {[0, 1, 2, 3].map((row) => (
              <div
                key={row}
                className="whitespace-nowrap -rotate-24 text-white font-black tracking-[0.25em] text-xs sm:text-lg drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]"
              >
                {`${watermarkText}   •   `.repeat(5)}
              </div>
            ))}
          </div>
        </div>

        {/* Flecha siguiente (Escritorio) */}
        <button
          type="button"
          onClick={onNext}
          aria-label="Foto siguiente"
          className="hidden sm:flex absolute right-4 z-20 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white items-center justify-center transition"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Barra inferior de controles (Móvil + Escritorio) */}
      <div className="px-4 py-4 flex items-center justify-center gap-3 z-20 shrink-0">
        {/* Flecha anterior siempre visible en móviles */}
        <button
          type="button"
          onClick={onPrev}
          aria-label="Foto anterior"
          className="sm:hidden w-12 h-12 rounded-xl bg-white/15 active:bg-white/30 text-white flex items-center justify-center transition shrink-0"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          type="button"
          onClick={() => onToggleSelect(photo.id)}
          className={`flex-1 sm:flex-initial px-5 sm:px-6 h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg ${
            isSelected
              ? isExtra
                ? 'bg-amber-500 hover:bg-amber-400 text-black'
                : 'bg-amber-600 hover:bg-amber-500 text-white'
              : 'bg-white hover:bg-neutral-100 text-black'
          }`}
        >
          {isSelected ? (
            <>
              <Check className="w-4 h-4" />
              Foto seleccionada
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Seleccionar foto
            </>
          )}
        </button>

        {/* Flecha siguiente siempre visible en móviles */}
        <button
          type="button"
          onClick={onNext}
          aria-label="Foto siguiente"
          className="sm:hidden w-12 h-12 rounded-xl bg-white/15 active:bg-white/30 text-white flex items-center justify-center transition shrink-0"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}