
const COMPLIANCE_DATA_URL = 'https://drive.google.com/uc?export=download&id=1QqRRb7S8HxLZPXMnryp5cCq8UJLpz8D_';

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
    if (!sent_gpc || sent_gpc == '0') {
        return 'unknown';
    }

    // Check US Privacy String (3rd character should be 'Y' for opt-out)
    if (uspapi_after_gpc && uspapi_after_gpc.length >= 3 && uspapi_after_gpc[2] === 'Y') {
        return 'compliant';
    }

    // Check OptanonConsent for isGpcEnabled=1
    if (OptanonConsent_after_gpc && OptanonConsent_after_gpc.includes('isGpcEnabled=1')) {
        return 'compliant';
    }

    // Check OneTrustWPCCPAGoogleOptOut
    if (OneTrustWPCCPAGoogleOptOut_after_gpc === 'true') {
        return 'compliant';
    }

    // Check if GPP string exists
    if (gpp_after_gpc && gpp_after_gpc !== 'null' && gpp_after_gpc !== '') {
        return 'compliant';
    }

    // Check if site has any consent mechanisms but didn't honor GPC
    const hasConsentMechanism = uspapi_before_gpc || OptanonConsent_before_gpc;
    if (hasConsentMechanism) {
        return 'non_compliant';
    }

    return 'unknown';
}

// Robust CSV parser handling quoted fields
function parseCSV(text) {
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) return [];

    // Helper to split CSV line respect quotes
    const splitLine = (line) => {
        const values = [];
        let current = '';
        let inQuote = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuote && line[i + 1] === '"') {
                    current += '"';
                    i++; // Skip escaped quote
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
    console.log('Headers:', headers);

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

async function run() {
    console.log('Fetching ' + COMPLIANCE_DATA_URL);
    try {
        const res = await fetch(COMPLIANCE_DATA_URL); // Native fetch in Node 18+
        console.log('Status:', res.status, res.statusText);
        console.log('Content-Type:', res.headers.get('content-type'));

        const text = await res.text();
        console.log('Fetched ' + text.length + ' bytes');
        console.log('First 500 chars:', text.substring(0, 500));

        // Google Drive generic error check
        if (text.trim().startsWith('<!DOCTYPE html>') || text.includes('Google Drive - Virus scan warning')) {
            console.error('ERROR: Received HTML instead of CSV');
            return;
        }

        const rows = parseCSV(text);
        console.log('Parsed ' + rows.length + ' rows');

        const yelp = rows.find(r => r.domain === 'yelp.com');
        if (yelp) {
            console.log('Found yelp.com:', JSON.stringify(yelp, null, 2));
            console.log('Status:', determineComplianceStatus(yelp));
        } else {
            console.log('yelp.com NOT found in parsable rows');
            // Debug incomplete rows
            const brokenRows = rows.filter(r => !r.domain);
            console.log(`Found ${brokenRows.length} rows without domain`);
        }
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

run();
