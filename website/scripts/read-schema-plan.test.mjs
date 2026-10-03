import assert from "node:assert/strict";
import test from "node:test";
import { readSchemaPlan } from "./read-schema-plan.mjs";

await test("failed dry runs preserve the missing-hints plan and stderr", () => {
  const logs = [];
  const failure = Object.assign(new Error("Command failed"), {
    status: 2,
    stdout: '{"status":"missing_hints","hints":["confirm drop"]}',
    stderr: "Confirmation required",
  });
  assert.throws(
    () =>
      readSchemaPlan(
        () => {
          throw failure;
        },
        (line) => logs.push(line),
      ),
    (error) => error.cause === failure && error.message.includes("Review db:plan"),
  );
  assert.match(logs.join("\n"), /Production push blocked/);
  assert.match(logs.join("\n"), /missing_hints/);
  assert.match(logs.join("\n"), /Confirmation required/);
});

await test("non-JSON progress output is reported and never accepted as a plan", () => {
  const logs = [];
  assert.throws(
    () =>
      readSchemaPlan(
        () => 'Progress...\n{"status":"no_changes"}',
        (line) => logs.push(line),
      ),
    /Review db:plan/,
  );
  assert.match(logs.join("\n"), /Progress/);
  assert.match(logs.join("\n"), /no_changes/);
});

await test("valid dry run is parsed without error reporting", () => {
  assert.deepEqual(
    readSchemaPlan(
      () => '{"status":"no_changes"}',
      () => assert.fail("unexpected error"),
    ),
    { status: "no_changes" },
  );
});
