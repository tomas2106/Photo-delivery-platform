import { Check, Search } from 'lucide-react';
import { formatCOP } from '../utils/formatters';

export default function PhotoCard({
  photo,
  isSelected,
  selectionIndex,
  includedLimit,
  extraPrice,
  watermarkText,
  onToggleSelect,
  onZoom,
}) {
  const isExtra = isSelected && selectionIndex >= includedLimit;

  return (
    <div
      onClick={() => onToggleSelect(photo.id)}
      onContextMenu={(e) => e.preventDefault()}
      className={`relative group rounded-2xl overflow-hidden bg-slate-100 aspect-[4/5] cursor-pointer transition-all duration-200 protected-photo ${
        isSelected ? 'ring-3 ring-[#0284C7] shadow-md' : 'border border-slate-200'
      }`}
    >
      <img
        src={photo.url}
        alt={photo.code}
        loading="lazy"
        draggable="false"
        className="w-full h-full object-cover select-none pointer-events-none"
      />

      {/* Marca de agua repetida */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-around items-center opacity-35 rotate-[-25deg] scale-125 overflow-hidden">
        {[1, 2, 3].map((row) => (
          <span
            key={row}
            className="text-white font-bold text-xs tracking-widest uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] whitespace-nowrap"
          >
            {watermarkText} • {watermarkText}
          </span>
        ))}
      </div>

      {/* Gradiente inferior */}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/65 via-black/20 to-transparent pointer-events-none" />

      {/* Check superior derecho */}
      <button
        type="button"
        aria-label="Seleccionar foto"
        className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
          isSelected
            ? 'bg-[#0284C7] text-white scale-105 shadow'
            : 'bg-black/40 border-2 border-white/80 text-transparent hover:bg-black/60'
        }`}
      >
        <Check className="w-4 h-4 stroke-[3]" />
      </button>

      {/* Código y badge de estado */}
      <div className="absolute bottom-2.5 left-2.5 flex flex-col gap-1 pointer-events-none">
        <span className="text-[11px] font-medium text-white/90 drop-shadow">
          {photo.code}
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[11px] font-bold w-fit shadow-sm ${
            isExtra
              ? 'bg-amber-500 text-white'
              : isSelected
              ? 'bg-[#0284C7] text-white'
              : 'bg-black/75 text-white'
          }`}
        >
          {isExtra ? `+ ${formatCOP(extraPrice)}` : 'Incluida'}
        </span>
      </div>

      {/* Botón Lupa */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onZoom(photo);
        }}
        aria-label="Ampliar foto"
        className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full bg-white/95 text-slate-800 flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition"
      >
        <Search className="w-4 h-4" />
      </button>
    </div>
  );
}