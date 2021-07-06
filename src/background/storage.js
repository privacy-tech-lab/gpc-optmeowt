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

// `storage.js` should import `../data/settings.js` and implement it here.
// Then, whenever we need to update settings, we do it by importing
// `storage.js` because it logically should be able to handle that because
// it is always implicitly in the storage.

import { openDB } from "idb"

// In general, these functions should be use with async / await for 
// syntactic sweetness & synchronous data handling 
// i.e., await setToStorage(stores.settings, extensionMode.enabled, 'MODE')
export const stores = Object.freeze({
    settings: 'SETTINGS',
    domainlist: 'DOMAINLIST'
})

const dbPromise = openDB("extensionDB", 1, {
    upgrade: (db) => {
        db.createObjectStore(stores.domainlist)
        db.createObjectStore(stores.settings)
    }
})

export const storage = {
    async get(store, key) {
        return (await dbPromise).get(store, key)
    },
    async set(store, value, key) {
        return (await dbPromise).put(store, value, key)
    },
    async delete(store, key) {
        return (await dbPromise).delete(store, key)
    }
}