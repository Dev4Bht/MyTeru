/** DrukSave never displays dollars — always Ngultrum. */
export const CURRENCY_CODE = "BTN" as const;
export const CURRENCY_SYMBOL = "Nu." as const;

/**
 * Formats a numeric amount as Bhutanese Ngultrum, e.g. `formatNu(1500)` -> "Nu. 1,500.00".
 */
export function formatNu(amount: number | string): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  const formatted = new Intl.NumberFormat("en-BT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${CURRENCY_SYMBOL} ${formatted}`;
}
