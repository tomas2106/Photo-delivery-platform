import { STUDIO_CONFIG } from '../data/eventsData';

export default function StudioLogo({ className = '' }) {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Isotipo vectorial de tu cámara en máxima nitidez */}
      <svg
        viewBox="0 0 120 76"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-auto text-black shrink-0"
        aria-hidden="true"
      >
        <path
          d="M8 56V26C8 20.4772 12.4772 16 18 16H31C34.5 16 37.5 13.8 39 10.5L41.5 5.5C43 2.5 46 1 49.5 1H70.5C74 1 77 2.5 78.5 5.5L81 10.5C82.5 13.8 85.5 16 89 16H102C107.523 16 112 20.4772 112 26V56"
          stroke="currentColor"
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M36 58C36 44.7452 46.7452 34 60 34C73.2548 34 84 44.7452 84 58"
          stroke="currentColor"
          strokeWidth="5.5"
          strokeLinecap="round"
        />
        <path
          d="M44 58C44 49.1634 51.1634 42 60 42C68.8366 42 76 49.1634 76 58"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      </svg>

      {/* Nombre del estudio */}
      <span className="font-black text-2xl tracking-tighter text-black uppercase leading-none">
        {STUDIO_CONFIG.name}
      </span>
    </div>
  );
}