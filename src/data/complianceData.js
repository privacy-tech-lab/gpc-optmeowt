/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://privacytechlab.org/
*/

/*
complianceData.js
================================================================================
Fetches and processes GPC compliance data from state-specific hosted CSV files
*/

// State-specific Google Drive direct download URLs
const STATE_DATA_URLS = {
  CA: 'https://drive.google.com/uc?export=download&id=1QqRRb7S8HxLZPXMnryp5cCq8UJLpz8D_',
  CO: 'https://drive.google.com/uc?export=download&id=1cYYJIJnbHJvKHzWwalqxYEZClZoXRqLP',
  CT: 'https://drive.google.com/uc?export=download&id=1POdmV0CPcFvO5jn00KYuMfhhiNtvFC4f',
  NJ: 'https://drive.google.com/uc?export=download&id=1I_fNSOycGnRWX-sZ-mn5C05rw8vsOe9b',
};

// Human-readable state names
export const STATE_NAMES = {
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  NJ: 'New Jersey',
};

// Viewable Google Drive URLs for each state's dataset
export const STATE_VIEW_URLS = {
  CA: 'https://drive.google.com/file/d/1QqRRb7S8HxLZPXMnryp5cCq8UJLpz8D_/view',
  CO: 'https://drive.google.com/file/d/1cYYJIJnbHJvKHzWwalqxYEZClZoXRqLP/view',
  CT: 'https://drive.google.com/file/d/1POdmV0CPcFvO5jn00KYuMfhhiNtvFC4f/view',
  NJ: 'https://drive.google.com/file/d/1I_fNSOycGnRWX-sZ-mn5C05rw8vsOe9b/view',
};

// Cache TTL: 24 hours
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Helper to check if a value is effectively null (undefined, null, "null", "None")
 */
function isNull(val) {
  return !val || val === 'null' || val === 'None' || val === 'NULL';
}

/**
 * Determines compliance status from crawl data entry
 * @param {Object} entry - Row from the CSV with compliance signals
 * @returns {string} - 'compliant', 'non_compliant', 'no_signals', or 'unknown'
 */
function determineComplianceStatus(entry) {
  const {
    uspapi_before_gpc,
    uspapi_after_gpc,
    OptanonConsent_before_gpc,
    OptanonConsent_after_gpc,
    gpp_after_gpc,
    OneTrustWPCCPAGoogleOptOut_after_gpc,
    sent_gpc
  } = entry;

  // If GPC wasn't sent, we can't determine compliance
  if (isNull(sent_gpc) || sent_gpc === '0') {
    return 'unknown';
  }

  // Check US Privacy String (3rd character should be 'Y' for opt-out)
  if (!isNull(uspapi_after_gpc) && uspapi_after_gpc.length >= 3 && uspapi_after_gpc[2] === 'Y') {
    return 'compliant';
  }

  // Check OptanonConsent for isGpcEnabled=1
  if (!isNull(OptanonConsent_after_gpc) && OptanonConsent_after_gpc.includes('isGpcEnabled=1')) {
    return 'compliant';
  }

  // Check OneTrustWPCCPAGoogleOptOut
  if (!isNull(OneTrustWPCCPAGoogleOptOut_after_gpc) && OneTrustWPCCPAGoogleOptOut_after_gpc === 'true') {
    return 'compliant';
  }

  // Check if GPP string exists (simplified)
  if (!isNull(gpp_after_gpc)) {
    return 'compliant';
  }

  // Check if site has any consent mechanisms but didn't honor GPC
  const hasConsentMechanism = !isNull(uspapi_before_gpc) || !isNull(OptanonConsent_before_gpc);
  if (hasConsentMechanism) {
    return 'non_compliant';
  }

  // GPC was sent but no consent mechanisms were detected on this site
  return 'no_signals';
}

/**
 * Generates a brief explanation of the compliance status
 * @param {Object} entry - Row from the CSV
 * @param {string} status - Compliance status
 * @returns {string} - Human-readable explanation
 */
