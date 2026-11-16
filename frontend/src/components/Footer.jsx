import { Mail, Phone } from 'lucide-react';
import { STUDIO_CONFIG } from '../data/eventsData';
import StudioLogo from './StudioLogo';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-16">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <StudioLogo />
            <p className="text-xs text-slate-500 mt-2">
              Fotografía Profesional • Eventos, Deportes y Sesiones Privadas
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-6 text-xs font-medium text-slate-700">
            <a
              href={`mailto:${STUDIO_CONFIG.email}`}
              className="flex items-center gap-2 hover:text-[#0284C7] transition"
            >
              <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-black">
                <Mail className="w-4 h-4" />
              </span>
              {STUDIO_CONFIG.email}
            </a>

            <a
              href={`https://wa.me/${STUDIO_CONFIG.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-[#25D366] transition"
            >
              <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-black">
                <Phone className="w-4 h-4" />
              </span>
              {STUDIO_CONFIG.whatsappDisplay}
            </a>

            <a
              href={STUDIO_CONFIG.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-pink-600 transition"
            >
              <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-black">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </span>
              @{STUDIO_CONFIG.instagram}
            </a>
          </div>
        </div>

        <div className="border-t border-slate-100 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <p>© {new Date().getFullYear()} {STUDIO_CONFIG.name}. Todos los derechos reservados.</p>
          <p>Plataforma de Selección y Entrega Fotográfica</p>
        </div>
      </div>
    </footer>
  );
}