/*
OptMeowt is licensed under the MIT License
Copyright (c) 2020 Kuba Alicki, Daniel Knopf, Abdallah Salia, Sebastian Zimmeck
privacy-tech-lab, https://privacytechlab.org/
*/


/*
domainlist.js
================================================================================
domainlist.js handles OptMeowt's reads/writes to the domainlist locally
*/


// we should probably add error handling 
// 1) try / catch when using awaits for their failure?
// 2) use reject() inside promises?


import { openDB } from "idb"
import { setToStorage, getFromStorage } from "./storage.js"


/*
 * In general, the following functions (if they take a parameter), take a 
 * domain {string} as a key to be grabbed from the DOMAINLIST {object} 
 * inside of our local storage. 
 * They resolve to promises containing the requested information accordingly.
 * Then some operations are performed on them accordingly. 
 * 
 * Note the types: 
 * 
 * domainKey {string} - key to access {bool} associated with domain in DOMAINLIST
 * DOMAINLIST {object} - saved within the abstracted storage
 * DOMAINLIST[domainKey] {bool} - value saved to the (domain) key
 * 
 * NOTE: the DOMAINLIST must be initialized on extension launch
 */


// Initializes the DOMAINLIST
async function initDomainlist() {

    //idb version of the same code
    const db = await openDB("extensionDB", 1, {
        upgrade: (db, oldVersion, newVersion, transaction) => {
            if (oldVersion === 0) db.createObjectStore("DOMAINLIST")
        }
    })
    db.close();

    

    return new Promise (async (resolve, reject) => {
        const domains = await getFromStorage("DOMAINLIST")
        if (domains == undefined) {
            await setToStorage({ DOMAINLIST: {} })
        } 
        resolve()
    })
}


// Adds domain to DOMAINLIST with value true
async function addToDomainlist(domainkey) {

    //idb version of the same code
    const db = await openDB("extensionDB", 1)
    db.put('DOMAINLIST', true,  domainkey)
    db.close();


    return new Promise (async (resolve, reject) => {
        var new_domainlist = []
        const domainlist = await getFromStorage("DOMAINLIST")
        new_domainlist = domainlist
        new_domainlist[domainkey] = true
        await setToStorage({ DOMAINLIST: new_domainlist })
        resolve()
    })

    


}

// Adds domain to DOMAINLIST with value false
async function removeFromDomainlist(domainkey) {
    //idb version of the same code
    const db = await openDB("extensionDB", 1)
    db.put('DOMAINLIST', false,  domainkey)
    db.close();

    return new Promise (async (resolve, reject) => {
        var new_domainlist = []
        const domainlist = await getFromStorage("DOMAINLIST")
        new_domainlist = domainlist
        new_domainlist[domainkey] = false
        await setToStorage({ DOMAINLIST: new_domainlist })
        resolve()
    })
}
 
// Removes domain entry from DOMAINLIST
async function permRemoveFromDomainlist(domainkey) {
    //idb version of the same code
    const db = await openDB("extensionDB", 1)
    db.delete('DOMAINLIST', domainkey)
    db.close();

    return new Promise (async (resolve, reject) => {
        var new_domainlist = []
        const domainlist = await getFromStorage("DOMAINLIST")
        new_domainlist = domainlist
        delete new_domainlist[domainkey]
        await setToStorage({ DOMAINLIST: new_domainlist })
        resolve()
    })
}


export { 
    initDomainlist,
    addToDomainlist, 
    removeFromDomainlist, 
    permRemoveFromDomainlist
}