/*
OptMeowt is licensed under the MIT License
Copyright (c) 2020 Kuba Alicki, Daniel Knopf, Abdallah Salia, Sebastian Zimmeck
privacy-tech-lab, https://privacytechlab.org/
*/

/*
background.js
================================================================================
background.js is the main background script handling OptMeowt's
main opt-out functionality
*/



import {
  onBeforeSendHeaders, 
  onHeadersReceived, 
  onBeforeNavigate,
  onCommitted
} from "./events.js"
import { setToStorage, getFromStorage } from "./storage.js"
import {
  initDomainlist,
  addToDomainlist, 
  removeFromDomainlist, 
  permRemoveFromDomainlist,
  getFromDomainlist,
  getDomainlist 
} from "./domainlist.js"




// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onBeforeRequest
// https://developer.chrome.com/docs/extensions/reference/webRequest/
// This is the extraInfoSpec array of strings
const mozRequestSpec = ["requestHeaders", "blocking"]
const mozResponseSpec = ["responseHeaders", "blocking"]
const chromeRequestSpec = ["requestHeaders", "extraHeaders", "blocking"]
const chromeResponseSpec = ["responseHeaders", "extraHeaders", "blocking"]

// This is the filter object
const filter = { urls: ["<all_urls>"] }

// Initializers
var tabs = {}; /// Store all active tab id's, domain, requests, and response
var wellknown = {} /// Store information about `well-known/gpc` files per tabs
var signalPerTab = {} /// Store information on a signal being sent for updateUI
var activeTabID = 0;
var sendSignal = false;
var userAgent = window.navigator.userAgent.indexOf("Firefox") > -1 ? "moz" : "chrome"
var global_domains = {};


/**
 * Enables extension functionality and sets site listeners
 * Information regarding the functionality and timing of webRequest and webNavigation 
 * can be found on Mozilla's & Chrome's API docuentation sites (also linked above)
 * 
 * The functions called on event occurance are located in `events.js`
 */
