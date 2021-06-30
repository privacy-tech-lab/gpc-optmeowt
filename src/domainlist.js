/*
OptMeowt is licensed under the MIT License
Copyright (c) 2020 Kuba Alicki, Daniel Knopf, Abdallah Salia, Sebastian Zimmeck
privacy-tech-lab, https://privacytechlab.org/
*/


/*
domainlist.js
================================================================================
domainlist.js handles OptMeowt's reads/writes to the domainlist in the local
browser storage
*/


/**
 * Exports the domainlist in local storage as a .txt file
 */
export async function handleDownload() {
    //("Downloading ...");
    chrome.storage.local.get(["DOMAINS"], function (result) {
      var DOMAINS = result.DOMAINS;
      var blob = new Blob([JSON.stringify(DOMAINS, null, 4)],
                          {type: "text/plain;charset=utf-8"});
      saveAs(blob, "OptMeowt_backup.json");
    })
    //console.log("Downloaded!")
}

/**
 * Sets-up the process for importing a saved domainlist backup
 */
export async function startUpload() {
  document.getElementById("upload-domainlist").value = ""
  document.getElementById("upload-domainlist").click()
}

/**
 * Imports and updates the domainlist in local storage with an imported backup
 */
export async function handleUpload() {
    //console.log("Starting upload ...");
    const file = this.files[0];
    const fr = new FileReader();
    fr.onload = function(e) {
      chrome.storage.local.set({ DOMAINS: JSON.parse(e.target.result) });
      //("Finished upload!")
    };
    fr.readAsText(file);
}

//////////////////////////////////////////////////////////////////////////

export function sendMsgUpdateDomainlist() {
  chrome.runtime.sendMessage({
    msg: "FETCHDOMAINLISTFROMSTORAGE",
    data: null
  })
}

/**
 * Sets DOMAINS[domainKey] to true
 * @param {string} domainKey - domain to be changed in domainlist
 */
export async function addToDomainlist(domainKey) {
  var new_domains = [];
  chrome.storage.local.get(["DOMAINS"], function (result) {
    new_domains = result.DOMAINS;
    new_domains[domainKey] = true;
    addDomainCookies(domainKey)
    chrome.storage.local.set({ DOMAINS: new_domains });
    sendMsgUpdateDomainlist()
  });
  //console.log(domainKey, ", Added to domainlist.")
}

/**
 * Sets DOMAINS[domainKey] to false
 * @param {string} domainKey - domain to be changed in domainlist
 */
export async function removeFromDomainlist(domainKey) {
  var new_domains = [];
  chrome.storage.local.get(["DOMAINS"], function (result) {
    new_domains = result.DOMAINS;
    new_domains[domainKey] = false;
    deleteDomainCookies(domainKey)
    chrome.storage.local.set({ DOMAINS: new_domains });
    sendMsgUpdateDomainlist()
  });
  //(domainKey, ", Removed from domainlist.")
}

/**
 * Removes DOMAINS[domainKey] from DOMAINS
 * @param {string} domainKey - domain to be changed in domainlist
 */
export async function permRemoveFromDomainlist(domainKey) {
  var new_domains = [];
  chrome.storage.local.get(["DOMAINS"], function (result) {
    new_domains = result.DOMAINS;
    delete new_domains[domainKey]
    deleteDomainCookies(domainKey)
    chrome.storage.local.set({ DOMAINS: new_domains });
    sendMsgUpdateDomainlist()
  });
}

//////////////////////////////////////////////////////////////////////////

/**
 *
 * @param {*} elementId
 * @param {*} domain
 */
function addDomainCookies(domainKey) {
  // var domainFilter;
  if (domainKey.substr(0,1) === '.') {
    var domainFilter = [domainKey.substr(1), domainKey, `www${domainKey.substr(1)}`]
  } else if (domainKey.substr(0,1) === 'w') {
    var domainFilter = [domainKey.substr(3), domainKey.substr(4), domainKey]
  } else {
    var domainFilter = [domainKey, `.${domainKey}`, `www.${domainKey}`]
  }

  chrome.runtime.sendMessage({
    msg: "FETCHCOOKIES",
    data: domainFilter,
  });
}

/**
 *
 * @param {*} elementId
 * @param {*} domain
 */
function deleteDomainCookies(domainKey) {
  var cookie_arr = []
  chrome.cookies.getAll({ "domain": `${domainKey}` }, function(cookies) {
    cookie_arr = cookies
    //console.log(`Retrieved ${domainKey} cookies: ${cookies}`)
    for (let i in cookie_arr) {
      //(`Cookie #${i}: ${cookie_arr[i]}`)
      chrome.cookies.remove({
        "url": `https://${domainKey}/`,
        "name": cookie_arr[i].name
      }, function(details) {
        if (details === null) {
          //console.log("Delete failed.")
        } else {
          //console.log("Successfully deleted cookie.")
        }
      })
      chrome.cookies.remove({
        "url": `https://www.${domainKey}/`,
        "name": cookie_arr[i].name
      }, function(details) {
        if (details === null) {
          //console.log("Delete failed.")
        } else {
          //console.log("Successfully deleted cookie.")
        }
      })
    }
  });

}

//////////////////////////////////////////////////////////////////////////

/**
 * Generates the HTML that will build the domainlist switch for a given
 * domain in the domainlist
 * @param {string} domain - Any given domain
 * @param {bool} bool - Represents whether it is domainlisted or not
 * @return {string} - The stringified checkbox HTML compontent
 */
export function buildToggle(domain, bool) {
  let toggle;
  if (bool) {
    // checkbox = `<input type="checkbox" id="select ${domain}"
    //           class="check text-color dark-checkbox" checked />`;
    toggle = `<input type="checkbox" id="${domain}" checked />`;
  } else {
    // checkbox = `<input type="checkbox" id="select ${domain}"
    //           class="check text-color dark-checkbox"/>`;
    toggle = `<input type="checkbox" id="${domain}" />`;
  }
  return toggle
}

/**
 * Creates an event listener that toggles a given domain's stored value in
 * the domainlist if a user clicks on the object with the given element ID
 * @param {string} elementId - HTML element to be linked to the listener
 * @param {string} domain - domain to be changed in domainlist
 */
export async function toggleListener(elementId, domain) {

  document.getElementById(elementId).addEventListener("click", () => {
    chrome.storage.local.set({ ENABLED: true, DOMAINLIST_ENABLED: true });
    chrome.storage.local.get(["DOMAINS"], function (result) {
      if (result.DOMAINS[domain]) {
        removeFromDomainlist(domain);
      } else {
        addToDomainlist(domain);
      }
    })
  })

}
