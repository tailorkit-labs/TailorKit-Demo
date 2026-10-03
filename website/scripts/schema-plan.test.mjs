import assert from "node:assert/strict";
import test from "node:test";
import { isCompatiblePlan } from "./schema-plan.mjs";

const plan = (...statements) => ({ status: "ok", statements, hints: [] });

test("initial schema and its new-table constraints are allowed", () => {
  assert.equal(
    isCompatiblePlan(
      plan(
        { type: "create_table", table: { schema: "public", name: "child" } },
        { type: "create_fk", fk: { schema: "public", table: "child" } },
        { type: "create_index", index: { schema: "public", table: "child", isUnique: true } },
      ),
    ),
    true,
  );
});

test("nullable columns and nonunique indexes preserve existing writes", () => {
  assert.equal(
    isCompatiblePlan(
      plan(
        { type: "add_column", column: { notNull: false } },
        { type: "create_index", index: { isUnique: false } },
      ),
    ),
    true,
  );
  assert.equal(isCompatiblePlan({ status: "no_changes" }), true);
});

test("potentially incompatible changes and unknown operations are rejected", () => {
  for (const statement of [
    { type: "alter_column", diff: { type: { from: "numeric", to: "integer" } } },
    { type: "drop_column" },
    { type: "drop_table" },
    { type: "rename_column" },
    { type: "future_operation" },
    { type: "add_column", column: { notNull: true, default: "'value'" } },
    { type: "add_column", column: { notNull: false }, isPK: true },
    { type: "create_fk", fk: { schema: "public", table: "existing" } },
    { type: "create_index", index: { isUnique: true } },
  ]) {
    assert.equal(isCompatiblePlan(plan(statement)), false, statement.type);
  }
});

test("warnings, missing confirmations, and malformed plans fail closed", () => {
  assert.equal(isCompatiblePlan({ ...plan(), hints: [{ hint: "data loss" }] }), false);
  assert.equal(isCompatiblePlan({ status: "missing_hints" }), false);
  assert.equal(isCompatiblePlan({ status: "ok" }), false);
  assert.equal(isCompatiblePlan(null), false);
});
