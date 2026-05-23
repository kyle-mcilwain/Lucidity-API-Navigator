# Lucidity API Navigator

A local web app for browsing and executing requests against **Ideagen EHS Core's** (formerly Lucidity) public API — or any OpenAPI / Swagger spec.

- Three-pane browser UI: endpoint list / request builder / response viewer
- Loads OpenAPI 3.x or Swagger 2.0 specs by URL or file upload
- Server-side proxy avoids browser CORS when calling the real API
- Bearer-token auth panel; tokens kept **in memory only** (refresh clears them)

## Install

Requires Node.js 18 or newer.

```bash
npm install
```

## Run

```bash
npm start
```

Open <http://localhost:3000>.

## Load a spec

The URL box is pre-filled with Lucidity's SwaggerHub page. Two ways to load a spec:

1. **By URL** — paste an OpenAPI/Swagger spec URL and click **Load URL**. The server fetches it (no browser CORS issue).
2. **By file** — click **Upload spec** and pick a `.json`, `.yaml`, or `.yml` file.

> **If SwaggerHub returns 403** (it sometimes blocks server-side fetches): go to SwaggerHub → your API → **Export → Download API → JSON (resolved)** — then upload that file.

Swagger 2.0 specs are automatically converted to OpenAPI 3.0 internally.

## Set authentication

Click **Auth** in the top bar. Paste your Lucidity Bearer JWT. It is added as `Authorization: Bearer <token>` on every request. Per Ideagen's docs, Lucidity tokens are RS256 JWTs that expire ~2 hours — re-paste a fresh one when it expires.

Need extra static headers? Use the **Extra headers** rows in the same panel.

## Make a request

1. Click an endpoint in the sidebar (use the filter to search).
2. Fill the path / query / header parameters and (if applicable) the JSON body.
3. Click **Send**.
4. The response pane shows status, headers, and the body — pretty JSON tree by default, with a Raw tab for plain text.

## Where does my token go?

In memory in your browser tab. The server holds nothing on disk. There is no telemetry. Refresh the page to clear the token (and any in-progress request state).

## Verifying it works

Without the real Lucidity spec, you can smoke-test against public OpenAPI specs:

- OpenAPI 3.0: `https://petstore3.swagger.io/api/v3/openapi.json`
- Swagger 2.0: `https://petstore.swagger.io/v2/swagger.json` (exercises the 2.0 → 3.0 conversion path)
- Round-trip a request: target `https://httpbin.org/anything` and verify the query/header/body echo back.

## Not in v1

Saved request collections, code-snippet generation (curl / JS / Python), environment switcher, auto-refresh JWT. Open an issue if you want any of those next.

## Layout

```
package.json
server/
  index.js            Express bootstrap
  routes/             /api/health, /api/spec, /api/execute
  lib/                spec parser + request proxy
public/
  index.html
  styles.css
  js/                 vanilla ES modules, no build step
```
