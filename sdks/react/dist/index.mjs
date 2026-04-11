// src/hooks.ts
import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// src/cache.ts
var GEO_CACHE_KEY = "allratestoday_geo_currency";
var GEO_CACHE_TTL = 24 * 60 * 60 * 1e3;
var RATE_CACHE_TTL = 60 * 60 * 1e3;
var memoryCache = /* @__PURE__ */ new Map();
function getCachedGeo() {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    const raw = localStorage.getItem(GEO_CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() - entry.timestamp < GEO_CACHE_TTL) {
      return entry.data;
    }
    localStorage.removeItem(GEO_CACHE_KEY);
  } catch {
  }
  return null;
}
function setCachedGeo(currency) {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const entry = { data: currency, timestamp: Date.now() };
    localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(entry));
  } catch {
  }
}
function getCachedRate(key) {
  const entry = memoryCache.get(key);
  if (entry && Date.now() - entry.timestamp < RATE_CACHE_TTL) {
    return entry.data;
  }
  if (entry) memoryCache.delete(key);
  return null;
}
function setCachedRate(key, rate) {
  memoryCache.set(key, { data: rate, timestamp: Date.now() });
}

// src/api.ts
var DEFAULT_GEO_ENDPOINT = "https://ipapi.co/json/";
var ALLRATESTODAY_BASE = "https://allratestoday.com";
async function detectCurrency(geoEndpoint) {
  const cached = getCachedGeo();
  if (cached) return cached;
  const url = geoEndpoint || DEFAULT_GEO_ENDPOINT;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Geolocation request failed: HTTP ${response.status}`);
  }
  const data = await response.json();
  if (!data.currency) {
    throw new Error("Geolocation response did not include a currency code");
  }
  const currency = data.currency.toUpperCase();
  setCachedGeo(currency);
  return currency;
}
async function fetchRate(apiKey, from, to) {
  if (!apiKey) {
    throw new Error(
      "API key is missing. Get your free key at allratestoday.com/register"
    );
  }
  const fromUpper = from.toUpperCase();
  const toUpper = to.toUpperCase();
  if (fromUpper === toUpper) return 1;
  const cacheKey = `${fromUpper}_${toUpper}`;
  const cached = getCachedRate(cacheKey);
  if (cached !== null) return cached;
  const url = `${ALLRATESTODAY_BASE}/api/v1/rates?source=${fromUpper}&target=${toUpper}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const msg = body.error || `HTTP ${response.status}`;
    throw new Error(msg);
  }
  const data = await response.json();
  const rateData = Array.isArray(data) ? data[0] : data;
  const rate = rateData?.rate;
  if (typeof rate !== "number") {
    throw new Error("Invalid rate response from AllRatesToday API");
  }
  setCachedRate(cacheKey, rate);
  return rate;
}

