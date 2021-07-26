/*
OptMeowt is licensed under the MIT License
Copyright (c) 2021 Kuba Alicki, Stanley Markman, Oliver Wang, Sebastian Zimmeck
Previous contributors: Kiryl Beliauski, Daniel Knopf, Abdallah Salia
privacy-tech-lab, https://privacytechlab.org/
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


// We could use strings instead of hard coding the following objects, however using an
// enumerated object prevents mistyping a string as a parameter, hopefully
// saving us some potential grief
const extensionMode = Object.freeze({
	enabled: 'ENABLED',
	domainlisted: 'DOMAINLISTED',
	disabled: 'DISABLED'
});

// In general, these functions should be use with async / await for 
// syntactic sweetness & synchronous data handling 
// i.e., await storage.set(stores.settings, extensionMode.enabled, 'MODE')
const stores = Object.freeze({
    settings: 'SETTINGS',
    domainlist: 'DOMAINLIST'
});


/******************************************************************************/


const dbPromise = openDB("extensionDB", 1, {
    upgrade: (db) => {
        db.createObjectStore(stores.domainlist)
        db.createObjectStore(stores.settings)
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

export async function handleDownload() {
    console.log("Downloading ...");
    var DOMAIN_NAMES = await storage.getAllKeys(stores.domainlist)
    var DOMAIN_SETTINGS = await storage.getAll(stores.domainlist)

    var blob = new Blob([JSON.stringify(DOMAIN_NAMES, null, 4), JSON.stringify(DOMAIN_SETTINGS, null, 4)],
                          {type: "text/plain;charset=utf-8"});
    saveAs(blob, "OptMeowt_backup.json");

    console.log("Downloaded!")
}

/**
 * Sets-up the process for importing a saved domainlist backup
 */
export async function startUpload() {
  document.getElementById("upload-domainlist").value = ""
  document.getElementById("upload-domainlist").click()
}

/**
 * Imports and updates the domainlist in local storage with an imported backup
 */
export async function handleUpload() {
    console.log("Starting upload ...");
    await storage.clear(stores.domainlist)
    const file = this.files[0];
    const fr = new FileReader();
    fr.onload = function(e) {
        //Parse stored domain list. Stored as two consecutive text arrays: first for domain list, second for corresponding bools showing if each domain is enabled.
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

      console.log("Finished upload!")
    };
    fr.readAsText(file);
}

/******************************************************************************/


export {
    extensionMode,
    stores,
    storage
}