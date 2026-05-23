const METHODS_WITHOUT_BODY = new Set(['GET', 'HEAD']);

function buildUrl(rawUrl, query) {
  const url = new URL(rawUrl);
  if (query && typeof query === 'object') {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === '') continue;
      if (Array.isArray(v)) {
        for (const item of v) url.searchParams.append(k, String(item));
      } else {
        url.searchParams.append(k, String(v));
      }
    }
  }
  return url.toString();
}

function normaliseHeaders(headers) {
  const out = {};
  if (!headers) return out;
  for (const [k, v] of Object.entries(headers)) {
    if (v === undefined || v === null || v === '') continue;
    out[k] = String(v);
  }
  return out;
}

export async function proxyRequest({ method, url, headers, query, body }) {
  const finalMethod = method.toUpperCase();
  const finalUrl = buildUrl(url, query);
  const finalHeaders = normaliseHeaders(headers);

  let payload;
  if (!METHODS_WITHOUT_BODY.has(finalMethod) && body !== undefined && body !== null && body !== '') {
    if (typeof body === 'string') {
      payload = body;
    } else {
      payload = JSON.stringify(body);
      if (!Object.keys(finalHeaders).some((h) => h.toLowerCase() === 'content-type')) {
        finalHeaders['Content-Type'] = 'application/json';
      }
    }
  }

  const started = performance.now();
  let res;
  try {
    res = await fetch(finalUrl, {
      method: finalMethod,
      headers: finalHeaders,
      body: payload,
      redirect: 'follow',
    });
  } catch (err) {
    const durationMs = Math.round(performance.now() - started);
    return {
      networkError: true,
      error: err.message,
      durationMs,
      requestUrl: finalUrl,
      requestMethod: finalMethod,
    };
  }
  const durationMs = Math.round(performance.now() - started);

  const responseHeaders = {};
  res.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  const text = await res.text();
  let parsedBody = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('json') || (text && (text.trim().startsWith('{') || text.trim().startsWith('[')))) {
    try {
      parsedBody = JSON.parse(text);
    } catch {
      parsedBody = null;
    }
  }

  return {
    status: res.status,
    statusText: res.statusText,
    headers: responseHeaders,
    body: text,
    parsedBody,
    durationMs,
    requestUrl: finalUrl,
    requestMethod: finalMethod,
  };
}
