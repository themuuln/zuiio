/**
 * Calculate commission amount for a sale item.
 * Commission is 10% of total_price, rounded to 2 decimal places.
 * Returns 0 for cancelled sales or zero-price items.
 */
export function calculateCommission(totalPrice: number): number {
  if (totalPrice <= 0) return 0;
  return Math.round(totalPrice * 0.1 * 100) / 100;
}
