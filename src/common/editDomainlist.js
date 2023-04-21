/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://privacytechlab.org/
*/

/*
editDomainlist.js
================================================================================
editDomainlist.js is an internal API modifying the domainlist / modifying the
domainlist simultaneously with the dynamic ruleset
*/

import { storage, stores } from "../background/storage.js";
import {
  deleteAllDynamicRules,
  deleteDynamicRule,
  addDynamicRule,
  getFreshId,
} from "./editRules.js";

/* # Debugging */
// debug_domainlist_and_dynamicrules
// print_rules_and_domainlist

/******************************************************************************/
/******************************************************************************/
/**********                  # Standard Operation                    **********/
/******************************************************************************/
/******************************************************************************/

async function updateRemovalScript() {
  if ("$BROWSER" == "chrome") {
    let ex_matches = ["https://example.org/foo/bar.html"];
    let domain;
    let domainValue;
    const domainlistKeys = await storage.getAllKeys(stores.domainlist);
    const domainlistValues = await storage.getAll(stores.domainlist);
    for (let index in domainlistKeys) {
      domain = domainlistKeys[index];
      domainValue = domainlistValues[index];
      if (domainValue != null) {
        ex_matches.push("https://" + domain + "/*");
        ex_matches.push("https://www." + domain + "/*");
      }
    }
    chrome.scripting
      .updateContentScripts([
        {
          id: "1",
          matches: ["<all_urls>"],
          excludeMatches: ex_matches,
          js: ["content-scripts/registration/gpc-dom.js"],
          runAt: "document_start",
        },
      ])
      .then(() => {});
  }
}

async function createCS(domain){
  if ("$BROWSER" == "chrome") {
    let script = await chrome.scripting.getRegisteredContentScripts({
    });

    let ex_matches = script[0].excludeMatches;

    ex_matches.push("https://" + domain + "/*");
    ex_matches.push("https://www." + domain + "/*");

    await chrome.scripting.updateContentScripts([
      {
        id: "1",
        matches: ["<all_urls>"],
        excludeMatches: ex_matches,
        js: ["content-scripts/registration/gpc-dom.js"],
        runAt: "document_start",
      },
    ])
    .then(() => {});
  }
}

async function deleteCS(domain){
  if ("$BROWSER" == "chrome") {
    let script = await chrome.scripting.getRegisteredContentScripts({
    });
    let ex_matches = script[0].excludeMatches;
    function removeItemOnce(arr, value) {
      var index = arr.indexOf(value);
      if (index > -1) {
        arr.splice(index, 1);
      }
      return arr;
    }

    ex_matches = removeItemOnce(ex_matches,"https://" + domain + "/*");
    ex_matches = removeItemOnce(ex_matches,"https://www." + domain + "/*");
    await chrome.scripting.updateContentScripts([
      {
        id: "1",
        matches: ["<all_urls>"],
        excludeMatches: ex_matches,
        js: ["content-scripts/registration/gpc-dom.js"],
        runAt: "document_start",
      },
    ])
    .then(() => {});
  }
}

async function deleteDomainlistAndDynamicRules() {
  await storage.clear(stores.domainlist);
  if ("$BROWSER" == "chrome") {
    deleteAllDynamicRules();
  }
}

async function addDomainToDomainlistAndRules(domain) {
  let id = 1;
  if ("$BROWSER" == "chrome") {
    id = await getFreshId();
    addDynamicRule(id, domain); // add the rule for the chosen domain
    createCS(domain);
  }
  await storage.set(stores.domainlist, id, domain); // record what rule the domain is associated to
}

async function removeDomainFromDomainlistAndRules(domain) {
  if ("$BROWSER" == "chrome") {
    let id = await storage.get(stores.domainlist, domain);
    deleteDynamicRule(id);
    deleteCS(domain);
  }
  await storage.set(stores.domainlist, null, domain);
}

/******************************************************************************/
/******************************************************************************/
/**********                      # Debugging                         **********/
/******************************************************************************/
/******************************************************************************/

async function debug_domainlist_and_dynamicrules() {
  let sampleSites = [ // not called
    "a.com",
    "b.com",
    "c.com",
    "d.com",
    "e.com",
    "f.com",
    "g.com",
    "h.com",
    "i.com",
    "j.com",
  ];
  await deleteDomainlistAndDynamicRules();
  await print_rules_and_domainlist();
  addDynamicRule(2, "nytimes.com"); // add the rule for the chosen domain
  await storage.set(stores.domainlist, 2, "nytimes.com"); // record what rule the domain is associated to

  await print_rules_and_domainlist();
  await addDomainToDomainlistAndRules("a.com");
  await addDomainToDomainlistAndRules("b.com");
  await addDomainToDomainlistAndRules("c.com");
  await addDomainToDomainlistAndRules("d.com");
  await addDomainToDomainlistAndRules("e.com");
  await addDomainToDomainlistAndRules("f.com");
  await addDomainToDomainlistAndRules("g.com");
  await addDomainToDomainlistAndRules("h.com");
  await addDomainToDomainlistAndRules("i.com");
  await addDomainToDomainlistAndRules("j.com");
  await print_rules_and_domainlist();
}

async function print_rules_and_domainlist() {
  let rules = await chrome.declarativeNetRequest.getDynamicRules();
  let domainlist = await storage.getStore(stores.domainlist);
  console.log(
    "Here are the curr dynamic rules:",
    rules,
    "Here is our curr domainlist: ",
    domainlist
  );
}

/******************************************************************************/
/******************************************************************************/
/******************************************************************************/

export {
  deleteDomainlistAndDynamicRules,
  addDomainToDomainlistAndRules,
  removeDomainFromDomainlistAndRules,
  updateRemovalScript,
  debug_domainlist_and_dynamicrules,
  print_rules_and_domainlist,
  deleteCS,
  createCS
};
