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

function initDomainlist() {
    getFromStorage("DOMAINLIST", (domainlist) => {
        if (domainlist == undefined) {
            setToStorage({ DOMAINLIST: {} })
        }
    })
}

async function addToDomainlist(domainkey) {
    var new_domainlist = []
    getFromStorage("DOMAINLIST", (domainlist) => {
        new_domainlist = domainlist
        new_domainlist[domainkey] = true
        setToStorage({ DOMAINLIST: new_domainlist })
    })
}

async function removeFromDomainlist(domainkey) {

}
 
async function permRemoveFromDomainlist(domainkey) {

}

async function getFromDomainlist(domainkey) {

}

export { 
    initDomainlist,
    addToDomainlist, 
    removeFromDomainlist, 
    permRemoveFromDomainlist,
    getFromDomainlist
}