/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://www.privacytechlab.org/
*/


/*
editDomainlist.js
================================================================================
editDomainlist.js is an internal API modifying the domainlist / modifying the
domainlist simultaneously with the dynamic ruleset
*/


import { storage, stores } from '../background/storage';
import { deleteAllDynamicRules, deleteDynamicRule, addDynamicRule, getFreshId } from './editRules';

// TODO: Migrate editRules & editDomainlist to one file


/***************************     FILE ROADMAP    ******************************/

/*
	Here are a few functions that are either implemented already or might be
	worthwhile to implement down the road (for adding things to the lists 
	individually, for clearing them on extension changes for reload, etc.)

	Go ahead and implement as needed. 
*/


/* # Standard Operation -- functions during domainlist lifetime */

// addDomainToDLDR
// removeDomainFromDLDR
// deleteDomainFromDLDR


/* # Big Operations -- generally for changing modes */

// deleteAllDynamicRules
// deleteAllFromDomainlist
// syncDynamicRulesFromDomainlist	// for domainlist uploads
// syncDomainlistFromDynamicRules


/* ~~Maybe~~ */

// getDomainFromId or queryDomain
// getIdFromDomain or queryId
// removeRule(id)
// removeDOmain(domain)	// implicitly remove rule if it exists
// addDomain(domain)	// No ID
// removeDomainRule(domain)	// only remove domain rule
// removerule(id)	// (don't really need id...)
// addRule(domain, id)	// implicitly fresh id


/* # Debugging */

// debug_domainlist_and_dynamicrules
// print_rules_and_domainlist



/******************************************************************************/
/******************************************************************************/
/**********                  # Standard Operation                    **********/
/******************************************************************************/
/******************************************************************************/

async function updateRemovalScript(){
  if ("$BROWSER" == 'chrome'){
	  
	let matches = ["https://example.org/foo/bar.html"]
	let domain;
	let domainValue; 
	const domainlistKeys = await storage.getAllKeys(stores.domainlist)
	const domainlistValues = await storage.getAll(stores.domainlist)
	for (let index in domainlistKeys) {
		domain = domainlistKeys[index]
		domainValue = domainlistValues[index]
		if (domainValue != null){
			matches.push("https://" + domain + "/*");
			matches.push("https://www." + domain + "/*");
		}
	}
		
		chrome.scripting.updateContentScripts([
			{
			"id": "2",
			"matches": matches,
			"js": ["content-scripts/registration/gpc-remove.js"],
			"runAt": "document_start"
			}
		])
	  .then(() => { })
	}
}

async function deleteDomainlistAndDynamicRules() {
	await storage.clear(stores.domainlist);
	if ("$BROWSER" == 'chrome'){
	deleteAllDynamicRules();
	}
}
  
async function addDomainToDomainlistAndRules(domain) {
	let id = 1;
	if ("$BROWSER" == 'chrome'){
	id = await getFreshId();
	addDynamicRule(id, domain);                         // add the rule for the chosen domain
	}
	await storage.set(stores.domainlist, id, domain);   // record what rule the domain is associated to
}

async function removeDomainFromDomainlistAndRules(domain) {
	if ("$BROWSER" == 'chrome'){
		let id = await storage.get(stores.domainlist, domain);
		deleteDynamicRule(id);
	}
	await storage.set(stores.domainlist, null, domain);

}


/******************************************************************************/
/******************************************************************************/
/**********                      # Debugging                         **********/
/******************************************************************************/
/******************************************************************************/


async function debug_domainlist_and_dynamicrules() {
	let sampleSites = ['a.com','b.com','c.com','d.com','e.com','f.com','g.com','h.com','i.com','j.com']
	await deleteDomainlistAndDynamicRules();
	await print_rules_and_domainlist();
	addDynamicRule(2, "nytimes.com");                         // add the rule for the chosen domain
	await storage.set(stores.domainlist, 2, 'nytimes.com');   // record what rule the domain is associated to
  
	await print_rules_and_domainlist();
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
	await print_rules_and_domainlist();
}

async function print_rules_and_domainlist() {
	let rules = await chrome.declarativeNetRequest.getDynamicRules();
	let domainlist = await storage.getStore(stores.domainlist);
	console.log(
		"Here are the curr dynamic rules:", rules,
	  	"Here is our curr domainlist: ", domainlist
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
	print_rules_and_domainlist
}
