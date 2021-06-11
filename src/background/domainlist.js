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

import { setToStorage, getFromStorage } from "./storage.js"

async function initDomainlist() {
        // try {
            const domains = await getFromStorage("DOMAINLIST")
            if (domains == undefined) {
                const set = await setToStorage({ DOMAINLIST: {} })
            } 
            return new Promise ((resolve, reject) => {
                resolve()
            })
        // }
        // catch {
        //     console.error("Failed initializing domainlist.")
        // }
    
        // getFromStorage("DOMAINLIST", (domainlist) => {
        //     if (domainlist == undefined) {
        //         setToStorage({ DOMAINLIST: {} })
        //         // chrome.storage.local.set({ DOMAINLIST: {} })
        //     }
        // })    
}

function getDomainlist() {
    return new Promise (async (resolve, reject) => {
        const domainlist = await getFromStorage("DOMAINLIST")
        resolve(domainlist)
    })
}

// to be implemented
async function getFromDomainlist(domainkey) {

}

function addToDomainlist(domainkey) {
    // var new_domainlist = []
    // getFromStorage("DOMAINLIST", async (domainlist) => {
    //     new_domainlist = domainlist
    //     new_domainlist[domainkey] = true
    //     setToStorage({ DOMAINLIST: new_domainlist })
    // })

    return new Promise (async (resolve, reject) => {
        var new_domainlist = []
        const domainlist = await getFromStorage("DOMAINLIST")
        new_domainlist = domainlist
        new_domainlist[domainkey] = true    // defaults to sending signal
        await setToStorage({ DOMAINLIST: new_domainlist })
        resolve()
    })
}

// to be implemented
async function removeFromDomainlist(domainkey) {

}
 
// to be implemented
async function permRemoveFromDomainlist(domainkey) {

}


export { 
    initDomainlist,
    addToDomainlist, 
    removeFromDomainlist, 
    permRemoveFromDomainlist,
    getFromDomainlist,
    getDomainlist
}