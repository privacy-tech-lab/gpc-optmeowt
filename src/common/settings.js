/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://privacytechlab.org/
*/

/*
settings.js
================================================================================
Shared helpers related to extension settings.
*/

import { storage, stores } from "../background/storage.js";

const WELLKNOWN_CHECK_OVERRIDES_KEY = "WELLKNOWN_CHECK_OVERRIDES";

/**
 * Returns whether the well-known check is enabled.
 * Defaults to true unless explicitly disabled.
 * @returns {Promise<boolean>}
 */
export async function isWellknownCheckEnabled() {
  const enabled = await storage.get(stores.settings, "WELLKNOWN_CHECK_ENABLED");
  return enabled !== false;
}

export async function getWellknownCheckOverrides() {
  const overrides = await storage.get(
    stores.settings,
    WELLKNOWN_CHECK_OVERRIDES_KEY
  );
  if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) {
    return {};
  }
  return overrides;
}

export function resolveWellknownCheckEnabled(
  domain,
  globalEnabled,
  overrides
) {
  if (domain && overrides && typeof overrides === "object") {
    const override = overrides[domain];
    if (typeof override === "boolean") {
      return override;
    }
  }
  return globalEnabled;
}

export async function isWellknownCheckEnabledForDomain(domain) {
  const globalEnabled = await isWellknownCheckEnabled();
  const overrides = await getWellknownCheckOverrides();
  return resolveWellknownCheckEnabled(domain, globalEnabled, overrides);
}

export async function setWellknownCheckOverrideForDomain(
  domain,
  enabled,
  globalEnabled
) {
  if (!domain || typeof enabled !== "boolean") {
    return;
  }
  const overrides = await getWellknownCheckOverrides();
  const effectiveGlobal =
    typeof globalEnabled === "boolean"
      ? globalEnabled
      : await isWellknownCheckEnabled();

  if (enabled === effectiveGlobal) {
    if (Object.prototype.hasOwnProperty.call(overrides, domain)) {
      delete overrides[domain];
      await storage.set(
        stores.settings,
        overrides,
        WELLKNOWN_CHECK_OVERRIDES_KEY
      );
    }
    return;
  }

  overrides[domain] = enabled;
  await storage.set(stores.settings, overrides, WELLKNOWN_CHECK_OVERRIDES_KEY);
}
