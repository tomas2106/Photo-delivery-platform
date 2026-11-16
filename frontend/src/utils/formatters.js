export const formatCOP = (amount) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const buildWhatsAppUrl = ({
  phone,
  eventTitle,
  clientName,
  selectedPhotos,
  includedLimit,
  extraPrice,
}) => {
  const totalSelected = selectedPhotos.length;
  const extraCount = Math.max(0, totalSelected - includedLimit);
  const totalAmount = extraCount * extraPrice;
  const codes = selectedPhotos.map((p) => p.code).join(', ');

  const message = `Hola! 👋 Ya realicé mi selección de fotos.

📸 *Evento:* ${eventTitle}
👤 *Cliente:* ${clientName}
🖼️ *Total seleccionadas:* ${totalSelected} fotos
✅ *Incluidas en paquete:* ${Math.min(totalSelected, includedLimit)}
➕ *Fotos adicionales:* ${extraCount} (${formatCOP(extraPrice)} c/u)
💰 *Total adicional a pagar:* ${formatCOP(totalAmount)}

📋 *Códigos seleccionados:*
${codes}`;

  return {
    url: `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
    rawMessage: message,
  };
};