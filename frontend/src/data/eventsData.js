export const STUDIO_CONFIG = {
  name: "TOMASPH",
  watermark: "tomasph_photos",
  whatsapp: "573226007190",
  whatsappDisplay: "+57 322 600 7190",
  email: "tomaspradoph@gmail.com",
  instagram: "tomaas.621",
  instagramUrl: "https://instagram.com/tomaas.621",
  adminPin: "admin2026", // Clave para entrar al panel de administración
};

export const EVENT_CATEGORIES = [
  "Matrimonios",
  "Motociclismo",
  "Fútbol",
  "XV Años",
];

export const INITIAL_EVENTS_DATA = [
  {
    id: "boda-prueba-2026",
    title: "Boda Civil y Recepción - Prueba Local",
    category: "Matrimonios",
    date: "16 de noviembre de 2026",
    location: "Cundinamarca, Colombia",
    pin: "2026",
    includedPhotos: 3, // En producción pon 40; en 3 para probar cobro extra con 5 fotos
    extraPhotoPrice: 2000,
    watermarkText: "tomasph_photos",
    coverImage: "/demo/foto1.jpg",
    photos: [
      { id: "p-1", code: "TOMASPH_001", url: "/demo/foto1.jpg" },
      { id: "p-2", code: "TOMASPH_002", url: "/demo/foto2.jpg" },
      { id: "p-3", code: "TOMASPH_003", url: "/demo/foto3.jpg" },
      { id: "p-4", code: "TOMASPH_004", url: "/demo/foto4.jpg" },
      { id: "p-5", code: "TOMASPH_005", url: "/demo/foto5.jpg" },
    ],
  },
];