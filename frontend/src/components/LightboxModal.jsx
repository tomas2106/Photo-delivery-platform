import { useEffect } from 'react';
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

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Barra superior */}
      <div className="flex items-center justify-between px-4 py-3 text-white z-20">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xs sm:text-sm font-bold bg-white/10 px-3 py-1 rounded-full">
            {photo.code}
          </span>
          {isSelected && (
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                isExtra
                  ? 'bg-amber-500 text-black'
                  : 'bg-[#0284C7] text-white'
              }`}
            >
              {isPayPerPhoto
                ? `Seleccionada • ${formatCOP(extraPrice)}`
                : isExtra
                ? `Adicional • +${formatCOP(extraPrice)}`
                : `Incluida #${selectionIndex + 1}`}
            </span>
          )}
        </div>

        <button
          onClick={onClose}
          aria-label="Cerrar vista previa"
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Contenedor central de la imagen + marca de agua limpia de lado a lado */}
      <div className="relative flex-1 flex items-center justify-center px-4 sm:px-14 overflow-hidden">
        {/* Flecha anterior */}
        <button
          onClick={onPrev}
          aria-label="Foto anterior"
          className="absolute left-2 sm:left-4 z-20 p-2.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Imagen con patrón diagonal limpio (sin recuadro negro) */}
        <div className="relative max-h-[76vh] max-w-full flex items-center justify-center overflow-hidden rounded-lg">
          <img
            src={photo.url}
            alt={photo.code}
            draggable={false}
            className="max-h-[76vh] max-w-full object-contain pointer-events-none"
          />

          {/* Marca de agua diagonal repetida de lado a lado, sutil y sin caja oscura */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none overflow-hidden flex flex-col justify-between py-6 opacity-35"
          >
            {[0, 1, 2, 3].map((row) => (
              <div
                key={row}
                className="whitespace-nowrap -rotate-24 text-white font-black tracking-[0.25em] text-sm sm:text-lg drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]"
              >
                {`${watermarkText}   •   `.repeat(5)}
              </div>
            ))}
          </div>
        </div>

        {/* Flecha siguiente */}
        <button
          onClick={onNext}
          aria-label="Foto siguiente"
          className="absolute right-2 sm:right-4 z-20 p-2.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Barra inferior de acción */}
      <div className="px-4 py-4 flex items-center justify-center z-20">
        <button
          onClick={() => onToggleSelect(photo.id)}
          className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition shadow-lg ${
            isSelected
              ? isExtra
                ? 'bg-amber-500 hover:bg-amber-400 text-black'
                : 'bg-[#0284C7] hover:bg-[#0369A1] text-white'
              : 'bg-white hover:bg-slate-100 text-black'
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
              Seleccionar esta foto
            </>
          )}
        </button>
      </div>
    </div>
  );
}