import { useState } from 'react';
import {
  Plus,
  Trash2,
  Lock,
  ArrowLeft,
  ImagePlus,
  KeyRound,
  FolderKanban,
  Pencil,
  Eye,
  EyeOff,
  Check,
  X,
} from 'lucide-react';
import { CATEGORY_STRUCTURE, STUDIO_CONFIG } from '../data/eventsData';
import { createEvent, updateEvent, deleteEvent } from '../services/eventService';
import { formatCOP } from '../utils/formatters';

export default function AdminPanel({ events, onEventsUpdated, onClose }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState(false);

  const [editingEventId, setEditingEventId] = useState(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORY_STRUCTURE[0].name);
  const [subcategory, setSubcategory] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [pin, setPin] = useState('');
  const [includedPhotos, setIncludedPhotos] = useState(40);
  const [extraPhotoPrice, setExtraPhotoPrice] = useState(2000);
  const [coverImage, setCoverImage] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [photoUrlsText, setPhotoUrlsText] = useState('');

  const selectedCatObj = CATEGORY_STRUCTURE.find((c) => c.name === category);
  const availableSubcategories = selectedCatObj ? selectedCatObj.subcategories : [];

  const parsedPreviewUrls = photoUrlsText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const resetForm = () => {
    setEditingEventId(null);
    setTitle('');
    setCategory(CATEGORY_STRUCTURE[0].name);
    setSubcategory('');
    setDate('');
    setLocation('');
    setPin('');
    setIncludedPhotos(40);
    setExtraPhotoPrice(2000);
    setCoverImage('');
    setIsActive(true);
    setPhotoUrlsText('');
  };

  const handleEditClick = (ev) => {
    setEditingEventId(ev.id);
    setTitle(ev.title);
    setCategory(ev.category);
    setSubcategory(ev.subcategory || '');
    setDate(ev.date || '');
    setLocation(ev.location || '');
    setPin(ev.pin || '');
    setIncludedPhotos(ev.includedPhotos ?? 0);
    setExtraPhotoPrice(ev.extraPhotoPrice ?? 2000);
    setCoverImage(ev.coverImage || '');
    setIsActive(ev.isActive !== false);
    setPhotoUrlsText((ev.photos || []).map((p) => p.url).join('\n'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    const found = CATEGORY_STRUCTURE.find((c) => c.name === newCat);
    if (found && found.subcategories.length > 0) {
      setSubcategory(found.subcategories[0]);
      // Sugerencia automática para Deportes: 0 fotos incluidas (venta individual)
      if (newCat === 'Deportes' && !editingEventId) {
        setIncludedPhotos(0);
      }
    } else {
      setSubcategory('');
      if (!editingEventId) {
        setIncludedPhotos(40);
      }
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPassword === STUDIO_CONFIG.adminPin) {
      setIsAuthenticated(true);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();

    const formattedPhotos = parsedPreviewUrls.map((url, idx) => {
      const codeNum = String(idx + 1).padStart(3, '0');
      return {
        id: `photo-${idx + 1}-${url.slice(-8)}`,
        code: `TOMASPH_${codeNum}`,
        url,
      };
    });

    const finalCover =
      coverImage.trim() ||
      (formattedPhotos[0] ? formattedPhotos[0].url : '/demo/foto1.jpg');

    const parsedIncluded =
      includedPhotos === '' ? 0 : Math.max(0, Number(includedPhotos));
    const parsedExtraPrice =
      extraPhotoPrice === '' ? 0 : Math.max(0, Number(extraPhotoPrice));

    const payload = {
      title: title.trim(),
      category,
      subcategory: availableSubcategories.length > 0 ? subcategory : '',
      date: date.trim() || 'Fecha por confirmar',
      location: location.trim() || 'Colombia',
      pin: pin.trim(),
      includedPhotos: parsedIncluded,
      extraPhotoPrice: parsedExtraPrice,
      isActive,
      watermarkText: STUDIO_CONFIG.watermark,
      coverImage: finalCover,
      photos: formattedPhotos,
    };

    if (editingEventId) {
      await updateEvent(editingEventId, payload);
    } else {
      await createEvent({
        id: `evt-${Date.now()}`,
        ...payload,
      });
    }

    await onEventsUpdated();
    resetForm();
  };

  const handleToggleActive = async (ev) => {
    const nextState = ev.isActive === false ? true : false;
    await updateEvent(ev.id, { isActive: nextState });
    await onEventsUpdated();
  };

  const handleDelete = async (id, eventTitle) => {
    if (window.confirm(`¿Seguro que deseas eliminar permanentemente "${eventTitle}"?`)) {
      await deleteEvent(id);
      if (editingEventId === id) resetForm();
      await onEventsUpdated();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-sm rounded-2xl p-6 border border-slate-200 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center mx-auto mb-4">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-lg text-slate-900">Panel de Administración</h2>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            Acceso exclusivo para gestión de eventos de {STUDIO_CONFIG.name}
          </p>
          <form onSubmit={handleAdminLogin} className="space-y-3">
            <input
              type="password"
              placeholder="Contraseña de administrador"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm text-center focus:outline-none focus:border-black"
            />
            {authError && (
              <p className="text-xs text-red-600 font-medium">Contraseña incorrecta</p>
            )}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-black hover:bg-slate-800 text-white font-bold text-sm transition"
            >
              Entrar al Panel
            </button>
          </form>
          <button
            onClick={onClose}
            className="mt-4 text-xs text-slate-500 hover:text-black inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Volver a la galería pública
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-lg text-black">
            <FolderKanban className="w-5 h-5 text-[#0284C7]" />
            <span>ADMIN • {STUDIO_CONFIG.name}</span>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-semibold bg-black hover:bg-slate-800 text-white px-4 py-2 rounded-xl flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Ver Página Principal
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs h-fit">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
              {editingEventId ? (
                <>
                  <Pencil className="w-5 h-5 text-amber-500" /> Editando Evento
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 text-[#0284C7]" /> Crear Nuevo Evento
                </>
              )}
            </h2>

            {editingEventId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-semibold text-slate-500 hover:text-black flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-lg"
              >
                <X className="w-3.5 h-3.5" /> Cancelar edición
              </button>
            )}
          </div>

          <form onSubmit={handleSaveEvent} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre del Evento *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Boda Camila & Mateo / Campeonato Motovelocidad"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0284C7]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sección Principal *
                </label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#0284C7]"
                >
                  {CATEGORY_STRUCTURE.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {availableSubcategories.length > 0 ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subsección de {category} *
                  </label>
                  <select
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#0284C7]"
                  >
                    {availableSubcategories.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    PIN de Acceso para el Cliente *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Ej. 4589"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0284C7]"
                    />
                  </div>
                </div>
              )}
            </div>

            {availableSubcategories.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  PIN de Acceso para el Cliente *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Ej. 4589"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0284C7]"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fecha del Evento
                </label>
                <input
                  type="text"
                  placeholder="Ej. 22 de noviembre de 2026"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ubicación
                </label>
                <input
                  type="text"
                  placeholder="Ej. Tocancipá / Bogotá"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0284C7]"
                />
              </div>
            </div>

            {/* Configuración del Paquete (Acepta 0 para venta individual) */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Fotos incluidas (0 = venta individual) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={includedPhotos}
                  onChange={(e) => setIncludedPhotos(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Valor por foto (COP) *
                </label>
                <input
                  type="number"
                  step="500"
                  min="0"
                  required
                  value={extraPhotoPrice}
                  onChange={(e) => setExtraPhotoPrice(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#0284C7]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">
              <div>
                <p className="text-xs font-bold text-slate-800">Estado en la página principal</p>
                <p className="text-[11px] text-slate-500">
                  {isActive
                    ? 'Visible para que los clientes ingresen con su PIN'
                    : 'Oculto temporalmente de la galería pública'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-300 text-slate-700'
                }`}
              >
                {isActive ? 'Habilitado' : 'Inhabilitado'}
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <ImagePlus className="w-4 h-4 text-[#0284C7]" />
                URLs de las fotos del evento (una por línea) *
              </label>
              <textarea
                rows="4"
                required
                placeholder={`https://res.cloudinary.com/.../foto1.jpg\nhttps://res.cloudinary.com/.../foto2.jpg`}
                value={photoUrlsText}
                onChange={(e) => setPhotoUrlsText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:border-[#0284C7]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Foto de Portada (URL o elige una miniatura abajo)
              </label>
              <input
                type="text"
                placeholder="https://... (si se deja vacío usa la primera foto)"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#0284C7]"
              />

              {parsedPreviewUrls.length > 0 && (
                <div className="mt-2.5">
                  <p className="text-[11px] text-slate-500 mb-1.5">
                    Toca una foto para asignarla como portada del evento:
                  </p>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {parsedPreviewUrls.slice(0, 12).map((url, i) => {
                      const isCurrentCover =
                        coverImage === url || (!coverImage && i === 0);
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setCoverImage(url)}
                          className={`relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition ${
                            isCurrentCover
                              ? 'border-[#0284C7] scale-105 shadow-xs'
                              : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={url}
                            alt={`Miniatura ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {isCurrentCover && (
                            <span className="absolute bottom-0.5 right-0.5 bg-[#0284C7] text-white rounded-full p-0.5">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className={`w-full py-3.5 rounded-xl text-white font-bold transition shadow-sm ${
                editingEventId
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-[#0284C7] hover:bg-[#0369A1]'
              }`}
            >
              {editingEventId ? 'Guardar Cambios del Evento' : 'Publicar Evento'}
            </button>
          </form>
        </div>

        {/* Lista de Eventos Administrables */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="font-bold text-lg text-slate-900">
            Eventos Registrados ({events.length})
          </h2>

          {events.map((ev) => {
            const activeStatus = ev.isActive !== false;
            return (
              <div
                key={ev.id}
                className={`bg-white rounded-2xl p-4 border transition flex gap-3.5 ${
                  activeStatus
                    ? 'border-slate-200'
                    : 'border-slate-200 bg-slate-100/70 opacity-75'
                }`}
              >
                <img
                  src={ev.coverImage}
                  alt={ev.title}
                  className="w-16 h-20 rounded-xl object-cover bg-slate-200 shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-50 text-[#0284C7]">
                      {ev.category} {ev.subcategory ? `• ${ev.subcategory}` : ''}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        activeStatus
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {activeStatus ? 'Activo' : 'Inhabilitado'}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 truncate mt-1">
                    {ev.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    PIN: <span className="font-mono font-bold text-black">{ev.pin}</span> •{' '}
                    {ev.photos.length} fotos
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {ev.includedPhotos === 0 ? (
                      <>
                        Modalidad: <strong>Individual</strong> ({formatCOP(ev.extraPhotoPrice)} c/u)
                      </>
                    ) : (
                      <>
                        Paquete: <strong>{ev.includedPhotos}</strong> fotos | Extra:{' '}
                        <strong>{formatCOP(ev.extraPhotoPrice)}</strong>
                      </>
                    )}
                  </p>

                  <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleEditClick(ev)}
                      className="text-xs font-semibold text-slate-700 hover:text-[#0284C7] flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-sky-50 transition"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </button>

                    <button
                      onClick={() => handleToggleActive(ev)}
                      className="text-xs font-semibold text-slate-700 hover:text-amber-600 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-amber-50 transition"
                    >
                      {activeStatus ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" /> Inhabilitar
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" /> Habilitar
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(ev.id, ev.title)}
                      className="text-xs font-semibold text-slate-400 hover:text-red-600 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 transition ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}