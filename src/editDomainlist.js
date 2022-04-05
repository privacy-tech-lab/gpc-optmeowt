

// initDomainlist
// getDomainFromId
// getIdFromDomain
// removeRule(id)
// removeDOmain(domain)	// implicitly remove rule if it exists
// addDomain(domain)	// No ID
// removeDomainRule(domain)	// only remove domain rule
// removerule(id)	// (don't really need id...)
// addRule(domain, id)	// implicitly fresh id

// ruleIds = {
// 	"1": "duck.com"
// }

// domainlist = { 	// Make this the same as the old domainlist but instead of bool, we make it a number
// 	"duck.com": 465 || null : (number|null)
// }

import { storage, stores } from './background/storage';
import { deleteAllDynamicRules, deleteDynamicRule, addDynamicRule, getFreshId } from './editRules';

export async function debugDomainlistAndRules() {
	let sampleSites = ['a.com','b.com','c.com','d.com','e.com','f.com','g.com','h.com','i.com','j.com']
	await deleteDomainlistAndDynamicRules();
	await print_rules_and_domainlist();
	addDynamicRule(2, "nytimes.com");                         // add the rule for the chosen domain
	await storage.set(stores.domainlist, 2, 'nytimes.com');   // record what rule the domain is associated to
  
	await print_rules_and_domainlist();
	console.log("BREAK");
	await addDomainToDomainlistAndRules('a.com');
	await addDomainToDomainlistAndRules('b.com');
	await addDomainToDomainlistAndRules('c.com');
	await addDomainToDomainlistAndRules('d.com');
	await addDomainToDomainlistAndRules('e.com');
	await addDomainToDomainlistAndRules('f.com');
	await addDomainToDomainlistAndRules('g.com');
	await addDomainToDomainlistAndRules('h.com');
	await addDomainToDomainlistAndRules('i.com');
	await addDomainToDomainlistAndRules('j.com');
	console.log("BREAK 2");
	await print_rules_and_domainlist();
}

// addToDomainlistAndRules
// removeFromDomainlistAndRules

async function deleteDomainlistAndDynamicRules() {
	await storage.clear(stores.domainlist);
	deleteAllDynamicRules();
}
  
async function addDomainToDomainlistAndRules(domain) {
	let id = await getFreshId();
	addDynamicRule(id, domain);                         // add the rule for the chosen domain
	await storage.set(stores.domainlist, id, domain);   // record what rule the domain is associated to
}
  
// removeDomainFromRules
  
async function print_rules_and_domainlist() {
	let rules = await chrome.declarativeNetRequest.getDynamicRules();
	let domainlist = await storage.getStore(stores.domainlist);
	console.log(
		"Here are the curr dynamic rules:", rules,
	  	"Here is our curr domainlist: ", domainlist
	);
}
