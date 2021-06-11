/**
 * Short integrated test for a few functions from storage.js
 * 
 * feel free to change this up, I just copied the code from my tests right in here
 */


import { initDomainlist, addToDomainlist, getDomainlist } from "../domainlist.js"


async function init() {
  
    // inti domainlist test
    await initDomainlist() // initializes DOMAINLIST keyword in storage
    await setToStorage({ DOMAINLIST: {"http://amazon.com/": true} })
    await addToDomainlist("google.com")
  
  
    const domains = await getDomainlist()
    console.log("DOMAINLIST = ", domains)
  
    /*
    console.log("starting writing to regular...")
    const set = await setToStorage({ ENABLED: true })
    const get = await getFromStorage("ENABLED")
    console.log("['ENABLED'] = ", get)
    console.log("wrote and read successfully")
    */
  
    // initDomainlist()
    // getFromStorage("DOMAINLIST", (res) => { console.log("DOMAINLIST = ", res) })
  
    // addToDomainlist("http://amazon.com/")
    // getFromStorage("DOMAINLIST", (res) => { console.log("DOMAINS2 = ", res) })
  
  
  
  
    // //init domain list
    // await chrome.storage.local.get(["DOMAINLIST"], (result) => {
    //   if (result["DOMAINLIST"] === undefined) {
    //       chrome.storage.local.set({ DOMAINLIST: {"amazon.com": true} })
    //   }
    // })
  
    // // get blank from storage
    // await chrome.storage.local.get(["DOMAINLIST"], (result) => {
    //   console.log(result["DOMAINLIST"])
    // })
  
    // store value in storage
  
    // get new updated value from storage (not blank)
  
  }
  
  init()