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
function initDomainlist() {
    return new Promise (async (resolve, reject) => {
        const domains = await getFromStorage("DOMAINLIST")
        if (domains == undefined) {
            await setToStorage({ DOMAINLIST: {} })
        } 
        resolve()
    })  
}

// Gets & returns the entire DOMAINLIST
function getDomainlist() {
    return new Promise (async (resolve, reject) => {
        const domainlist = await getFromStorage("DOMAINLIST")
        resolve(domainlist)
    })
}

// Gets DOMAINLIST, then gets value of specified domain
function getFromDomainlist(domainkey) {
    return new Promise (async (resolve, reject) => {
        const domainlist = await getFromStorage("DOMAINLIST")
        resolve(domainlist[domainkey])
    })
}

// Adds domain to DOMAINLIST with value true
function addToDomainlist(domainkey) {
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
function removeFromDomainlist(domainkey) {
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
function permRemoveFromDomainlist(domainkey) {
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
    getDomainlist,
    getFromDomainlist,
    addToDomainlist, 
    removeFromDomainlist, 
    permRemoveFromDomainlist
}