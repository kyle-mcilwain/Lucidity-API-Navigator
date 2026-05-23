import SwaggerParser from '@apidevtools/swagger-parser';
import yaml from 'js-yaml';
import { convertObj } from 'swagger2openapi';

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function fetchSpecBody(url) {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json, application/yaml, text/yaml, text/plain;q=0.5, */*;q=0.1',
      'User-Agent': BROWSER_UA,
    },
    redirect: 'follow',
  });
  if (!res.ok) {
    const snippet = (await res.text().catch(() => '')).slice(0, 200);
    const err = new Error(
      `Failed to fetch spec from ${url}: HTTP ${res.status} ${res.statusText}` +
        (snippet ? ` — ${snippet}` : ''),
    );
    err.details = { status: res.status };
    throw err;
  }
  return await res.text();
}

function parseSpecText(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed);
    } catch (e) {
      throw new Error(`Spec looks like JSON but failed to parse: ${e.message}`);
    }
  }
  try {
    return yaml.load(trimmed);
  } catch (e) {
    throw new Error(`Could not parse spec as JSON or YAML: ${e.message}`);
  }
}

export async function loadSpec({ url, raw }) {
  const text = raw ?? (await fetchSpecBody(url));
  let doc = parseSpecText(text);

  if (!doc || typeof doc !== 'object') {
    throw new Error('Parsed spec is not an object.');
  }

  if (doc.swagger && String(doc.swagger).startsWith('2')) {
    const { openapi } = await convertObj(doc, { patch: true, warnOnly: true });
    doc = openapi;
  }

  if (!doc.openapi) {
    throw new Error('Document is missing both `openapi` and `swagger` version fields — not an OpenAPI spec.');
  }

  try {
    doc = await SwaggerParser.dereference(doc);
  } catch (e) {
    // Dereferencing can fail on broken $refs; keep the un-dereferenced doc so the UI still renders.
    doc.__derefError = e.message;
  }

  return doc;
}
