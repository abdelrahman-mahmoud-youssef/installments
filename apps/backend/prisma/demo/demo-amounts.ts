const PIASTRES_PER_POUND = 100;
const ROUNDING_STEP_IN_PIASTRES = 5_000;

export function egp(pounds: number): number {
  return pounds * PIASTRES_PER_POUND;
}

export function roundToStep(piastres: number): number {
  return Math.round(piastres / ROUNDING_STEP_IN_PIASTRES) * ROUNDING_STEP_IN_PIASTRES;
}
