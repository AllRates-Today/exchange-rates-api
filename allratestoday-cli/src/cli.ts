#!/usr/bin/env node
/**
 * allratestoday CLI
 *
 * Usage:
 *   allratestoday USD INR
 *   allratestoday USD INR 100           # convert 100 USD to INR
 *   allratestoday --help
 *
 * Requires ALLRATESTODAY_API_KEY env var. Get a free key at
 * https://allratestoday.com/register/
 */
import { rate, convert, AllRatesTodayError } from "./index.js";

const HELP = `allratestoday — real-time mid-market currency rates

Usage:
  allratestoday <BASE> <TARGET> [AMOUNT]

Examples:
  allratestoday USD INR
  allratestoday EUR GBP 250
  allratestoday XAU USD

Options:
  -h, --help      show this help message
  -v, --version   show version

Environment:
  ALLRATESTODAY_API_KEY   your AllRatesToday API key
                          (get one at https://allratestoday.com/register/)

Output:
  JSON on stdout. Non-zero exit code on error.
`;

async function main() {
  const argv = process.argv.slice(2);

  if (argv.length === 0 || argv.includes("-h") || argv.includes("--help")) {
    process.stdout.write(HELP);
    return 0;
  }

  if (argv.includes("-v") || argv.includes("--version")) {
    // Read version lazily to keep the CLI dependency-free.
    try {
      const pkg = require("../package.json");
      process.stdout.write(`${pkg.version}\n`);
    } catch {
      process.stdout.write("unknown\n");
    }
    return 0;
  }

  const [base, target, amountRaw] = argv;
  if (!base || !target) {
    process.stderr.write("Error: BASE and TARGET currency codes are required.\n\n" + HELP);
    return 2;
  }

  try {
    if (amountRaw !== undefined) {
      const amount = Number(amountRaw);
      if (!Number.isFinite(amount)) {
        process.stderr.write(`Error: AMOUNT must be a number (got "${amountRaw}").\n`);
        return 2;
      }
      const result = await convert(amount, base, target);
      process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    } else {
      const result = await rate(base, target);
      process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    }
    return 0;
  } catch (err: any) {
    if (err instanceof AllRatesTodayError) {
      process.stderr.write(`Error: ${err.message}\n`);
      return err.status && err.status >= 400 && err.status < 500 ? 1 : 2;
    }
    process.stderr.write(`Unexpected error: ${err?.message ?? err}\n`);
    return 2;
  }
}

main().then(
  (code) => process.exit(code ?? 0),
  (err) => {
    process.stderr.write(`Fatal: ${err?.message ?? err}\n`);
    process.exit(2);
  }
);
