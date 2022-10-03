//import { storage, stores } from '../background/storage'; // might be unneeded

/* commented out for testing
import {
    addDomainToDomainlistAndRules
  } from "../../../common/editDomainlist.js";

test('add Domain to Domainlist and Rules', async() => {
    const domainAdd = await addDomainToDomainlistAndRules(nytimes.com);
    expect(domainAdd).resolves.not.toThrow();
}
);
*/

/* The addDomainToDomainlistAndRules function ends in an await for storage.set. The constant storage has an asynchronous function set that returns a promise. 
 * The promise is expected to resolve. This means storage.set returns resolve to addDomainToDomainlistAndRules which is also expected to resolve. This tests adding to domainlist.
 *
 * Still need to test for rules. Spy on addDynamicRule?
 *
 * To test if addDomainToDomainlistAndRules has gone wrong, a senario could be that if storage.set rejects? might be case if domain is false*/