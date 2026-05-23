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

## Authentication flow

Lucidity uses a token-exchange (per [the API docs](https://app.swaggerhub.com/apis/luciditysoftware/lucidity-public-api/1.0.20)):

1. POST `{username, token}` to `<tenantBaseUrl>/authenticate`
2. The response contains an `access_token` (JWT) and `expires_in_seconds` (currently `604800` — 7 days)
3. Every subsequent call must include the JWT as the **`api-key`** HTTP header (not `Authorization: Bearer`)

What the app does on startup:

1. Reads `credentials.json` → fills `apiUser`, `apiKey`, `tenantBaseUrl`, `specUrl` in the UI.
2. POSTs the credentials to `<tenantBaseUrl>/authenticate` via the proxy at `/api/auth/login`.
3. Extracts the JWT from `access_token` in the response.
4. Stores the JWT and attaches it as `api-key: <jwt>` on every endpoint call.
5. Auto-loads the OpenAPI spec.

The auth status line in the Auth panel shows the current state. The **Authenticate** button re-runs the flow on demand.

### Automatic re-auth on 401

If a request returns 401, the app re-runs `/authenticate` and retries the original call once. Stale/expired JWTs are handled transparently.

### Rate limit

Lucidity enforces 60 calls per rolling 60-second window per instance. The navigator does not throttle — be mindful when sending many requests.

### If the response shape is unexpected

If `/authenticate` returns 200 but the app says "no recognisable token field", inspect the body shown in the auth-status line. Add the field name to `extractToken()` in `public/js/authFlow.js`, or paste the JWT into the API key field directly to skip the exchange.

### Override paths

- **Custom header name** — add a custom `api-key` (or other) row under **Extra headers** to override.
- **No `/authenticate` endpoint** — clear the API key field; paste a value into an `api-key` extra header.

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
