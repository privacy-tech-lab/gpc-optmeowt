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

Compliance is determined by set membership and signal content:
  - Domain in noncompliant_sites        → 'non_compliant'
  - Domain in all_sites, signals found  → 'compliant'
  - Domain in all_sites, all signals null (nothing to measure against)   → 'no_signals'
  - Domain in neither                   → 'no_data'  (handled by caller)
  - Network/server error                → 'fetch_error' (handled by caller)

The 8 signal columns checked for null:
  uspapi_before_gpc, uspapi_after_gpc,
  usp_cookies_before_gpc, usp_cookies_after_gpc,
  OptanonConsent_before_gpc, OptanonConsent_after_gpc,
  gpp_before_gpc, gpp_after_gpc
*/

const STATES_JSON_URL =
  'https://raw.githubusercontent.com/privacy-tech-lab/gpc-web-ui/master/client/public/states.json'; // Permalink to raw states.json — use raw.githubusercontent.com so fetch() gets JSON, not an HTML page

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
 * e.g. https://github.com/ORG/REPO/blob/SHA/path/file.csv
 *   →  https://raw.githubusercontent.com/ORG/REPO/SHA/path/file.csv
 * @param {string} blobUrl
 * @returns {string}
 */
function toRawUrl(blobUrl) {
  // Handle GitHub blob URLs
  const githubMatch = blobUrl.match(
    /^https:\/\/github\.com\/([^/]+\/[^/]+)\/blob\/(.+)$/
  );
  if (githubMatch) {
    return `https://raw.githubusercontent.com/${githubMatch[1]}/${githubMatch[2]}`;
  }
  // If it's already a raw URL or something else, return as-is
  return blobUrl;
}

/**
 * Fetches states.json from the remote host to retrieve current CSV URLs.
 * @returns {Promise<Object>} - Parsed states.json content
 */
async function fetchStatesConfig() {
  const response = await fetch(STATES_JSON_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch states.json (${response.status})`);
  }
  return response.json();
}

// The 8 privacy-signal column names we check for in all_sites
const SIGNAL_COLUMNS = [
  'uspapi_before_gpc',
  'uspapi_after_gpc',
  'usp_cookies_before_gpc',
  'usp_cookies_after_gpc',
  'optanonconsent_before_gpc',
  'optanonconsent_after_gpc',
  'gpp_before_gpc',
  'gpp_after_gpc',
];

/**
 * Returns true if a column value counts as "null" (no signal present).
 * @param {string|undefined} val
 * @returns {boolean}
 */
function isNullSignal(val) {
  return !val || val.trim() === '' || val.trim().toLowerCase() === 'null';
}

/**
 * Fetches a CSV from the given URL and returns a Set of domain strings.
 * Used for the noncompliant_sites CSV where we only need domain membership.
 * Assumes a column header named "domain" (case-insensitive).
 * @param {string} url - Direct download URL for the CSV
 * @returns {Promise<Set<string>>} - Set of domain names found in the CSV
 */
async function fetchDomainSet(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch CSV (${response.status}): ${url}`);
  }

  const csvText = await response.text();

  if (csvText.trim().startsWith('<!DOCTYPE html>') || csvText.includes('Google Drive - Virus scan warning')) {
    throw new Error('CSV fetch returned HTML (possible Google Drive virus-scan redirect)');
  }

  const lines = csvText.split(/\r?\n/);
  if (lines.length < 2) return new Set();

  // Find the index of the "domain" column from the header row
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const domainIndex = headers.indexOf('domain');
  if (domainIndex === -1) {
    throw new Error('CSV does not contain a "domain" column');
  }

  const domains = new Set();
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    // Simple split — domain names don't contain commas or quotes
    const cols = line.split(',');
    const domain = cols[domainIndex] ? cols[domainIndex].trim() : null;
    if (domain) {
      domains.add(domain);
    }
  }

  return domains;
}

