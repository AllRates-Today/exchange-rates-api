import { test } from "node:test";
import assert from "node:assert/strict";
import { rate, convert, AllRatesTodayError } from "../dist/index.mjs";

// Unit-level checks that don't require network.
test("rate() rejects non-ISO codes", async () => {
  await assert.rejects(
    () => rate("USD", "123", { apiKey: "test" }),
    (err) => err instanceof AllRatesTodayError && /ISO 4217/.test(err.message)
  );
});

test("rate() requires an API key", async () => {
  const prev = process.env.ALLRATESTODAY_API_KEY;
  delete process.env.ALLRATESTODAY_API_KEY;
  try {
    await assert.rejects(
      () => rate("USD", "EUR"),
      (err) => err instanceof AllRatesTodayError && /Missing API key/.test(err.message)
    );
  } finally {
    if (prev !== undefined) process.env.ALLRATESTODAY_API_KEY = prev;
  }
});

test("convert() rejects non-finite amount", async () => {
  await assert.rejects(
    () => convert(NaN, "USD", "EUR", { apiKey: "test" }),
    (err) => err instanceof AllRatesTodayError && /amount must be/.test(err.message)
  );
});

test("rate() normalizes currency codes to uppercase", async () => {
  let capturedUrl = "";
  const fakeFetch = async (url) => {
    capturedUrl = String(url);
    return new Response(JSON.stringify({ rate: 1.23, source: "refinitiv" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
  const r = await rate("usd", " eur ", { apiKey: "test", fetch: fakeFetch });
  assert.equal(r.base, "USD");
  assert.equal(r.target, "EUR");
  assert.equal(r.rate, 1.23);
  assert.match(capturedUrl, /source=USD&target=EUR/);
});
