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

// In general, these functions should be use with async / await for 
// syntactic sweetness & synchronous data handling 
// i.e., await setToStorage({ ENABLED: true })
export const settings = 'SETTINGS'
export const domainlist = 'DOMAINLIST'

const dbPromise = openDB("extensionDB", 1, {
    upgrade: (db) => {
        db.createObjectStore(domainlist)
        db.createObjectStore(settings)
    }
})

async function setToStorage(store, value, key) {
    (await dbPromise).put(store, value, key)
}

async function getFromStorage(store, key) {
    (await dbPromise).get(store, key)
}

async function removeFromStorage(store, key) {
    (await dbPromise).delete(store, key)
}


export { setToStorage, getFromStorage, removeFromStorage }