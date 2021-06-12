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


function initDomainlist() {
    return new Promise (async (resolve, reject) => {
        const domains = await getFromStorage("DOMAINLIST")
        if (domains == undefined) {
            await setToStorage({ DOMAINLIST: {} })
        } 
        resolve()
    })  
}

function getDomainlist() {
    return new Promise (async (resolve, reject) => {
        const domainlist = await getFromStorage("DOMAINLIST")
        resolve(domainlist)
    })
}

// this could be sped up: it calls the whole domainlist,
// then grabs the one domain we want, which could be slow
// NOTE: undefined if domain does not exist
function getFromDomainlist(domainkey) {
    return new Promise (async (resolve, reject) => {
        const domainlist = await getFromStorage("DOMAINLIST")
        resolve(domainlist[domainkey])
    })
}

function addToDomainlist(domainkey) {
    return new Promise (async (resolve, reject) => {
        var new_domainlist = []
        const domainlist = await getFromStorage("DOMAINLIST")
        new_domainlist = domainlist
        new_domainlist[domainkey] = true    // defaults to sending signal
        await setToStorage({ DOMAINLIST: new_domainlist })
        resolve()
    })
}

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