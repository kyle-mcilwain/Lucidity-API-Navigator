# Lucidity API Navigator

A local web app for browsing and executing requests against **Ideagen EHS Core's** (formerly Lucidity) public API — or any OpenAPI / Swagger spec.

- Three-pane browser UI: endpoint list / request builder / response viewer
- Loads OpenAPI 3.x or Swagger 2.0 specs by URL or file upload
- Server-side proxy avoids browser CORS when calling the real API
- Credentials (API user, API key, tenant URL, spec URL) read from `credentials.json` and auto-applied

## Install

Requires Node.js 18 or newer.

```bash
npm install
```

## Run

```bash
npm start
```

Open <http://localhost:3010>. The spec auto-loads on startup using the URL in `credentials.json`.

## What's pre-configured

`credentials.json` at the repo root holds four fields. On startup the app reads them and:

| Field | Used for |
| --- | --- |
| `user` | Sent as `X-API-User` header on every request |
| `apiKey` | Sent as `Authorization: Bearer <apiKey>` on every request |
| `tenantBaseUrl` | Default base URL for every endpoint call (e.g. `https://mcilwain.luciditysoftware.com.au`) |
| `specUrl` | Auto-loaded on startup (the SwaggerHub JSON URL) |

A per-user file at `~/.lucidity-navigator/credentials.json` (mode `0600`, gitignored) takes precedence over the committed file, so you can override locally without changing the repo. Use the **Save locally** button in the Auth panel to write it.

## Loading the spec

Auto-loaded from the URL in `credentials.json`. To switch:

- Paste a different OpenAPI/Swagger URL into the top bar and click **Load URL**.
- Or **Upload spec** for a local `.json` / `.yaml` file.

**If SwaggerHub returns 403** to the server-side fetch: open the SwaggerHub page in your browser → **Export → Download API → JSON (resolved)** → click **Upload spec** in the app. Swagger 2.0 specs are converted to OpenAPI 3.0 internally.

## Adjusting auth if the API returns 401/403

The current auth assumption is `Authorization: Bearer <iecp_...>` + `X-API-User: <username>`. If Ideagen's spec actually expects a different layout, you have three quick adjustments:

1. **Different Bearer prefix** — clear the API key field; add a custom `Authorization` row under **Extra headers** with the exact value Ideagen wants (e.g. `ApiKey iecp_...`).
2. **Basic auth (user + key)** — clear both fields; add an `Authorization` extra header with value `Basic <base64(user:key)>`. Generate the base64 string with `printf 'kyle.mitchell:iecp_xxx' | base64`.
3. **Custom header name for the key** — clear the API key field; add an extra header like `X-API-Key: iecp_xxx`.

Every "Extra header" you add is sent on every request — they're the universal escape hatch.

## Make a request

1. Click an endpoint in the sidebar (filter at the top to search).
2. Fill the path / query / header parameters and (if applicable) the JSON body.
3. Click **Send**.
4. Response pane shows status, headers, and body — pretty JSON tree by default, Raw tab for plain text.

## Security

- Server binds to `127.0.0.1` only — no other machine on the LAN can reach it.
- `~/.lucidity-navigator/credentials.json` is written with mode `0600` and is gitignored.
- `credentials.json` at the repo root **is committed**; the API key currently lives in git history. Rotate it after use if the repo is shared.

## Smoke-test without the real spec

- OpenAPI 3.0: `https://petstore3.swagger.io/api/v3/openapi.json`
- Swagger 2.0: `https://petstore.swagger.io/v2/swagger.json` (exercises the 2.0 → 3.0 conversion)
- Round-trip a request: hit `https://httpbin.org/anything` and verify the query/headers/body echo back.

## Layout

```
package.json
credentials.json        repo-level default credentials (committed)
server/
  index.js              Express bootstrap
  routes/               /api/health, /api/spec, /api/execute, /api/credentials
  lib/                  spec parser, request proxy, credentials store
public/
  index.html
  styles.css
  js/                   vanilla ES modules, no build step
```