// src/hooks.ts
function useCurrencyConverter(options) {
  const {
    basePrice,
    baseCurrency: rawBase,
    apiKey,
    manualCurrency,
    geoEndpoint,
    onSuccess,
    onError
  } = options;
  const baseCurrency = rawBase.toUpperCase();
  const [convertedPrice, setConvertedPrice] = useState(null);
  const [localCurrency, setLocalCurrency] = useState(
    manualCurrency?.toUpperCase() ?? null
  );
  const [exchangeRate, setExchangeRate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;
  useEffect(() => {
    let cancelled = false;
    async function run() {
      setIsLoading(true);
      setError(null);
      try {
        let targetCurrency = manualCurrency?.toUpperCase();
        if (!targetCurrency) {
          targetCurrency = await detectCurrency(geoEndpoint);
        }
        if (cancelled) return;
        setLocalCurrency(targetCurrency);
        const rate = await fetchRate(apiKey, baseCurrency, targetCurrency);
        if (cancelled) return;
        const converted = Number((basePrice * rate).toFixed(2));
        setExchangeRate(rate);
        setConvertedPrice(converted);
        onSuccessRef.current?.({
          convertedPrice: converted,
          localCurrency: targetCurrency,
          exchangeRate: rate
        });
      } catch (err) {
        if (cancelled) return;
        const error2 = err instanceof Error ? err : new Error(String(err));
        setError(error2);
        onErrorRef.current?.(error2);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [basePrice, baseCurrency, apiKey, manualCurrency, geoEndpoint]);
  return {
    convertedPrice,
    localCurrency,
    baseCurrency,
    exchangeRate,
    isLoading,
    error
  };
}
function useCurrencyLocalizer(options) {
  const {
    baseCurrency: rawBase,
    apiKey,
    manualCurrency,
    geoEndpoint,
    onReady,
    onError
  } = options;
  const baseCurrency = rawBase.toUpperCase();
  const [localCurrency, setLocalCurrency] = useState(
    manualCurrency?.toUpperCase() ?? null
  );
  const [exchangeRate, setExchangeRate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  onReadyRef.current = onReady;
  onErrorRef.current = onError;
  useEffect(() => {
    let cancelled = false;
    async function run() {
      setIsLoading(true);
      setError(null);
      try {
        let targetCurrency = manualCurrency?.toUpperCase();
        if (!targetCurrency) {
          targetCurrency = await detectCurrency(geoEndpoint);
        }
        if (cancelled) return;
        setLocalCurrency(targetCurrency);
        const rate = await fetchRate(apiKey, baseCurrency, targetCurrency);
        if (cancelled) return;
        setExchangeRate(rate);
        onReadyRef.current?.();
      } catch (err) {
        if (cancelled) return;
        const error2 = err instanceof Error ? err : new Error(String(err));
        setError(error2);
        onErrorRef.current?.(error2);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [baseCurrency, apiKey, manualCurrency, geoEndpoint]);
  const isReady = exchangeRate !== null && !isLoading;
  const convert = useCallback(
    (price) => {
      if (exchangeRate === null) return null;
      return Number((price * exchangeRate).toFixed(2));
    },
    [exchangeRate]
  );
  const formatter = useMemo(() => {
    if (!localCurrency) return null;
    try {
      return new Intl.NumberFormat(void 0, {
        style: "currency",
        currency: localCurrency
      });
    } catch {
      return null;
    }
  }, [localCurrency]);
  const format = useCallback(
    (price) => {
      if (formatter) return formatter.format(price);
      return `${localCurrency ?? baseCurrency} ${price.toFixed(2)}`;
    },
    [formatter, localCurrency, baseCurrency]
  );
  const convertAndFormat = useCallback(
    (price) => {
      const converted = convert(price);
      if (converted === null) return format(price);
      return format(converted);
    },
    [convert, format]
  );
  return {
    convert,
    format,
    convertAndFormat,
    localCurrency,
    baseCurrency,
    exchangeRate,
    isLoading,
    isReady,
    error
  };
}

// src/components.tsx
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function LocalizedPrice({
  basePrice,
  baseCurrency,
  apiKey,
  manualCurrency,
  geoEndpoint,
  loadingComponent,
  errorComponent,
  formatPrice
}) {
  const { convertedPrice, localCurrency, isLoading, error } = useCurrencyConverter({
    basePrice,
    baseCurrency,
    apiKey,
    manualCurrency,
    geoEndpoint
  });
  if (isLoading) {
    if (loadingComponent) return /* @__PURE__ */ jsx(Fragment, { children: loadingComponent });
    return /* @__PURE__ */ jsx("span", { children: "Loading..." });
  }
  if (error || convertedPrice === null) {
    if (errorComponent && error) {
      return /* @__PURE__ */ jsx(Fragment, { children: errorComponent(error, basePrice, baseCurrency) });
    }
    try {
      const formatted = new Intl.NumberFormat(void 0, {
        style: "currency",
        currency: baseCurrency.toUpperCase()
      }).format(basePrice);
      return /* @__PURE__ */ jsx("span", { children: formatted });
    } catch {
      return /* @__PURE__ */ jsxs("span", { children: [
        baseCurrency.toUpperCase(),
        " ",
        basePrice.toFixed(2)
      ] });
    }
  }
  const currency = localCurrency || baseCurrency.toUpperCase();
  if (formatPrice) {
    return /* @__PURE__ */ jsx("span", { children: formatPrice(convertedPrice, currency) });
  }
  try {
    const formatted = new Intl.NumberFormat(void 0, {
      style: "currency",
      currency
    }).format(convertedPrice);
    return /* @__PURE__ */ jsx("span", { children: formatted });
  } catch {
    return /* @__PURE__ */ jsxs("span", { children: [
      currency,
      " ",
      convertedPrice.toFixed(2)
    ] });
  }
}
export {
  LocalizedPrice,
  useCurrencyConverter,
  useCurrencyLocalizer
};
