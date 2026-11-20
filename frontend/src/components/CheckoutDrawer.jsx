import { useState, useEffect } from 'react';
import { X, Send, Copy, CheckCircle2, Trash2, Tag } from 'lucide-react';
import {
  formatCOP,
  buildWhatsAppUrl,
  calculateOrderPricing,
} from '../utils/formatters';
import { STUDIO_CONFIG } from '../data/eventsData';
import { registerOrder } from '../services/eventService';

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

  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen]);

  if (!isOpen) return null;

  const totalSelected = selectedPhotos.length;
  const includedCount = Math.min(totalSelected, event.includedPhotos || 0);
  const watermarkText = event.watermarkText || STUDIO_CONFIG.watermark;
  const pricing = calculateOrderPricing(event, totalSelected);

  const { url, rawMessage } = buildWhatsAppUrl({
    phone: STUDIO_CONFIG.whatsapp,
    eventTitle: event.title,
    clientName: clientName.trim() || 'Cliente',
    selectedPhotos,
    event,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(rawMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendOrder = () => {
    if (totalSelected === 0) return;

    // Registrar silenciosamente el pedido y métricas en el backend
    registerOrder({
      eventId: event.id,
      clientName: clientName.trim() || 'Cliente',
      photoIds: selectedPhotos.map((p) => p.id),
      photoCodes: selectedPhotos.map((p) => p.code),
      subtotalAmount: pricing.subtotal,
      discountAmount: pricing.discountAmount,
      totalAmount: pricing.finalTotal,
    });
  };

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center select-none overscroll-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 max-h-[85dvh] flex flex-col shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3.5 shrink-0 touch-none">
          <div>
            <h3 className="text-lg font-bold text-neutral-950">Resumen de Selección</h3>
            <p className="text-xs text-neutral-500">
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
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-neutral-100"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>
        </div>

        <div
          style={{ WebkitOverflowScrolling: 'touch' }}
          className="py-4 space-y-4 overflow-y-auto overscroll-y-contain flex-1 min-h-0 pr-0.5"
        >
          {/* Banner de incentivo o confirmación de descuento por volumen */}
          {pricing.discountEnabled && pricing.minPhotos > 0 && pricing.discountPercent > 0 && (
            <div
              className={`rounded-xl p-3 text-xs flex items-center gap-2.5 border ${
                pricing.qualifiesForDiscount
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <Tag className="w-4 h-4 shrink-0 text-amber-600" />
              {pricing.qualifiesForDiscount ? (
                <span>
                  ¡Felicidades! Aplicaste al{' '}
                  <strong>{pricing.discountPercent}% de descuento por volumen</strong> (ahorras{' '}
                  <strong>{formatCOP(pricing.discountAmount)}</strong>).
                </span>
              ) : (
                <span>
                  Elige{' '}
                  <strong>
                    {pricing.photosNeededForDiscount}{' '}
                    {pricing.photosNeededForDiscount === 1 ? 'foto más' : 'fotos más'}
                  </strong>{' '}
                  (mín. {pricing.minPhotos}) y obtén{' '}
                  <strong>{pricing.discountPercent}% de descuento</strong>.
                </span>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Tu nombre completo *
            </label>
            <input
              type="text"
              placeholder="Ej. Camilo Andrés Pérez"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm select-text focus:outline-none focus:border-neutral-900"
            />
          </div>

          <div className="bg-neutral-50 rounded-xl p-4 space-y-2 text-sm border border-neutral-200/70">
            {!pricing.isPayPerPhoto && (
              <div className="flex justify-between text-neutral-600">
                <span>Fotos incluidas en contrato:</span>
                <span className="font-semibold text-neutral-950">
                  {includedCount} / {event.includedPhotos}
                </span>
              </div>
            )}
            <div className="flex justify-between text-neutral-600">
              <span>
                {pricing.isPayPerPhoto
                  ? `Fotos seleccionadas (${formatCOP(event.extraPhotoPrice)} c/u):`
                  : `Fotos adicionales (${formatCOP(event.extraPhotoPrice)} c/u):`}
              </span>
              <span className="font-semibold text-neutral-900">
                {pricing.isPayPerPhoto ? totalSelected : `+${pricing.billableCount}`}
              </span>
            </div>

            {pricing.qualifiesForDiscount && (
              <>
                <div className="flex justify-between text-neutral-500 text-xs">
                  <span>Subtotal:</span>
                  <span>{formatCOP(pricing.subtotal)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-semibold text-xs">
                  <span>Descuento volumen ({pricing.discountPercent}%):</span>
                  <span>-{formatCOP(pricing.discountAmount)}</span>
                </div>
              </>
            )}

            <div className="border-t border-neutral-200 pt-2 flex justify-between text-base font-bold text-neutral-950">
              <span>{pricing.isPayPerPhoto ? 'Total a pagar:' : 'Valor adicional a pagar:'}</span>
              <span className="text-amber-700">{formatCOP(pricing.finalTotal)}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-700">
                Fotos en tu selección ({totalSelected}):
              </span>
              {totalSelected > 0 && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-xs text-amber-700 font-semibold flex items-center gap-1 hover:underline"
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
              <div className="bg-neutral-50 border border-dashed border-neutral-300 rounded-xl p-6 text-center text-xs text-neutral-500">
                No tienes fotos seleccionadas en este momento.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {selectedPhotos.map((photo, idx) => {
                  const isExtra = pricing.isPayPerPhoto || idx >= event.includedPhotos;
                  return (
                    <div
                      key={photo.id}
                      onContextMenu={(e) => e.preventDefault()}
                      className="relative rounded-xl overflow-hidden border border-neutral-200 bg-neutral-900 aspect-square group"
                    >
                      <img
                        src={photo.url}
                        alt={photo.code}
                        draggable={false}
                        className="w-full h-full object-cover pointer-events-none select-none"
                      />

                      <div
                        aria-hidden="true"
                        className="absolute inset-0 pointer-events-none overflow-hidden flex flex-col justify-center gap-3 opacity-45"
                      >
                        {[0, 1, 2].map((row) => (
                          <div
                            key={row}
                            className="whitespace-nowrap -rotate-24 text-white font-black tracking-widest text-[8px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                          >
                            {`${watermarkText} • `.repeat(3)}
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemovePhoto(photo.id)}
                        title="Quitar de la selección"
                        className="absolute top-1 right-1 z-10 w-6 h-6 rounded-full bg-black/80 hover:bg-red-600 text-white flex items-center justify-center transition shadow"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      <div className="absolute inset-x-0 bottom-0 z-10 bg-black/75 px-1.5 py-0.5 text-[10px] text-white flex items-center justify-between">
                        <span className="truncate font-medium">{photo.code}</span>
                        {isExtra && <span className="text-amber-400 font-bold ml-1">$</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-neutral-100 shrink-0 touch-none">
          <a
            href={totalSelected > 0 ? url : '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (totalSelected === 0) {
                e.preventDefault();
                return;
              }
              handleSendOrder();
            }}
            className={`w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-lg transition ${
              totalSelected > 0
                ? 'bg-[#25D366] hover:bg-[#1ebe5d]'
                : 'bg-neutral-300 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
            Enviar selección a {STUDIO_CONFIG.name}
          </a>
        </div>
      </div>
    </div>
  );
}