function generateStatusExplanation(entry, status) {
  // For these statuses, there's no technical evidence to show
  // The popup statusText already explains them
  if (status === 'unknown' || status === 'no_signals') {
    return '';
  }

  const reasons = [];

  if (!isNull(entry.uspapi_after_gpc) && entry.uspapi_after_gpc.length >= 3 && entry.uspapi_after_gpc[2] === 'Y') {
    reasons.push(`US Privacy String: ${entry.uspapi_after_gpc}`);
  }

  if (!isNull(entry.OptanonConsent_after_gpc) && entry.OptanonConsent_after_gpc.includes('isGpcEnabled=1')) {
    reasons.push('OptanonConsent: isGpcEnabled=1');
  }

  if (!isNull(entry.OneTrustWPCCPAGoogleOptOut_after_gpc) && entry.OneTrustWPCCPAGoogleOptOut_after_gpc === 'true') {
    reasons.push('OneTrust CCPA Opt-Out: true');
  }

  if (!isNull(entry.gpp_after_gpc)) {
    reasons.push('GPP string present');
  }

  if (status === 'compliant' && reasons.length > 0) {
    return reasons.join(' · ');
  } else if (status === 'non_compliant') {
    return 'Consent mechanisms found but did not respond to GPC';
  }

  return '';
}

/**
 * Parses CSV text into an array of objects handling quoted fields
 * @param {string} csvText - Raw CSV content
 * @returns {Array<Object>} - Parsed rows as objects
 */
function parseCSV(csvText) {
  const lines = csvText.split(/\r?\n/);
  if (lines.length < 2) return [];

  const splitLine = (line) => {
    const values = [];
    let current = '';
    let inQuote = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuote && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuote = !inQuote;
        }
      } else if (char === ',' && !inQuote) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);
    return values;
  };

  const headers = splitLine(lines[0]).map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = splitLine(line);
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ? values[index].trim() : null;
    });

    rows.push(row);
  }

  return rows;
}

/**
 * Fetches and processes the compliance data CSV for a specific state
 * @param {string} stateCode - Two-letter state code (CA, CO, CT, NJ)
 * @returns {Promise<Object>} - Domain-keyed compliance data
 */
export async function fetchComplianceData(stateCode) {
  const url = STATE_DATA_URLS[stateCode];
  if (!url) {
    throw new Error(`No compliance data URL for state: ${stateCode}`);
  }

  try {
    console.log(`Fetching ${stateCode} compliance data from:`, url);
    const response = await fetch(url);

    console.log('Compliance fetch status:', response.status);
    if (!response.ok) {
      throw new Error(`Failed to fetch compliance data: ${response.status}`);
    }

    const csvText = await response.text();
    console.log(`Fetched ${csvText.length} bytes of ${stateCode} compliance data`);

    if (csvText.trim().startsWith('<!DOCTYPE html>') || csvText.includes('Google Drive - Virus scan warning')) {
      console.error('Compliance data fetch returned HTML instead of CSV.');
    }

    const rows = parseCSV(csvText);
    console.log(`Parsed ${rows.length} compliance rows for ${stateCode}`);

    const complianceMap = {};

    rows.forEach(row => {
      if (!row.domain) return;

      const status = determineComplianceStatus(row);
      const details = generateStatusExplanation(row, status);

      complianceMap[row.domain] = {
        status,
        details,
        lastChecked: row.id || 'unknown',
        rawData: {
          uspapi_after: row.uspapi_after_gpc,
          optanon_after: !isNull(row.OptanonConsent_after_gpc) ? 'present' : null,
          gpp_after: !isNull(row.gpp_after_gpc) ? 'present' : null
        }
      };
    });

    return {
      data: complianceMap,
      fetchedAt: Date.now(),
      stateCode,
      count: Object.keys(complianceMap).length
    };

  } catch (error) {
    console.error(`Error fetching ${stateCode} compliance data:`, error);
    throw error;
  }
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
