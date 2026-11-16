import { X, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCOP } from '../utils/formatters';

export default function LightboxModal({
  photo,
  isSelected,
  selectionIndex,
  includedLimit,
  extraPrice,
  watermarkText,
  onClose,
  onToggleSelect,
  onPrev,
  onNext,
}) {
  if (!photo) return null;

  const isExtra = isSelected && selectionIndex >= includedLimit;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex items-center justify-between text-white">
        <div>
          <p className="font-semibold text-sm">{photo.code}</p>
          <p className="text-xs text-slate-400">
            {isSelected
              ? isExtra
                ? `Foto adicional (+${formatCOP(extraPrice)})`
                : 'Incluida en tu paquete'
              : 'Toca seleccionar para agregar'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
        <button
          onClick={onPrev}
          className="absolute left-1 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/80"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="relative max-h-full max-w-full flex items-center justify-center">
          <img
            src={photo.url}
            alt={photo.code}
            draggable="false"
            className="max-h-[75vh] w-auto rounded-lg object-contain pointer-events-none"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none rotate-[-25deg]">
            <span className="text-white/40 font-black text-xl sm:text-3xl tracking-widest uppercase border-2 border-white/30 px-4 py-1">
              {watermarkText}
            </span>
          </div>
        </div>

        <button
          onClick={onNext}
          className="absolute right-1 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/80"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <button
        onClick={() => onToggleSelect(photo.id)}
        className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
          isSelected
            ? 'bg-emerald-600 text-white'
            : 'bg-[#0284C7] text-white hover:bg-[#0369A1]'
        }`}
      >
        <Check className="w-5 h-5" />
        {isSelected ? 'Foto Seleccionada (Toca para quitar)' : 'Seleccionar esta foto'}
      </button>
    </div>
  );
}