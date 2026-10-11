// 検証用の架空アプリ。refactor-cleanには成功する基準状態を渡す。
export function total(amount, discount, tax) {
  return (amount - discount) * (1 + tax);
}

export function lookup(invoices, id, viewer) {
  if (typeof viewer !== "string" || !viewer) return undefined;
  return invoices.find((invoice) => invoice.id === id && invoice.owner === viewer);
}

export function label(invoice) {
  return `${invoice.id}: ${invoice.amount}`;
}

export function summary(invoice) {
  return `${invoice.id}: ${invoice.amount}`;
}