/**
 * Fetches the all_sites CSV and returns a Map of domain → { allNull: boolean }.
 * allNull is true when all 8 privacy-signal columns are null/empty, meaning
 * we could not observe any consent mechanism to measure GPC compliance against.
 * @param {string} url - Direct download URL for the all_sites CSV
 * @returns {Promise<Map<string, {allNull: boolean}>>}
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

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const domainIndex = headers.indexOf('domain');
  if (domainIndex === -1) {
    throw new Error('all_sites CSV does not contain a "domain" column');
  }

  // Map each signal column name to its index (-1 if not present)
  const signalIndices = SIGNAL_COLUMNS.map(col => headers.indexOf(col));

  const result = new Map();
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(',');
    const domain = cols[domainIndex] ? cols[domainIndex].trim() : null;
    // Skip rows where domain itself is missing or the literal string "null"
    // (happens when the crawler couldn't resolve the domain, e.g. status="not added")
    if (!domain || domain.toLowerCase() === 'null') continue;

    // A domain is allNull only if every signal column is null/empty
    const allNull = signalIndices.every(idx => idx === -1 || isNullSignal(cols[idx]));
    result.set(domain, { allNull });
  }

  return result;
}

/**
 * Fetches and processes compliance data for a specific state.
 * First fetches states.json from the remote host to get current CSV URLs,
 * then fetches both all_sites and noncompliant_sites CSVs in parallel.
 * Determines status by set membership and signal content:
 *   - in noncompliant_sites              → 'non_compliant'
 *   - in all_sites, signals detected     → 'compliant'
 *   - in all_sites, all signals null     → 'no_signals'
 * Domains absent from all_sites are not included in the returned map;
 * the caller treats missing entries as 'no_data'.
 * Any network or server error returns { error: 'fetch_error' }.
 *
 * @param {string} stateCode - Two-letter state code (CA, CO, CT, NJ)
 * @returns {Promise<Object>} - { data, fetchedAt, stateCode, count } or { error: 'fetch_error' }
 */
export async function fetchComplianceData(stateCode) {
  const stateName = STATE_NAMES[stateCode];
  if (!stateName) {
    throw new Error(`Unknown state code: ${stateCode}`);
  }

  // Fetch states.json from the remote host to get current CSV URLs
  let statesConfig;
  try {
    statesConfig = await fetchStatesConfig();
  } catch (error) {
    console.error('Could not reach states.json config server:', error);
    return { error: 'fetch_error' };
  }

  const stateEntry = statesConfig[stateName];
  if (!stateEntry || !stateEntry.all_sites || !stateEntry.noncompliant_sites) {
    console.error(`states.json does not contain a valid entry for: ${stateName}`);
    return { error: 'fetch_error' };
  }

  // Convert GitHub blob URLs from states.json to raw content URLs
  let allSitesUrl, noncompliantUrl;
  try {
    allSitesUrl = toRawUrl(stateEntry.all_sites);
    noncompliantUrl = toRawUrl(stateEntry.noncompliant_sites);
  } catch (error) {
    console.error('Failed to parse CSV URLs from states.json:', error);
    return { error: 'fetch_error' };
  }

  console.log(`Fetching ${stateCode} compliance data (all_sites + noncompliant_sites)...`);

  let allSitesData, noncompliantDomains;
  try {
    [allSitesData, noncompliantDomains] = await Promise.all([
      fetchAllSitesData(allSitesUrl),
      fetchDomainSet(noncompliantUrl),
    ]);
  } catch (error) {
    console.error(`Failed to fetch compliance CSVs for ${stateCode}:`, error);
    return { error: 'fetch_error' };
  }

  console.log(`${stateCode}: ${allSitesData.size} all_sites, ${noncompliantDomains.size} noncompliant_sites`);

  const complianceMap = {};

  for (const [domain, { allNull }] of allSitesData) {
    if (noncompliantDomains.has(domain)) {
      complianceMap[domain] = {
        status: 'non_compliant',
        details: '',
      };
    } else if (allNull) {
      // All 8 signal columns were null during the crawl — we can't assess compliance
      complianceMap[domain] = {
        status: 'no_signals',
        details: '',
      };
    } else {
      complianceMap[domain] = {
        status: 'compliant',
        details: '',
      };
    }
  }

  return {
    data: complianceMap,
    fetchedAt: Date.now(),
    stateCode,
    count: Object.keys(complianceMap).length,
    // The view URL for this state's all_sites dataset (from states.json)
    viewUrl: stateEntry.all_sites,
  };
}

/**
 * Checks if cached data is still valid
 * @param {number} fetchedAt - Timestamp when data was fetched
 * @returns {boolean} - True if cache is still valid
 */
export function isCacheValid(fetchedAt) {
  if (!fetchedAt) return false;
  return (Date.now() - fetchedAt) < CACHE_TTL_MS;
}
