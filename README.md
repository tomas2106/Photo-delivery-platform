# TOMASPH — Plataforma Web de Selección y Entrega Fotográfica

Aplicación web Full-Stack diseñada para estudios de fotografía de eventos y deportes. Permite gestionar galerías privadas protegidas por PIN y eventos públicos de acceso abierto, con protección de muestras mediante marca de agua dinámica, cálculo automático de paquetes y envío de pedidos estructurados vía WhatsApp.

**Demo en producción:** [photo-delivery-platform.vercel.app](https://photo-delivery-platform.vercel.app)

---

## Arquitectura y Stack Tecnológico

* **Frontend:** React + Vite, Tailwind CSS, Lucide Icons (Desplegado en **Vercel**).
* **Backend:** Python, Django REST Framework, Gunicorn, WhiteNoise (Desplegado en **Render**).
* **Base de Datos:** PostgreSQL en la nube (**Neon**).
* **Almacenamiento Multimedia:** Subida directa en lote hacia **Cloudinary** conservando los códigos originales de archivo.

## Características Principales

* **Catálogo Editorial Dinámico:** Filtrado por categorías (*Matrimonios*, *XV Años*, *Deportes*) y subdisciplinas (*Motociclismo*, *Fútbol*), además de búsqueda instantánea por nombre o fecha.
* **Seguridad y Privacidad por Evento:**
  * Galerías privadas con validación de **PIN en el servidor** (las URLs de las fotografías no se exponen en el cliente hasta autenticar el código).
  * Galerías públicas sin PIN para eventos deportivos o masivos.
  * Marca de agua dinámica sobre las muestras y bloqueo de clic derecho.
* **Motor de Paquetes y Carrito:** Soporte tanto para eventos con límite de fotos incluidas y cobro automático de adicionales, como para venta individual por fotografía.
* **Panel de Administración:** Gestión CRUD completa de eventos, control de visibilidad (habilitar/inhabilitar), selección de portada y carga masiva directa a Cloudinary.

## Estructura del Monorepo

```text
photo-delivery-platform/
├── backend/                # API REST en Django + PostgreSQL
│   ├── config/             # Configuración principal, CORS y variables de entorno
│   ├── events/             # Modelos Event/Photo, serializadores y endpoints de seguridad
│   ├── build.sh            # Script de compilación y migraciones para Render
│   └── requirements.txt
└── frontend/               # SPA en React + Vite
    └── src/
        ├── components/     # AdminPanel, PhotoCard, LightboxModal, CheckoutDrawer
        ├── services/       # Cliente HTTP conectado a la API REST
        └── utils/          # Formateo de moneda (COP) y fechas
