/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://privacytechlab.org/
*/

/*
complianceData.js
================================================================================
Fetches and processes GPC compliance data from state-specific hosted CSV files.
CSV URLs are read dynamically from states.json hosted on GitHub so they can be
updated server-side without requiring an extension update.

Compliance is determined exclusively by the `compliance_classification` column 
present in the all_sites CSV. The parsed JSON object is attached to each domain 
entry as `classification` so the popup can show per-family status 
(USPS, OptanonConsent, Well-known, GPP).
*/


// Permalink to raw states.json — use raw.githubusercontent.com so fetch() gets JSON, not an HTML page
const STATES_JSON_URL = 'https://raw.githubusercontent.com/privacy-tech-lab/gpc-web-ui/master/client/public/states.json';

// Human-readable state names (used to look up entries in states.json)
export const STATE_NAMES = {
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  NJ: 'New Jersey',
};

// Cache TTL: 24 hours
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Converts a GitHub blob URL to a raw.githubusercontent.com URL so fetch()
 * receives the raw file content rather than an HTML page.
 */
function toRawUrl(blobUrl) {
  const githubMatch = blobUrl.match(
    /^https:\/\/github\.com\/([^/]+\/[^/]+)\/blob\/(.+)$/
  );
  if (githubMatch) {
    return `https://raw.githubusercontent.com/${githubMatch[1]}/${githubMatch[2]}`;
  }
  return blobUrl;
}

/**
 * Fetches states.json from the remote host to retrieve current CSV URLs.
 */
async function fetchStatesConfig() {
  const response = await fetch(STATES_JSON_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch states.json (${response.status})`);
  }
  return response.json();
}

function parseCSVLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else { inQuotes = false; }
      } else {
        cur += ch;
      }
    } else if (ch === ',') {
      out.push(cur); cur = '';
    } else if (ch === '"' && cur === '') {
      inQuotes = true;
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function parseClassification(raw) {
  try { return JSON.parse(raw); } catch (_) {}
  const jsonish = raw
    .replace(/\bNone\b/g, 'null')
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false')
    .replace(/'/g, '"');
  try { return JSON.parse(jsonish); } catch (_) { return null; }
}

/**
 * Fetches the all_sites CSV and returns a Map of domain →
 * { classification: object|null }.
 */
async function fetchAllSitesData(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch CSV (${response.status}): ${url}`);
  }

  const csvText = await response.text();

  if (csvText.trim().startsWith('<!DOCTYPE html>') || csvText.includes('Google Drive - Virus scan warning')) {
    throw new Error('CSV fetch returned HTML (possible Google Drive virus-scan redirect)');
  }

  const lines = csvText.split(/\r?\n/);
  if (lines.length < 2) return new Map();

  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
  const domainIndex = headers.indexOf('domain');
  if (domainIndex === -1) {
    throw new Error('all_sites CSV does not contain a "domain" column');
  }

  const classificationIndex = headers.indexOf('complianceclassification');

  const result = new Map();
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || !line.trim()) continue;
    const cols = parseCSVLine(line);
    const domain = cols[domainIndex] ? cols[domainIndex].trim() : null;
    if (!domain || domain.toLowerCase() === 'null') continue;

    let classification = null;
    if (classificationIndex !== -1) {
      const raw = cols[classificationIndex];
      if (raw && raw.trim() && raw.trim().toLowerCase() !== 'null') {
        classification = parseClassification(raw);
      }
    }

    result.set(domain, { classification });
  }

  return result;
}

/**
 * Fetches and processes compliance data for a specific state.
 */
export async function fetchComplianceData(stateCode) {
  const stateName = STATE_NAMES[stateCode];
  if (!stateName) {
    throw new Error(`Unknown state code: ${stateCode}`);
  }

  let statesConfig;
  try {
    statesConfig = await fetchStatesConfig();
  } catch (error) {
    console.error('Could not reach states.json config server:', error);
    return { error: 'fetch_error' };
  }

  const stateEntry = statesConfig[stateName];
  if (!stateEntry || !stateEntry.all_sites) {
    console.error(`states.json does not contain a valid entry for: ${stateName}`);
    return { error: 'fetch_error' };
  }

  let allSitesUrl;
  try {
    allSitesUrl = toRawUrl(stateEntry.all_sites);
  } catch (error) {
    console.error('Failed to parse CSV URLs from states.json:', error);
    return { error: 'fetch_error' };
  }

  console.log(`Fetching ${stateCode} compliance data (all_sites)...`);

  let allSitesData;
  try {
    allSitesData = await fetchAllSitesData(allSitesUrl);
  } catch (error) {
    console.error(`Failed to fetch compliance CSVs for ${stateCode}:`, error);
    return { error: 'fetch_error' };
  }

  console.log(`${stateCode}: ${allSitesData.size} all_sites processed`);

  const complianceMap = {};

  for (const [domain, { classification }] of allSitesData) {
    complianceMap[domain] = {
      classification // null when CSV lacks the column or value is JSON null
    };
  }

  return {
    data: complianceMap,
    fetchedAt: Date.now(),
    stateCode,
    count: Object.keys(complianceMap).length,
  };
}

export function isCacheValid(fetchedAt) {
  if (!fetchedAt) return false;
  return (Date.now() - fetchedAt) < CACHE_TTL_MS;
}