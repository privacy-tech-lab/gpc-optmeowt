/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://www.privacytechlab.org/
*/


/*
storage.js
================================================================================
storage.js handles OptMeowt's reads/writes of data to some local location
If the domainlist is being handled, then cookies are added/removed here too
*/


import { openDB } from "idb"
import { storageCookies } from "./storageCookies.js"


/******************************************************************************/
/**************************  Enumerated settings  *****************************/
/******************************************************************************/

// We could use strings instead of hard coding the following objects, however using an
// enumerated object prevents mistyping a string as a parameter, hopefully
// saving us some potential grief
// const extensionMode = Object.freeze({
// 	enabled: 'ENABLED',
// 	domainlisted: 'DOMAINLISTED',
// 	disabled: 'DISABLED'
// });

// In general, these functions should be use with async / await for 
// syntactic sweetness & synchronous data handling 
// i.e., await storage.set(stores.settings, extensionMode.enabled, 'MODE')
const stores = Object.freeze({
    settings: 'SETTINGS',
    domainlist: 'DOMAINLIST',
    analysis:'ANALYSIS'
});


///////////////////////////////
/// TODO: REMOVE THIS/////////
/////////////////////////////
/**
 * const ruleIds = [
 *     {    // Implicitly element 0 (0 - 4999)
 *         'taken': true,
 *         'domain': 'duck.com'
 *     },
 *     .
 *     .
 *     .
 *     {
 *         'taken': false,
 *         'domain': ''
 *     }
 * ]
 */

/**
 * Ensures ruleIds exists in localstorage
 * If not, creates ruleIds in localstorage
 */
async function ensureRuleIdsExists() {
  let maxIds = chrome.declarativeNetRequest.MAX_NUMBER_OF_DYNAMIC_AND_SESSION_RULES;
  let result = await chrome.storage.local.get('ruleIds');
  let ruleIds = result.ruleIds;
  if (ruleIds.length === 0) {
    let newRuleIdsComponent = {
      'taken': false,
      'domain': ''
    };
    let newRuleIds = [];
    for (let i=0; i<maxIds; i++) {
      newRuleIds.push(newRuleIdsComponent);
    }
    chrome.storage.local.set({ 'ruleIds': newRuleIds });
  }
}

/**
 * Gets fresh rule ID for new DeclarativeNetRequest dynamic rule
 * @returns {(number|null)} - number of fresh ID, null if non available
 *
 * NOTE: ruleIds from localstorage takes the following form: 
 * let ruleIds: Array<{ 'taken': bool, 'domain': string }>
 */
async function getFreshId() {
  await ensureRuleIdsExists();
  let result = await chrome.storage.local.get(['ruleIds']);
  console.log('here is the result: ', result);
  let ruleIds = result.ruleIds;
  let freshId = null;

  // for (let i=0; i<5000; i++) {
  for (let i=0; i<ruleIds.length; i++) {
    if (!ruleIds[i]['taken']) {
      ruleIds[i]['taken'] = true; // TODO: Have this sync to localstorage
      ruleIds[i]['domain'] = '';
      freshId = i;
      break;
    }
  }
  chrome.storage.local.set({ 'ruleIds': ruleIds })
  return freshId;
}

/**
 * Removes rule with id 'id' from localstorage
 * @param {number} id - Id of dynamic rule to be removed
 */
async function freeId(id) {
  await ensureRuleIdsExists();
  let result = await chrome.storage.local.get('ruleIds');
  let ruleIds = result.ruleIds;
  ruleIds[id]['taken'] = false;
  ruleIds[id]['domain'] = '';
  chrome.storage.local.set({ 'ruleIds': ruleIds })
  return
}


/******************************************************************************/
/*************************  Main Storage Functions  ***************************/
/******************************************************************************/

const dbPromise = openDB("extensionDB", 1, {
    upgrade: (db) => {
        db.createObjectStore(stores.domainlist)
        db.createObjectStore(stores.settings)
        db.createObjectStore(stores.analysis)
    }
});

const storage = {
    async get(store, key) {
        return (await dbPromise).get(store, key)
    },
    async getAll(store) {
        return (await dbPromise).getAll(store)
    },
    async getAllKeys(store) {
        return (await dbPromise).getAllKeys(store)
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
        return new Promise(async (resolve, reject) => {
            // placing or deleting opt out cookies for a given domain key
            // We know that `key` will be a domain, i.e. a string
            if (store === stores.domainlist) {
                if (value === true) {
                    storageCookies.addCookiesForGivenDomain(key)
                }
                if (value === false) {
                    storageCookies.deleteCookiesForGivenDomain(key)
                }
            }

            (await dbPromise).put(store, value, key).then(resolve())
        })
    },
    async delete(store, key) {
        // deleting opt out cookies for a given domain key
        // We know that `key` will be a domain, i.e. a string
        if (store === stores.domainlist) {
            storageCookies.deleteCookiesForGivenDomain(key)
        }

        return (await dbPromise).delete(store, key)
    },
    async clear(store){
        return (await dbPromise).clear(store)
    },
}


/******************************************************************************/
/*********************  Importing/Exporting Domain List  **********************/
/******************************************************************************/

async function handleDownload() {
    // console.log("Downloading ...");
    var DOMAIN_NAMES = await storage.getAllKeys(stores.domainlist)
    var DOMAIN_SETTINGS = await storage.getAll(stores.domainlist)

    var blob = new Blob([JSON.stringify(DOMAIN_NAMES, null, 4), JSON.stringify(DOMAIN_SETTINGS, null, 4)],
                          {type: "text/plain;charset=utf-8"});
    saveAs(blob, "OptMeowt_backup.json");

    // console.log("Downloaded!")
}

/**
 * Sets-up the process for importing a saved domainlist backup
 */
async function startUpload() {
    document.getElementById("upload-domainlist").value = ""
    document.getElementById("upload-domainlist").click()
}

/**
 * Imports and updates the domainlist in local storage with an imported backup
 */
async function handleUpload() {
    // console.log("Starting upload ...");
    await storage.clear(stores.domainlist)
    const file = this.files[0];
    const fr = new FileReader();
    fr.onload = function(e) {
        // Parse stored domain list. Stored as two consecutive text arrays: 
        // first for domain list, second for corresponding bools showing if each domain is enabled.
        var RAW_LOAD = e.target.result.split("]")
        RAW_LOAD[0] = RAW_LOAD[0].replace(/(\r\n|\n|\r|\"|\s|\[)/gm,"")
        RAW_LOAD[1] = RAW_LOAD[1].replace(/(\r\n|\n|\r|\"|\s|\[)/gm,"")
        var LOADED_KEYS = RAW_LOAD[0].split(",")
        var LOADED_SETTINGS = RAW_LOAD[1].split(",")
        for (let i = 0; i < LOADED_KEYS.length; i++) {
            try {
                storage.set(stores.domainlist, (LOADED_SETTINGS[i] === 'true'),LOADED_KEYS[i])
            } catch (error) {
                alert("Error loading list")
            } 
        } 

        // console.log("Finished upload!")
    };
    fr.readAsText(file);
}


/******************************************************************************/
/******************************************************************************/
/******************************************************************************/

export {
    handleDownload,
    startUpload,
    handleUpload,
    // extensionMode,
    stores,
    storage,
    getFreshId,
    freeId
}
