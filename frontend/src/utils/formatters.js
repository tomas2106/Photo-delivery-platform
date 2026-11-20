export const formatCOP = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value || 0);
};

export const parseEventDateBadge = (dateStr) => {
  if (!dateStr) return { day: 'EV', month: 'GALERÍA', year: '' };

  const clean = dateStr.trim();
  const match = clean.match(/(\d{1,2})\s*(?:de\s+)?([a-zA-ZáéíóúÁÉÍÓÚ]+)(?:\s*(?:de\s+)?(\d{4}))?/i);

  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].slice(0, 3).toUpperCase();
    const year = match[3] || '';
    return { day, month, year };
  }

  return { day: '••', month: clean.slice(0, 10).toUpperCase(), year: '' };
};

export const calculateOrderPricing = (event, totalSelectedCount) => {
  const includedLimit = event.includedPhotos || 0;
  const extraPrice = event.extraPhotoPrice || 0;
  const isPayPerPhoto = includedLimit === 0;

  // Cantidad de fotos que realmente tienen costo (todas si es individual, o solo las extras si hay paquete)
  const billableCount = isPayPerPhoto
    ? totalSelectedCount
    : Math.max(0, totalSelectedCount - includedLimit);

  const subtotal = billableCount * extraPrice;

  const discountEnabled = Boolean(event.volumeDiscountEnabled);
  const minPhotos = event.volumeDiscountMinPhotos || 0;
  const discountPercent = event.volumeDiscountPercent || 0;

  // El descuento evalúa las fotos cobrables/adicionales (billableCount), no las gratuitas del paquete
  const qualifiesForDiscount =
    discountEnabled &&
    minPhotos > 0 &&
    discountPercent > 0 &&
    billableCount >= minPhotos &&
    subtotal > 0;

  const discountAmount = qualifiesForDiscount
    ? Math.round((subtotal * discountPercent) / 100)
    : 0;

  const finalTotal = Math.max(0, subtotal - discountAmount);

  // Precio unitario real con el descuento aplicado (para mostrar en miniaturas y visor)
  const effectiveExtraPrice = qualifiesForDiscount
    ? Math.round(extraPrice * (1 - discountPercent / 100))
    : extraPrice;

  const photosNeededForDiscount =
    discountEnabled && minPhotos > billableCount
      ? minPhotos - billableCount
      : 0;

  return {
    isPayPerPhoto,
    billableCount,
    subtotal,
    discountEnabled,
    minPhotos,
    discountPercent,
    qualifiesForDiscount,
    discountAmount,
    finalTotal,
    effectiveExtraPrice,
    photosNeededForDiscount,
  };
};

export const buildWhatsAppUrl = ({
  phone,
  eventTitle,
  clientName,
  selectedPhotos,
  event,
}) => {
  const cleanPhone = String(phone || '').replace(/\D/g, '');
  const totalSelected = selectedPhotos.length;
  const includedLimit = event.includedPhotos || 0;
  const pricing = calculateOrderPricing(event, totalSelected);

  const lines = [
    `Hola! Soy *${clientName}*.`,
    `Esta es mi selección de fotos del evento *${eventTitle}*:`,
    '',
    `• Total seleccionadas: *${totalSelected}*`,
  ];

  if (!pricing.isPayPerPhoto) {
    const includedUsed = Math.min(totalSelected, includedLimit);
    lines.push(`• Incluidas en paquete: *${includedUsed} / ${includedLimit}*`);
    lines.push(`• Fotos adicionales: *${pricing.billableCount}*`);
  }

  if (pricing.qualifiesForDiscount) {
    lines.push(`• Subtotal: ${formatCOP(pricing.subtotal)}`);
    lines.push(
      `• Descuento por volumen (${pricing.discountPercent}%): *-${formatCOP(pricing.discountAmount)}*`
    );
  }

  lines.push(`• *Total a pagar: ${formatCOP(pricing.finalTotal)}*`);
  lines.push('');
  lines.push('*Códigos de las fotos elegidas:*');

  selectedPhotos.forEach((p, idx) => {
    const isExtra = pricing.isPayPerPhoto || idx >= includedLimit;
    lines.push(`${idx + 1}. ${p.code}${isExtra ? ' ($)' : ''}`);
  });

  const rawMessage = lines.join('\n');
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(rawMessage)}`;

  return { url, rawMessage, pricing };
};