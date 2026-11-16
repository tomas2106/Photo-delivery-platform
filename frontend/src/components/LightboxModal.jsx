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
      {/* Cabecera */}
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
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Imagen ampliada con malla de marca de agua de alto contraste */}
      <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
        <button
          onClick={onPrev}
          className="absolute left-1 z-20 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/90 transition"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="relative max-h-full max-w-full flex items-center justify-center overflow-hidden rounded-lg">
          <img
            src={photo.url}
            alt={photo.code}
            draggable="false"
            className="max-h-[75vh] w-auto object-contain pointer-events-none select-none"
          />

          {/* Malla diagonal repetida sobre toda el área de la fotografía */}
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between py-6 items-center rotate-[-28deg] scale-125 overflow-hidden">
            {[1, 2, 3, 4, 5].map((row) => (
              <div
                key={row}
                className="flex items-center gap-8 whitespace-nowrap opacity-65"
              >
                <span className="text-white font-black text-sm sm:text-lg tracking-[0.2em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                  {watermarkText}
                </span>
                <span className="text-white font-black text-sm sm:text-lg tracking-[0.2em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                  {watermarkText}
                </span>
              </div>
            ))}
          </div>

          {/* Sello central reforzado */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none rotate-[-28deg]">
            <span className="bg-black/35 backdrop-blur-[1px] text-white/90 font-black text-base sm:text-2xl tracking-[0.25em] uppercase border-2 border-white/60 px-5 py-1.5 rounded-md shadow-lg drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
              {watermarkText}
            </span>
          </div>
        </div>

        <button
          onClick={onNext}
          className="absolute right-1 z-20 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/90 transition"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Botón inferior de selección */}
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