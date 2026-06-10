export function appendToSellPrice(currentValue, amount) {
  const amountText = String(Math.round(amount));
  const current = String(currentValue ?? '').trim();

  if (!current || current === '0') {
    return amountText;
  }

  return `${current}+${amountText}`;
}

export function appendExpressionToSellPrice(currentValue, expression) {
  const nextExpression = String(expression ?? '').trim();
  const current = String(currentValue ?? '').trim();

  if (!nextExpression) return current;
  if (!current || current === '0') return nextExpression;

  return `${current}+${nextExpression}`;
}
