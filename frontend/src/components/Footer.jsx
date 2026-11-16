import { Mail, Phone, Instagram } from 'lucide-react';
import { STUDIO_CONFIG } from '../data/eventsData';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-16">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Marca en negro */}
          <div>
            <span className="font-black text-2xl tracking-tighter text-black uppercase">
              {STUDIO_CONFIG.name}
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Fotografía Profesional • Eventos, Deportes y Sesiones Privadas
            </p>
          </div>

          {/* Canales de Contacto */}
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
                <Instagram className="w-4 h-4" />
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