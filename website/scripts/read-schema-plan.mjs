import { execFileSync } from "node:child_process";

export function readSchemaPlan(run = execFileSync, report = console.error) {
  let stdout = "";
  try {
    stdout = run("drizzle-kit", ["push", "--explain", "--output=json"], {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return JSON.parse(stdout);
  } catch (error) {
    report(
      "Production push blocked: Drizzle dry run failed; refusing to push without an inspected plan.",
    );
    const output = error.stdout?.toString() || stdout;
    const stderr = error.stderr?.toString();
    if (output) report("Drizzle stdout (plan or partial output):\n" + output);
    if (stderr) report("Drizzle stderr:\n" + stderr);
    throw new Error("Review db:plan against the intended database before retrying the build.", {
      cause: error,
    });
  }
}
