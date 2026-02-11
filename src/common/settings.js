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

/**
 * Returns the user's selected state code (CA, CO, CT, NJ) or null if not set.
 * A value of "none" means the user explicitly chose not to be in a covered state.
 * @returns {Promise<string|null>}
 */
export async function getUserState() {
  return await storage.get(stores.settings, "USER_STATE") || null;
}

/**
 * Returns whether the compliance check should be shown.
 * True when a valid state is selected (not null, not "none").
 * @returns {Promise<boolean>}
 */
export async function isComplianceCheckEnabled() {
  const state = await getUserState();
  return state !== null && state !== "none";
}
