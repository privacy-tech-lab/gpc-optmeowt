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
import { reloadDynamicRules } from "../common/editRules"
import { saveAs } from 'file-saver';

/******************************************************************************/
/**************************  Enumerated settings  *****************************/
/******************************************************************************/

// In general, these functions should be use with async / await for 
// syntactic sweetness & synchronous data handling 
// i.e., await storage.set(stores.settings, extensionMode.enabled, 'MODE')
// TODO: Make this an enum
const stores = Object.freeze({
    settings: 'SETTINGS',
    domainlist: 'DOMAINLIST',
    analysis:'ANALYSIS',
    analysis_domains:'ANALYSIS_DOMAINS'
});


/******************************************************************************/
/*************************  Main Storage Functions  ***************************/
/******************************************************************************/

const dbPromise = openDB("extensionDB", 1, {
    upgrade: function dbPromiseInternal(db) {
        db.createObjectStore(stores.domainlist)
        db.createObjectStore(stores.settings)
        db.createObjectStore(stores.analysis)
        db.createObjectStore(stores.analysis_domains)
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
                if (value === null) {
                    storageCookies.addCookiesForGivenDomain(key)
                } else {
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
    const DOMAINLIST = await storage.getStore(stores.domainlist)
    let MANIFEST = chrome.runtime.getManifest();
    if ("$BROWSER" == 'firefox'){
        MANIFEST.version = '2.0';
    }
    let data = {
        VERSION: MANIFEST.version, 
        DOMAINLIST: DOMAINLIST,
    }

    let blob = new Blob([JSON.stringify(data, null, 4)], {type: "text/plain;charset=utf-8"});
    saveAs(blob, "OptMeowt_backup.json");
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
    await storage.clear(stores.domainlist)
    const file = this.files[0];
    const fr = new FileReader();
    fr.onload = function(e) {
        const UPLOADED_DATA = JSON.parse(e.target.result);
        let version = UPLOADED_DATA.VERSION;
        let domainlist = UPLOADED_DATA.DOMAINLIST;
        version = version.split('.');

        let domainlist_keys = Object.keys(domainlist);
        let domainlist_vals = Object.values(domainlist);
        for (let i = 0; i < domainlist_keys.length; i++) {
            try {
                storage.set(stores.domainlist, domainlist_vals[i], domainlist_keys[i]);
            } catch (error) {
                alert("Error loading list")
            } 
        } 
        // hardcode if it is the new version
        if (Number(version[0]) >= 3) {
        reloadDynamicRules();
        updateRemovalScript();
        } else {
            chrome.runtime.sendMessage({
                msg: "FORCE_RELOAD"
              }); 
        }
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
    stores,
    storage
}
