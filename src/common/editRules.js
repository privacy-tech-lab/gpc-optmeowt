/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://www.privacytechlab.org/
*/

import { storage, stores } from "../background/storage";


/*
editRules.js
================================================================================
editRules.js is an internal API for adding/removing GPC-exclusion dynamic rules
*/


/**
 * Gets fresh rule ID for new DeclarativeNetRequest dynamic rule
 * Pulls from already set dynamic rules as opposed to domainlist values
 * 
 * NOTE:  Does not 'reserve' the ID. If it isn't used on the client side,
 *        getFreshId() will spit out the same val next call. 
 * @returns {Promise<(number|null)>} - number of fresh ID, null if non available
 */
 export async function getFreshId(domain) {
  const MAX_RULES = chrome.declarativeNetRequest.MAX_NUMBER_OF_DYNAMIC_AND_SESSION_RULES;
  const rules = await chrome.declarativeNetRequest.getDynamicRules();
	let freshId = null;
	let usedRuleIds = [];
  let usedDomains = [];

  for (let i in rules) {
    let num = rules[i]['id']
    usedDomains.push( rules[i]['condition']['urlFilter'])
    if (rules[i]['condition']['urlFilter'] == domain){
      chrome.declarativeNetRequest.updateDynamicRules({
        "removeRuleIds": [num]
        }
      )
    } else {
      usedRuleIds.push( num );
    }
  }
	usedRuleIds.sort((a, b) => { return a-b; });  // Necessary for next for loop
  if (usedDomains.includes(domain)){
    return null;
  }
	// Make sure the ID starts at 1 (I think 0 is reserved?)
	for (let i=1; i<MAX_RULES; i++) {
    console.log("ITERATION")
		if (i !== usedRuleIds[i-1]) {
			freshId = i;      // We have found the first nonzero, unused id
			break;
		}
	}
	return freshId;
}

/**
 * Deletes GPC-exclusion rule from rule set
 * Does NOT remove from domainlist
 * (see declarativeNetRequest)
 * @param {number} id - rule id
 */
export async function deleteDynamicRule(id) {
	let UpdateRuleOptions = { "removeRuleIds": [id] };
	await chrome.declarativeNetRequest.updateDynamicRules(UpdateRuleOptions);
  console.log('Removed rule id#',id);
}

/**
 * Deletes all GPC-exclusion dynamic rules 
 * (see declarativeNetRequest)
 */
export async function deleteAllDynamicRules() {
  let MAX_RULES = chrome.declarativeNetRequest.MAX_NUMBER_OF_DYNAMIC_AND_SESSION_RULES;
	let UpdateRuleOptions = { "removeRuleIds": [...Array(MAX_RULES).keys()] };
  await chrome.declarativeNetRequest.updateDynamicRules(UpdateRuleOptions);
  // console.log('Removed all dynamic rules.');
}

/**
 * Adds domain as a rule to be excluded from receiving GPC signals
 * Note id should be fresh, o/w it will overwrite existing rule 
 * (see getFreshId, declarativeNetRequest)
 * @param {number} id - rule id
 * @param {string} domain - domain to associate with id
 */
export async function addDynamicRule(id, domain) {
	let UpdateRuleOptions = {
    "removeRuleIds": [id],
	  "addRules": [
      {
        "id": id,
        "priority": 2,
        "action": {
          "type": "modifyHeaders",
          "requestHeaders": [
            { "header": "Sec-GPC", "operation": "remove" },
            { "header": "DNT", "operation": "remove" }
          ]
        },
        "condition": { 
          "urlFilter": domain,
          "resourceTypes": [
            "main_frame",
            "sub_frame",
            "stylesheet",
            "script",
            "image",
            "font",
            "object",
            "xmlhttprequest",
            "ping",
            "csp_report",
            "media",
            "websocket",
            "webtransport",
            "webbundle",
            "other"
          ]
        }
      }
	  ]
	};
	await chrome.declarativeNetRequest.updateDynamicRules(UpdateRuleOptions);
  // console.log('Added rule id#',id,' [',domain,'].');
  return;
}


/**
 * Deletes all rules, queries current domainlist, and re-adds all rules
 * - Useful when replacing the domainlist via an import/export
 * - Remember rules as of v3.0.0 are 'exclusion' rules, i.e. excluded from 
 *   receiving GPC or other opt-outs. 
 */
export async function reloadDynamicRules() {
  // TODO: Make sure we can still import the old file format from VERSION < 3.0.0

  deleteAllDynamicRules();
  console.log("I got here h;aha")
  let domainlist = await storage.getStore(stores.domainlist)

  let promises = []
  Object.keys(domainlist).forEach(async (domain) => {
    promises.push(new Promise(async (resolve, reject) => {
      console.log(domain, domainlist[domain]);
      let id = domainlist[domain]
      if (id) {
        await addDynamicRule(id, domain);
      }
      resolve();
    }))
  })

  Promise.all(promises).then(() => {
    console.log("Finished that much...")
    chrome.declarativeNetRequest.getDynamicRules((res) => {
      console.log("Current dyn rules", res);
    })
  })
}