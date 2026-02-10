/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://privacytechlab.org/
*/

/*
storage.js
================================================================================
storage.js handles OptMeowt's reads/writes of data to some local location
*/

import { openDB } from "idb";
import { reloadDynamicRules } from "../common/editRules.js";
import pkg from 'file-saver';
const { saveAs } = pkg;

/******************************************************************************/
/**************************  Enumerated settings  *****************************/
/******************************************************************************/

// In general, these functions should be use with async / await for
// syntactic sweetness & synchronous data handling
// i.e., await storage.set(stores.settings, extensionMode.enabled, 'MODE')
const stores = Object.freeze({
  settings: "SETTINGS",
  domainlist: "DOMAINLIST",
  thirdParties: "THIRDPARTIES",
  wellknownInformation: "WELLKNOWNDATA",
  complianceData: "COMPLIANCEDATA",
});

/******************************************************************************/
/*************************  Main Storage Functions  ***************************/
/******************************************************************************/

const dbPromise = openDB("extensionDB", 2, {
  upgrade: function dbPromiseInternal(db, oldVersion) {
    // Create stores that don't exist yet
    if (!db.objectStoreNames.contains(stores.domainlist)) {
      db.createObjectStore(stores.domainlist);
    }
    if (!db.objectStoreNames.contains(stores.settings)) {
      db.createObjectStore(stores.settings);
    }
    if (!db.objectStoreNames.contains(stores.thirdParties)) {
      db.createObjectStore(stores.thirdParties);
    }
    if (!db.objectStoreNames.contains(stores.wellknownInformation)) {
      db.createObjectStore(stores.wellknownInformation);
    }
    // New in version 2
    if (oldVersion < 2 && !db.objectStoreNames.contains(stores.complianceData)) {
      db.createObjectStore(stores.complianceData);
    }
  },
});

const storage = {
  async get(store, key) {
    if (typeof key === "undefined") {
      return undefined;
    }
    return (await dbPromise).get(store, key);
  },
  async getAll(store) {
    return (await dbPromise).getAll(store);
  },
  async getAllKeys(store) {
    return (await dbPromise).getAllKeys(store);
  },
  // returns an object containing the given store
  async getStore(store) {
    const storeValues = await storage.getAll(store);
    const storeKeys = await storage.getAllKeys(store);
    let storeCopy = {};
    let key;
    for (let index in storeKeys) {
      key = storeKeys[index];
      storeCopy[key] = storeValues[index];
    }
    return storeCopy;
  },
  async set(store, value, key) {
    if (typeof key === "undefined") {
      return undefined;
    }
    return (await dbPromise).put(store, value, key);
  },
  async delete(store, key) {
    if (typeof key === "undefined") {
      return undefined;
    }
    return (await dbPromise).delete(store, key);
  },
  async clear(store) {
    return (await dbPromise).clear(store);
  },
};

/******************************************************************************/
/*********************  Importing/Exporting Domain List  **********************/
/******************************************************************************/

async function handleDownload() {
  const DOMAINLIST = await storage.getStore(stores.domainlist);
  let MANIFEST = chrome.runtime.getManifest();
  let data = {
    VERSION: MANIFEST.version,
    DOMAINLIST: DOMAINLIST,
  };

  let blob = new Blob([JSON.stringify(data, null, 4)], {
    type: "text/plain;charset=utf-8",
  });
  saveAs(blob, "OptMeowt_backup.json");
}

/**
 * Sets-up the process for importing a saved domainlist backup
 */
async function startUpload() {
  document.getElementById("upload-domainlist").value = "";
  document.getElementById("upload-domainlist").click();
}

/**
 * Imports and updates the domainlist in local storage with an imported backup
 */
async function handleUpload() {
  await storage.clear(stores.domainlist);
  const file = this.files[0];
  const fr = new FileReader();
  fr.onload = function (e) {
    const UPLOADED_DATA = JSON.parse(e.target.result);
    let version = UPLOADED_DATA.VERSION;
    let domainlist = UPLOADED_DATA.DOMAINLIST;
    version = version.split(".");

    let domainlist_keys = Object.keys(domainlist);
    let domainlist_vals = Object.values(domainlist);
    for (let i = 0; i < domainlist_keys.length; i++) {
      try {
        storage.set(stores.domainlist, domainlist_vals[i], domainlist_keys[i]);
      } catch (error) {
        alert("Error loading list");
      }
    }
    // hardcode if it is the new version // check
    if (Number(version[0]) >= 3) {
      reloadDynamicRules();
      updateRemovalScript();
    } else {
      chrome.runtime.sendMessage({
        msg: "FORCE_RELOAD",
      });
    }
  };
  fr.readAsText(file);
}

/******************************************************************************/
/******************************************************************************/
/******************************************************************************/

export { handleDownload, startUpload, handleUpload, stores, storage };