async function enable() {   
  if (userAgent === "moz") {


    openDB('db1', 1, {
      upgrade(db) {
        db.createObjectStore('store1');
        db.createObjectStore('store2');
      },
    });
    openDB('db2', 1, {
      upgrade(db) {
        db.createObjectStore('store3', { keyPath: 'id' });
        db.createObjectStore('store4', { autoIncrement: true });
      },
    });

    const db1 = await openDB('db1', 1);
    db1
      .add('store1', 'hello again!!', 'new message')
      .then(result => {
        console.log('success!', result);
      })
      .catch(err => {
        console.error('error: ', err);
      });

    const db2 = await openDB('db2', 1);
    db2.add('store3', { id: 'cat001', strength: 10, speed: 10 });
    db2.add('store3', { id: 'cat002', strength: 11, speed: 9 });
    db2.add('store4', { id: 'cat003', strength: 8, speed: 12 });
    db2.add('store4', { id: 'cat004', strength: 12, speed: 13 });

    // retrieve by key:
    db2.get('store3', 'cat001').then(console.log);
    // retrieve all:
    db2.getAll('store3').then(console.log);
    // count the total number of items in a store:
    db2.count('store3').then(console.log);
    // get all keys:
    db2.getAllKeys('store3').then(console.log);

    async function demo9() {
      const db3 = await openDB('db3', 1, {
        upgrade: (db, oldVersion, newVersion, transaction) => {
          if (oldVersion === 0) upgradeDB3fromV0toV1();
    
          function upgradeDB3fromV0toV1() {
            db.createObjectStore('moreCats', { keyPath: 'id' });
            generate100cats().forEach(cat => {
              transaction.objectStore('moreCats').add(cat);
            });
          }
        },
      });
      db3.close();
    }
    
    function generate100cats() {
      return new Array(100).fill().map((item, index) => {
        let id = 'cat' + index.toString().padStart(3, '0');
        let strength = Math.round(Math.random() * 100);
        let speed = Math.round(Math.random() * 100);
        return { id, strength, speed };
      });
    }

    demo9();

    async function demo12() {
      const db3 = await openDB('db3', 4, {
        upgrade: (db, oldVersion, newVersion, transaction) => {
          // upgrade to v4 in a less careful manner:
          const store = transaction.objectStore('moreCats');
          store.createIndex('strengthIndex', 'strength');
        },
      });
      db3.close();
    }

    demo12();

    const db3 = await openDB('db3', 4);
  const transaction = db3.transaction('moreCats');
  const strengthIndex = transaction.store.index('strengthIndex');
  // get all entries where the key is 10:
  let strongestCats = await strengthIndex.getAll(10);
  console.log('strongest cats: ', strongestCats);
  // get the first entry where the key is 10:
  let oneStrongCat = await strengthIndex.get(10);
  console.log('a strong cat: ', oneStrongCat);
  db3.close();

  async function demo15() {
    const db3 = await openDB('db3', 4);
    // create some ranges. note that IDBKeyRange is a native browser API,
    // it's not imported from idb, just use it:
    const strongRange = IDBKeyRange.lowerBound(8);
    const midRange = IDBKeyRange.bound(3, 7);
    const weakRange = IDBKeyRange.upperBound(2);
    let [strongCats, ordinaryCats, weakCats] = [
      await db3.getAllFromIndex('moreCats', 'strengthIndex', strongRange),
      await db3.getAllFromIndex('moreCats', 'strengthIndex', midRange),
      await db3.getAllFromIndex('moreCats', 'strengthIndex', weakRange),
    ];
    console.log('strong cats (strength >= 8): ', strongCats);
    console.log('ordinary cats (strength from 3 to 7): ', ordinaryCats);
    console.log('weak cats (strength <=2): ', weakCats);
    db3.close();
  }

  demo15();

  async function demo16() {
    const db3 = await openDB('db3', 4);
    // open a 'readonly' transaction:
    let store = db3.transaction('moreCats').store;
    // create a cursor, inspect where it's pointing at:
    let cursor = await store.openCursor();
    console.log('cursor.key: ', cursor.key);
    console.log('cursor.value: ', cursor.value);
    // move to next position:
    cursor = await cursor.continue();
    // inspect the new position:
    console.log('cursor.key: ', cursor.key);
    console.log('cursor.value: ', cursor.value);
  
    // keep moving until the end of the store
    // look for cats with strength and speed both greater than 8
    while (true) {
      const { strength, speed } = cursor.value;
      if (strength >= 8 && speed >= 8) {
        console.log('found a good cat! ', cursor.value);
      }
      cursor = await cursor.continue();
      if (!cursor) break;
    }
    db3.close();
  }

  demo16();


    // (4) global Firefox listeners
    chrome.webRequest.onBeforeSendHeaders.addListener(
      onBeforeSendHeaders,
      filter,
      mozRequestSpec
    )
    chrome.webRequest.onHeadersReceived.addListener(
      onHeadersReceived,
      filter,
      mozResponseSpec
    )
    chrome.webNavigation.onBeforeNavigate.addListener(onBeforeNavigate)
    chrome.webNavigation.onCommitted.addListener(onCommitted)
    setToStorage({ ENABLED: true })

  } else {
    
    // (4) global Chrome listeners
    chrome.webRequest.onBeforeSendHeaders.addListener(
      onBeforeSendHeaders,
      filter,
      chromeRequestSpec
    )
    chrome.webRequest.onHeadersReceived.addListener(
      onHeadersReceived,
      filter,
      chromeResponseSpec
    )
    chrome.webNavigation.onBeforeNavigate.addListener(onBeforeNavigate, filter)
    chrome.webNavigation.onCommitted.addListener(onCommitted, filter)
    setToStorage({ ENABLED: true })

  }
}

/**
 * Disables extension functionality
 */
function disable() {
  chrome.webRequest.onBeforeSendHeaders.removeListener(onBeforeSendHeaders);
  chrome.webRequest.onHeadersReceived.removeListener(onHeadersReceived);
  chrome.webNavigation.onBeforeNavigate.removeListener(onBeforeNavigate);
  chrome.webNavigation.onCommitted.removeListener(onCommitted);
  setToStorage({ ENABLED: false });
  var counter = 0;
}


/**
 * Initializes the extension
 * Place all initialization necessary, as high level as can be, here
 */
async function init() {
  await initDomainlist() // initializes DOMAINLIST keyword in storage
  enable()
}

// Initialize call
init()