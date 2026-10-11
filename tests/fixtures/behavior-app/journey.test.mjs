import assert from "node:assert/strict";
import test from "node:test";
import { lookup } from "./invoice.mjs";

test("請求書を所有者が取得し、別利用者は取得できない", () => {
  const invoices = [{ id: "invoice-1", owner: "alice", amount: 1000 }];
  assert.equal(lookup(invoices, "invoice-1", "alice"), invoices[0]);
  assert.equal(lookup(invoices, "invoice-1", "bob"), undefined);
});
