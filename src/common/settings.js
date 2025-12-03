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

/**
 * Returns whether the well-known check is enabled.
 * Defaults to true unless explicitly disabled.
 * @returns {Promise<boolean>}
 */
export async function isWellknownCheckEnabled() {
  const enabled = await storage.get(stores.settings, "WELLKNOWN_CHECK_ENABLED");
  return enabled !== false;
}
