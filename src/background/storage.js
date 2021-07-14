/*
OptMeowt is licensed under the MIT License
Copyright (c) 2020 Kuba Alicki, Daniel Knopf, Abdallah Salia, Sebastian Zimmeck
privacy-tech-lab, https://privacytechlab.org/
*/


/*
storage.js
================================================================================
storage.js handles OptMeowt's reads/writes of data to some local location
*/


import { openDB } from "idb"


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

////////////////////////////////////////////////////////////////////////////////

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
            (await dbPromise).put(store, value, key).then(resolve())
        })
    },
    async delete(store, key) {
        return (await dbPromise).delete(store, key)
    }
}


export {
    extensionMode,
    stores,
    storage
}