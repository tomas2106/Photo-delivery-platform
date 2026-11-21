import { useState, useEffect } from 'react';
import JSZip from 'jszip';
import {
  Download,
  Archive,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { getDeliveryOrder, trackDeliveryDownload } from '../services/eventService';
import { STUDIO_CONFIG } from '../data/eventsData';
import StudioLogo from './StudioLogo';
import Footer from './Footer';

export default function DeliveryPortal({ token, onBackToHome }) {
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState({ current: 0, total: 0 });
  const [downloadingSingleId, setDownloadingSingleId] = useState(null);

  useEffect(() => {
    const loadDelivery = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getDeliveryOrder(token);
        setDelivery(data);
      } catch (err) {
        setError(err.message || 'No se pudo cargar esta entrega.');
      } finally {
        setLoading(false);
      }
    };

    loadDelivery();
  }, [token]);

  const handleDownloadSingle = async (photo, index) => {
    setDownloadingSingleId(index);
    try {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const extension = blob.type.includes('png') ? 'png' : 'jpg';
      const fileName = `${photo.code || `TOMASPH_${index + 1}`}.${extension}`;

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);

      trackDeliveryDownload(token);
    } catch {
      window.open(photo.url, '_blank');
    } finally {
      setDownloadingSingleId(null);
    }
  };

  const handleDownloadAllZip = async () => {
    if (!delivery || !delivery.photos || delivery.photos.length === 0) return;
    setDownloadingZip(true);
    setZipProgress({ current: 0, total: delivery.photos.length });

    try {
      const zip = new JSZip();
      const folderName = `TOMASPH_${delivery.orderNumber}_${delivery.clientName
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .slice(0, 25)}`;
      const folder = zip.folder(folderName);

      for (let i = 0; i < delivery.photos.length; i++) {
        const photo = delivery.photos[i];
        try {
          const resp = await fetch(photo.url);
          const blob = await resp.blob();
          const ext = blob.type.includes('png') ? 'png' : 'jpg';
          const fileName = `${photo.code || `FOTO_${i + 1}`}.${ext}`;
          folder.file(fileName, blob);
        } catch (err) {
          console.error(`Error empaquetando ${photo.code}:`, err);
        }
        setZipProgress({ current: i + 1, total: delivery.photos.length });
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const zipUrl = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = zipUrl;
      link.download = `${folderName}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(zipUrl);

      trackDeliveryDownload(token);
    } catch (err) {
      alert('No se pudo generar el archivo ZIP. Puedes descargar cada foto individualmente.');
      console.error(err);
    } finally {
      setDownloadingZip(false);
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#FAFAFA] text-neutral-900 flex flex-col">
      <header className="w-full bg-white border-b border-neutral-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
          <button type="button" onClick={onBackToHome} className="text-left focus:outline-none">
            <StudioLogo />
          </button>

          <button
            type="button"
            onClick={onBackToHome}
            className="px-3.5 py-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold inline-flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Ir al inicio
          </button>
        </div>
      </header>

      <main className="max-w-5xl w-full mx-auto px-4 py-8 flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-amber-600 gap-3">
            <Loader2 className="w-9 h-9 animate-spin" />
            <p className="text-xs font-semibold text-neutral-500">
              Preparando tu galería de entrega en alta calidad...
            </p>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto bg-white rounded-3xl p-8 border border-neutral-200 text-center my-10 shadow-xs">
            <AlertCircle className="w-11 h-11 text-amber-600 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-neutral-950">Enlace no disponible</h2>
            <p className="text-xs text-neutral-600 mt-2 leading-relaxed">{error}</p>
            <button
              type="button"
              onClick={onBackToHome}
              className="mt-6 px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-bold"
            >
              Volver a {STUDIO_CONFIG.name}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Encabezado de orden confirmada */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Orden #{delivery.orderNumber} • Entrega Oficial Sin Marca de Agua
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 pt-1">
                  ¡Hola, {delivery.clientName}!
                </h1>
                <p className="text-xs sm:text-sm text-neutral-600">
                  Evento: <strong>{delivery.eventTitle}</strong> •{' '}
                  <strong>{delivery.photos.length} fotografías</strong> listas para descargar en máxima calidad.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadAllZip}
                disabled={downloadingZip || delivery.photos.length === 0}
                className="px-6 py-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white font-bold text-sm inline-flex items-center justify-center gap-2.5 shadow-md transition shrink-0"
              >
                {downloadingZip ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
                    Empaquetando {zipProgress.current}/{zipProgress.total}...
                  </>
                ) : (
                  <>
                    <Archive className="w-5 h-5 text-amber-400" />
                    Descargar todas (.ZIP)
                  </>
                )}
              </button>
            </div>

            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl px-4 py-3 text-xs text-neutral-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Tip en iPhone / Android: Puedes descargar cada foto con el botón <strong>Descargar</strong> o bajar el paquete completo en <strong>.ZIP</strong> y abrirlo en tu app de Archivos.
              </span>
            </div>

            {/* Cuadrícula de fotos limpias */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {delivery.photos.map((photo, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl overflow-hidden border border-neutral-200 shadow-2xs flex flex-col"
                >
                  <div className="aspect-[4/3] bg-neutral-100 overflow-hidden">
                    <img
                      src={photo.url}
                      alt={photo.code}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-3.5 flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-neutral-800 truncate">
                      {photo.code}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDownloadSingle(photo, idx)}
                      disabled={downloadingSingleId === idx}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs inline-flex items-center gap-1.5 transition shrink-0"
                    >
                      {downloadingSingleId === idx ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      Descargar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}