export function formatCurrency(amount, lng = 'en') {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  const locale = lng === 'gu' ? 'gu-IN' : 'en-IN';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(dateString, lng = 'en') {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const locale = lng === 'gu' ? 'gu-IN' : 'en-IN';
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

export function formatNumber(number, lng = 'en') {
  if (number === null || number === undefined || isNaN(number)) return '0';
  const locale = lng === 'gu' ? 'gu-IN' : 'en-IN';
  return new Intl.NumberFormat(locale).format(number);
}

export function calculateDaysLeft(endDateString) {
  if (!endDateString) return null;
  const end = new Date(endDateString);
  const now = new Date();
  const diffTime = end - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}
