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
  Smartphone,
} from 'lucide-react';
import { getDeliveryOrder, trackDeliveryDownload } from '../services/eventService';
import { STUDIO_CONFIG } from '../data/eventsData';
import { getOptimizedCloudinaryUrl } from '../utils/formatters';
import StudioLogo from './StudioLogo';
import Footer from './Footer';

const MOBILE_SHARE_BATCH_SIZE = 6;

export default function DeliveryPortal({ token, onBackToHome }) {
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [downloadingZip, setDownloadingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState({ current: 0, total: 0 });

  const [savingToGalleryBatch, setSavingToGalleryBatch] = useState(false);
  const [galleryBatchProgress, setGalleryBatchProgress] = useState({ current: 0, total: 0 });
  const [nextBatchStartIndex, setNextBatchStartIndex] = useState(0);

  const [downloadingSingleId, setDownloadingSingleId] = useState(null);
  const [canShareFiles, setCanShareFiles] = useState(false);

  useEffect(() => {
    // Detectar si el dispositivo soporta guardar archivos directo en Fotos/Galería (iOS Safari / Android Chrome)
    try {
      if (typeof navigator !== 'undefined' && navigator.canShare && typeof File !== 'undefined') {
        const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        setCanShareFiles(navigator.canShare({ files: [testFile] }));
      }
    } catch {
      setCanShareFiles(false);
    }
  }, []);

  useEffect(() => {
    const loadDelivery = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getDeliveryOrder(token);
        setDelivery(data);
        setNextBatchStartIndex(0);
      } catch (err) {
        setError(err.message || 'No se pudo cargar esta entrega.');
      } finally {
        setLoading(false);
      }
    };

    loadDelivery();
  }, [token]);

  const fetchPhotoAsFile = async (photo, index) => {
    const response = await fetch(photo.url);
    const blob = await response.blob();
    const isPng = blob.type.includes('png');
    const extension = isPng ? 'png' : 'jpg';
    const mimeType = isPng ? 'image/png' : 'image/jpeg';
    const fileName = `${photo.code || `TOMASPH_${index + 1}`}.${extension}`;
    const file = new File([blob], fileName, { type: mimeType });
    return { blob, file, fileName };
  };

  // Guarda 1 foto: en celular abre "Guardar en Fotos/Galería"; en PC descarga directo
  const handleSaveOrDownloadSingle = async (photo, index) => {
    setDownloadingSingleId(index);
    try {
      const { blob, file, fileName } = await fetchPhotoAsFile(photo, index);

      if (canShareFiles && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: fileName,
        });
        trackDeliveryDownload(token);
        return;
      }

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);

      trackDeliveryDownload(token);
    } catch (err) {
      if (err?.name !== 'AbortError') {
        window.open(photo.url, '_blank');
      }
    } finally {
      setDownloadingSingleId(null);
    }
  };

  // Guarda lote en Fotos/Galería del celular (en tandas de 6 para compatibilidad total con iPhone)
  const handleSaveBatchToMobileGallery = async () => {
    if (!delivery || !delivery.photos || delivery.photos.length === 0) return;

    const total = delivery.photos.length;
    const start = nextBatchStartIndex >= total ? 0 : nextBatchStartIndex;
    const end = Math.min(start + MOBILE_SHARE_BATCH_SIZE, total);
    const slice = delivery.photos.slice(start, end);

    setSavingToGalleryBatch(true);
    setGalleryBatchProgress({ current: 0, total: slice.length });

    try {
      const filesToShare = [];
      for (let i = 0; i < slice.length; i++) {
        const { file } = await fetchPhotoAsFile(slice[i], start + i);
        filesToShare.push(file);
        setGalleryBatchProgress({ current: i + 1, total: slice.length });
      }

      if (navigator.canShare && navigator.canShare({ files: filesToShare })) {
        await navigator.share({
          files: filesToShare,
          title: `${delivery.eventTitle} (${start + 1}-${end} de ${total})`,
        });
        trackDeliveryDownload(token);
        setNextBatchStartIndex(end >= total ? 0 : end);
      } else {
        alert('Tu navegador no permite guardar en lote; usa el botón "Guardar en Fotos" de cada imagen o descarga el .ZIP.');
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        console.error('Error compartiendo lote a galería:', err);
      }
    } finally {
      setSavingToGalleryBatch(false);
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
      alert('No se pudo generar el archivo ZIP. Puedes guardar cada foto individualmente.');
      console.error(err);
    } finally {
      setDownloadingZip(false);
    }
  };

  const totalPhotosCount = delivery?.photos?.length || 0;
  const currentBatchEnd = Math.min(nextBatchStartIndex + MOBILE_SHARE_BATCH_SIZE, totalPhotosCount);
  const needsMultipleBatches = totalPhotosCount > MOBILE_SHARE_BATCH_SIZE;

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
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
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
                  <strong>{totalPhotosCount} fotografías</strong> listas en máxima calidad.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                {canShareFiles && totalPhotosCount > 0 && (
                  <button
                    type="button"
                    onClick={handleSaveBatchToMobileGallery}
                    disabled={savingToGalleryBatch || downloadingZip}
                    className="px-5 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:bg-neutral-300 text-neutral-950 font-extrabold text-sm inline-flex items-center justify-center gap-2 shadow-md transition"
                  >
                    {savingToGalleryBatch ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Preparando {galleryBatchProgress.current}/{galleryBatchProgress.total}...
                      </>
                    ) : (
                      <>
                        <Smartphone className="w-5 h-5" />
                        {needsMultipleBatches
                          ? `Guardar en Fotos (${nextBatchStartIndex + 1}-${currentBatchEnd} de ${totalPhotosCount})`
                          : `Guardar ${totalPhotosCount} en Fotos`}
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleDownloadAllZip}
                  disabled={downloadingZip || savingToGalleryBatch || totalPhotosCount === 0}
                  className="px-6 py-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white font-bold text-sm inline-flex items-center justify-center gap-2.5 shadow-md transition"
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
            </div>

            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl px-4 py-3 text-xs text-neutral-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              {canShareFiles ? (
                <span>
                  En tu celular toca <strong>Guardar en Fotos</strong> y luego selecciona{' '}
                  <strong>&ldquo;Guardar imagen / Guardar imágenes&rdquo;</strong> para que vayan directo a tu galería sin pasar por Documentos.
                </span>
              ) : (
                <span>
                  Descarga cada foto individualmente o baja el paquete completo en <strong>.ZIP</strong> en máxima resolución.
                </span>
              )}
            </div>

            {/* Cuadrícula de fotos limpias */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {delivery.photos.map((photo, idx) => {
                const displayUrl = getOptimizedCloudinaryUrl(photo.url, 'cover');
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl overflow-hidden border border-neutral-200 shadow-2xs flex flex-col"
                  >
                    <div className="aspect-[4/3] bg-neutral-100 overflow-hidden">
                      <img
                        src={displayUrl}
                        alt={photo.code}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="p-3.5 flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-neutral-800 truncate">
                        {photo.code}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleSaveOrDownloadSingle(photo, idx)}
                        disabled={downloadingSingleId === idx}
                        className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs inline-flex items-center gap-1.5 transition shrink-0"
                      >
                        {downloadingSingleId === idx ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        {canShareFiles ? 'Guardar en Fotos' : 'Descargar'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}