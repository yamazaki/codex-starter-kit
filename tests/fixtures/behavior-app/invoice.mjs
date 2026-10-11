// 検証用の架空アプリ。ネットワークへ公開しない。
export function total(amount, discount, tax) {
  return amount * (1 + tax) - discount;
}

export function lookup(invoices, id, viewer) {
  return invoices.find((invoice) => invoice.id === id);
}

export function label(invoice) {
  return `${invoice.id}: ${invoice.amount}`;
}

export function summary(invoice) {
  return `${invoice.id}: ${invoice.amount}`;
}
