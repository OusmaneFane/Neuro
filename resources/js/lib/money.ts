/** Format amounts in FCFA (XOF) for Afrique. */
export function formatMoney(amount: number | string | null | undefined, suffix = 'F CFA'): string {
  const n = Number(amount ?? 0);
  const formatted = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.round(n));
  return `${formatted} ${suffix}`;
}
