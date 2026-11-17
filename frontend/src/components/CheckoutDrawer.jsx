import { useState } from 'react';
import { X, Send, Copy, CheckCircle2, Trash2 } from 'lucide-react';
import { formatCOP, buildWhatsAppUrl } from '../utils/formatters';
import { STUDIO_CONFIG } from '../data/eventsData';

export default function CheckoutDrawer({
  isOpen,
  onClose,
  event,
  selectedPhotos,
  onRemovePhoto,
  onClearAll,
}) {
  const [clientName, setClientName] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isPayPerPhoto = event.includedPhotos === 0;
  const totalSelected = selectedPhotos.length;
  const includedCount = Math.min(totalSelected, event.includedPhotos);
  const extraCount = Math.max(0, totalSelected - event.includedPhotos);
  const extraTotal = extraCount * event.extraPhotoPrice;

  const { url, rawMessage } = buildWhatsAppUrl({
    phone: STUDIO_CONFIG.whatsapp,
    eventTitle: event.title,
    clientName: clientName.trim() || 'Cliente',
    selectedPhotos,
    includedLimit: event.includedPhotos,
    extraPrice: event.extraPhotoPrice,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(rawMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-6 max-h-[90vh] flex flex-col shadow-2xl">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Resumen de Selección</h3>
            <p className="text-xs text-slate-500">
              {totalSelected} {totalSelected === 1 ? 'foto elegida' : 'fotos elegidas'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {totalSelected > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-xs font-semibold text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition"
              >
                <Trash2 className="w-3.5 h-3.5" /> Vaciar
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tu nombre completo *
            </label>
            <input
              type="text"
              placeholder="Ej. Camilo Andrés Pérez"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#0284C7]"
            />
          </div>

          {/* Resumen financiero */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm border border-slate-100">
            {!isPayPerPhoto && (
              <div className="flex justify-between text-slate-600">
                <span>Fotos incluidas en contrato:</span>
                <span className="font-semibold text-slate-900">
                  {includedCount} / {event.includedPhotos}
                </span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>
                {isPayPerPhoto
                  ? `Fotos seleccionadas (${formatCOP(event.extraPhotoPrice)} c/u):`
                  : `Fotos adicionales (${formatCOP(event.extraPhotoPrice)} c/u):`}
              </span>
              <span className="font-semibold text-amber-600">
                {isPayPerPhoto ? totalSelected : `+${extraCount}`}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between text-base font-bold text-slate-900">
              <span>{isPayPerPhoto ? 'Total a pagar:' : 'Valor adicional a pagar:'}</span>
              <span className="text-[#0284C7]">{formatCOP(extraTotal)}</span>
            </div>
          </div>

          {/* Galería visual de fotos seleccionadas con opción de eliminar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">
                Fotos en tu selección ({totalSelected}):
              </span>
              {totalSelected > 0 && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-xs text-[#0284C7] font-medium flex items-center gap-1 hover:underline"
                >
                  {copied ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied ? 'Copiado' : 'Copiar códigos'}
                </button>
              )}
            </div>

            {totalSelected === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-6 text-center text-xs text-slate-500">
                No tienes fotos seleccionadas en este momento.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-52 overflow-y-auto p-1">
                {selectedPhotos.map((photo, idx) => {
                  const isExtra = idx >= event.includedPhotos;
                  return (
                    <div
                      key={photo.id}
                      className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square group"
                    >
                      <img
                        src={photo.url}
                        alt={photo.code}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => onRemovePhoto(photo.id)}
                        title="Quitar de la selección"
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/75 hover:bg-red-600 text-white flex items-center justify-center transition shadow"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="absolute inset-x-0 bottom-0 bg-black/70 px-1.5 py-0.5 text-[10px] text-white flex items-center justify-between">
                        <span className="truncate font-medium">{photo.code}</span>
                        {isExtra && (
                          <span className="text-amber-400 font-bold ml-1">$</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Botón WhatsApp */}
        <a
          href={totalSelected > 0 ? url : '#'}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            if (totalSelected === 0) e.preventDefault();
          }}
          className={`w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-lg transition ${
            totalSelected > 0
              ? 'bg-[#25D366] hover:bg-[#1ebe5d]'
              : 'bg-slate-300 cursor-not-allowed'
          }`}
        >
          <Send className="w-5 h-5" />
          Enviar selección a {STUDIO_CONFIG.name}
        </a>
      </div>
    </div>
  );
}