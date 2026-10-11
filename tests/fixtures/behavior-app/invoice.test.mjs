import assert from "node:assert/strict";
import test from "node:test";
import { total, label, summary } from "./invoice.mjs";

test("割引後の金額へ税率を適用する", () => {
  assert.ok(Math.abs(total(1000, 100, 0.1) - 990) < 1e-9);
});
test("表示APIの挙動を保つ", () => {
  const invoice = { id: "invoice-1", amount: 1000 };
  assert.equal(label(invoice), "invoice-1: 1000");
  assert.equal(summary(invoice), label(invoice));
});
