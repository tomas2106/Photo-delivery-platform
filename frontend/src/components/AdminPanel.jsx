import { useState } from 'react';
import { Plus, Trash2, Lock, ArrowLeft, ImagePlus, KeyRound, FolderKanban } from 'lucide-react';
import { CATEGORY_STRUCTURE, STUDIO_CONFIG } from '../data/eventsData';
import { createEvent, deleteEvent } from '../services/eventService';
import { formatCOP } from '../utils/formatters';

export default function AdminPanel({ events, onEventsUpdated, onClose }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORY_STRUCTURE[0].name);
  const [subcategory, setSubcategory] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [pin, setPin] = useState('');
  const [includedPhotos, setIncludedPhotos] = useState(40);
  const [extraPhotoPrice, setExtraPhotoPrice] = useState(2000);
  const [coverImage, setCoverImage] = useState('');
  const [photoUrlsText, setPhotoUrlsText] = useState('');

  const selectedCatObj = CATEGORY_STRUCTURE.find((c) => c.name === category);
  const availableSubcategories = selectedCatObj ? selectedCatObj.subcategories : [];

  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    const found = CATEGORY_STRUCTURE.find((c) => c.name === newCat);
    if (found && found.subcategories.length > 0) {
      setSubcategory(found.subcategories[0]);
    } else {
      setSubcategory('');
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

  const handleCreateEvent = async (e) => {
    e.preventDefault();

    const urls = photoUrlsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const formattedPhotos = urls.map((url, idx) => {
      const codeNum = String(idx + 1).padStart(3, '0');
      return {
        id: `photo-${Date.now()}-${idx}`,
        code: `TOMASPH_${codeNum}`,
        url,
      };
    });

    const newEvent = {
      id: `evt-${Date.now()}`,
      title: title.trim(),
      category,
      subcategory: availableSubcategories.length > 0 ? subcategory : '',
      date: date.trim() || 'Fecha por confirmar',
      location: location.trim() || 'Colombia',
      pin: pin.trim(),
      includedPhotos: Number(includedPhotos) || 40,
      extraPhotoPrice: Number(extraPhotoPrice) || 2000,
      watermarkText: STUDIO_CONFIG.watermark,
      coverImage:
        coverImage.trim() ||
        (formattedPhotos[0] ? formattedPhotos[0].url : '/demo/foto1.jpg'),
      photos: formattedPhotos,
    };

    await createEvent(newEvent);
    onEventsUpdated();

    setTitle('');
    setDate('');
    setLocation('');
    setPin('');
    setCoverImage('');
    setPhotoUrlsText('');
    alert('Evento creado correctamente');
  };

  const handleDelete = async (id, eventTitle) => {
    if (window.confirm(`¿Seguro que deseas eliminar "${eventTitle}"?`)) {
      await deleteEvent(id);
      onEventsUpdated();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-sm rounded-2xl p-6 border border-slate-200 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center mx-auto mb-4">
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
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-lg text-black">
            <FolderKanban className="w-5 h-5 text-[#0284C7]" />
            <span>ADMIN • {STUDIO_CONFIG.name}</span>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Salir del Admin
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2 mb-4">
            <Plus className="w-5 h-5 text-[#0284C7]" /> Crear Nuevo Evento
          </h2>

          <form onSubmit={handleCreateEvent} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre del Evento *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Campeonato Motovelocidad / Boda Camila & Mateo"
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fotos incluidas en paquete
                </label>
                <input
                  type="number"
                  min="1"
                  value={includedPhotos}
                  onChange={(e) => setIncludedPhotos(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Valor foto adicional (COP)
                </label>
                <input
                  type="number"
                  step="500"
                  value={extraPhotoPrice}
                  onChange={(e) => setExtraPhotoPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0284C7]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                URL Imagen de Portada (opcional)
              </label>
              <input
                type="text"
                placeholder="https://... (si se deja vacío usa la primera foto)"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0284C7]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <ImagePlus className="w-4 h-4 text-[#0284C7]" />
                URLs de las fotos (una URL por línea) *
              </label>
              <textarea
                rows="5"
                required
                placeholder={`https://res.cloudinary.com/.../foto1.jpg\nhttps://res.cloudinary.com/.../foto2.jpg`}
                value={photoUrlsText}
                onChange={(e) => setPhotoUrlsText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:border-[#0284C7]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold transition shadow-sm"
            >
              Publicar Evento
            </button>
          </form>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <h2 className="font-bold text-lg text-slate-900">
            Eventos Publicados ({events.length})
          </h2>

          {events.map((ev) => (
            <div
              key={ev.id}
              className="bg-white rounded-2xl p-4 border border-slate-200 flex items-start justify-between gap-3"
            >
              <div className="space-y-1">
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sky-50 text-[#0284C7]">
                  {ev.category} {ev.subcategory ? `• ${ev.subcategory}` : ''}
                </span>
                <h3 className="font-bold text-sm text-slate-900">{ev.title}</h3>
                <p className="text-xs text-slate-500">
                  PIN: <span className="font-mono font-bold text-black">{ev.pin}</span> •{' '}
                  {ev.photos.length} fotos
                </p>
                <p className="text-[11px] text-slate-400">
                  Paquete: {ev.includedPhotos} fotos | Extra: {formatCOP(ev.extraPhotoPrice)}
                </p>
              </div>

              <button
                onClick={() => handleDelete(ev.id, ev.title)}
                title="Eliminar evento"
                className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}