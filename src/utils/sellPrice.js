export function appendToSellPrice(currentValue, amount) {
  const amountText = String(Math.round(amount));
  const current = String(currentValue ?? '').trim();

  if (!current || current === '0') {
    return amountText;
  }

  return `${current}+${amountText}`;
}
