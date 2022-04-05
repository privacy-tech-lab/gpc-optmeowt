/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://www.privacytechlab.org/
*/


/*
domainlist-rules.js
================================================================================
domainlist-rules.js handles adding and removing domains from the domainlist, as
well as manges handling the ids associated with each dynamic rule
*/


import { stores, storage } from './background/storage';

// TODO: Handle migrations from BOOL values to RULE : (number|null) values

/**
 * MODEL 1
 * 
 * const ruleIds = [
 *     {    // Implicitly element 0 (0 - 4999)
 *         'taken': true,
 *         'domain': 'duck.com'
 *     },
 *     . . .,
 *     {
 *         'taken': false,
 *         'domain': ''
 *     }
 * ]
 */


/**
 * MODEL 2
 * NOTE: 	For backwards compatability with the old domainlist model based on 
 * 			booleans, please add syntax to handle BOTH, especially when 
 * 			retrieving data. 
 * 
 * const domainlist = {
 *     'duck.com': 4511,			// Exception rule, no GPC (supports site)
 * 	   'google.com': null,			// Universal rule, sends GPC
 *     'doubleclick.net': null,		// Universal rule
 * 	   'nytimes.com': 329,			// Exception rule
 * }
 */



// /**
//  * Ensures ruleIds exists in localstorage
//  * If not, creates ruleIds in localstorage
//  */
// async function ensureRuleIdsExists() {
//   let maxIds = chrome.declarativeNetRequest.MAX_NUMBER_OF_DYNAMIC_AND_SESSION_RULES;
//   let result = await chrome.storage.local.get('ruleIds');
//   let ruleIds = result.ruleIds;
//   if (ruleIds.length === 0) {
//     let newRuleIdsComponent = {
//       'taken': false,
//       'domain': ''
//     };
//     let newRuleIds = [];
//     for (let i=0; i<maxIds; i++) {
//       newRuleIds.push(newRuleIdsComponent);
//     }
//     chrome.storage.local.set({ 'ruleIds': newRuleIds });
//   }
// }

// /**
//  * Gets fresh rule ID for new DeclarativeNetRequest dynamic rule
//  * @returns {(number|null)} - number of fresh ID, null if non available
//  *
//  * NOTE: ruleIds from localstorage takes the following form: 
//  * let ruleIds: Array<{ 'taken': bool, 'domain': string }>
//  */
// async function getFreshId() {
//   await ensureRuleIdsExists();
//   let result = await chrome.storage.local.get(['ruleIds']);
//   console.log('here is the result: ', result);
//   let ruleIds = result.ruleIds;
//   let freshId = null;

//   // for (let i=0; i<5000; i++) {
//   for (let i=0; i<ruleIds.length; i++) {
//     if (!ruleIds[i]['taken']) {
//       ruleIds[i]['taken'] = true;  // TODO: Have this sync to localstorage
//       ruleIds[i]['domain'] = '';
//       freshId = i;
//       break;
//     }
//   }
//   chrome.storage.local.set({ 'ruleIds': ruleIds });
//   return freshId;
// }

// /**
//  * Removes rule with id 'id' from localstorage
//  * @param {number} id - Id of dynamic rule to be removed
//  */
// async function freeId(id) {
//   await ensureRuleIdsExists();
//   let result = await chrome.storage.local.get('ruleIds');
//   let ruleIds = result.ruleIds;
//   ruleIds[id]['taken'] = false;
//   ruleIds[id]['domain'] = '';
//   chrome.storage.local.set({ 'ruleIds': ruleIds })
//   return
// }

// // getIdFromDomain
// // getDomainFromId
// // function in order to add domain with a new id
// function getDomainId() {  }
// function addDomain() {  }





/**
 * Gets fresh rule ID for new DeclarativeNetRequest dynamic rule
 * NOTE: Does not 'reserve' the ID. If it isn't used on the client side,
 * 		 getFreshId() will spit out the same val next call. 
 * @returns {(number|null)} - number of fresh ID, null if non available
 */
// export async function getFreshId() {
// 	const MAX_DYN_RULES = chrome.declarativeNetRequest.MAX_NUMBER_OF_DYNAMIC_AND_SESSION_RULES;
// 	let domainlist = await storage.getStore(stores.domainlist);
// 	console.log(chrome.declarativeNetRequest.getDynamicRules());
// 	let freshId = null;
// 	let usedRuleIds = [];

// 	// console.log("Domainlist before generating array:", domainlist);
// 	// 'reverse' the domainlist & sort to get all used DNR dynamic rule IDs 
// 	for (let key in domainlist) {
// 		// console.log(`key:${key}, domainlist[key]:${domainlist[key]}`);
// 		let id = domainlist[key];
// 		// console.log("id is: ", id);
// 		usedRuleIds.push(id);
// 	}
// 	// console.log("Unsorted ruleIds, ", usedRuleIds);
// 	usedRuleIds.sort();

// 	console.log("Here are the currently used rule IDs:", usedRuleIds);

// 	// Make sure the ID starts at 1 (I think 0 is reserved?)
// 	for (let i=1; i<MAX_DYN_RULES; i++) {
// 		if (i !== usedRuleIds[i]) {
// 			// We have found the first unused id
// 			freshId = i;
// 			break;
// 		}
// 	}
// 	return freshId;
// }



/******************************************************************************/
/******************************************************************************/

// export {
// 	getFreshId
// }
