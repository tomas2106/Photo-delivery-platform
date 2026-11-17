export const formatCOP = (amount) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const parseEventDateBadge = (dateString) => {
  if (!dateString) return { day: '--', month: 'EVT', year: '2026' };

  const monthsMap = {
    enero: 'ENE',
    febrero: 'FEB',
    marzo: 'MAR',
    abril: 'ABR',
    mayo: 'MAY',
    junio: 'JUN',
    julio: 'JUL',
    agosto: 'AGO',
    septiembre: 'SEP',
    setiembre: 'SEP',
    octubre: 'OCT',
    noviembre: 'NOV',
    diciembre: 'DIC',
  };

  const lower = dateString.toLowerCase();

  // Detectar formato YYYY-MM-DD
  const isoMatch = lower.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const monthNames = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    const monthIdx = Math.max(0, Math.min(11, parseInt(isoMatch[2], 10) - 1));
    return {
      day: isoMatch[3],
      month: monthNames[monthIdx],
      year: isoMatch[1],
    };
  }

  // Detectar formato en español: "16 de noviembre de 2026" o "08 nov 2026"
  const dayMatch = lower.match(/\b(\d{1,2})\b/);
  const yearMatch = lower.match(/\b(20\d{2})\b/);

  let detectedMonth = 'EVT';
  for (const [full, abbr] of Object.entries(monthsMap)) {
    if (lower.includes(full) || lower.includes(abbr.toLowerCase())) {
      detectedMonth = abbr;
      break;
    }
  }

  return {
    day: dayMatch ? dayMatch[1].padStart(2, '0') : '--',
    month: detectedMonth,
    year: yearMatch ? yearMatch[1] : String(new Date().getFullYear()),
  };
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

  const message = `Hola TOMASPH, ya realice mi seleccion de fotos.

*Evento:* ${eventTitle}
*Cliente:* ${clientName}
*Total seleccionadas:* ${totalSelected} fotos
*Incluidas en paquete:* ${Math.min(totalSelected, includedLimit)}
*Fotos adicionales:* ${extraCount} (${formatCOP(extraPrice)} c/u)
*Total adicional a pagar:* ${formatCOP(totalAmount)}

*Codigos seleccionados:*
${codes}`;

  return {
    url: `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
    rawMessage: message,
  };
};