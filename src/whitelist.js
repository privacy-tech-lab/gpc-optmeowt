/*
OptMeowt is licensed under the MIT License
Copyright (c) 2020 Kuba Alicki, David Baraka, Rafael Goldstein, Sebastian Zimmeck
privacy-tech-lab, https://privacy-tech-lab.github.io/
*/


/*
whitelist.js
================================================================================
whitelist.js handles OptMeowt's reads/writes to the local whitelist in the
browser storage
*/


/**
 * Exports the whitelist in local storage as a .txt file
 */
export async function handleDownload() {
    console.log("Downloading ...");
    chrome.storage.local.get(["DOMAINS", "CUSTOM_COOKIES"], function (result) {
      var DOMAINS = result.DOMAINS;
      var CUSTOM_COOKIES = result.CUSTOM_COOKIES
      var file = {
        CUSTOM_COOKIES,
        DOMAINS
      }
      
      var blob = new Blob([JSON.stringify(file, null, 4)], 
                          {type: "text/plain;charset=utf-8"});
      saveAs(blob, "OptMeowt_backup.txt");
    })
    console.log("Downloaded!")
}

/**
 * Sets-up the process for importing a saved whitelist backup
 */
export async function startUpload() {
  document.getElementById("upload-whitelist").value = ""
  document.getElementById("upload-whitelist").click()
}

/**
 * Imports and updates the whitelist in local storage with an imported backup
 */
export async function handleUpload() {
    console.log("Starting upload ...");
    const file = this.files[0];
    const fr = new FileReader();
    fr.onload = function(e) {
      chrome.storage.local.set({ DOMAINS: JSON.parse(e.target.result) });
      console.log("Finished upload!")
    };
    fr.readAsText(file);
}

//////////////////////////////////////////////////////////////////////////

/**
 * Sets DOMAINS[domainKey] to true
 * @param {string} domainKey - domain to be changed in whitelist 
 */
export async function addToWhitelist(domainKey) {
  var new_domains = [];
  chrome.storage.local.get(["DOMAINS"], function (result) {
    new_domains = result.DOMAINS;
    new_domains[domainKey] = true;
    chrome.storage.local.set({ DOMAINS: new_domains });
  }); 
  console.log(domainKey, ", Added to whitelist.")
}

/**
 * Sets DOMAINS[domainKey] to false
 * @param {string} domainKey - domain to be changed in whitelist 
 */
export async function removeFromWhitelist(domainKey) {
  var new_domains = [];
  chrome.storage.local.get(["DOMAINS"], function (result) {
    new_domains = result.DOMAINS;
    new_domains[domainKey] = false;
    chrome.storage.local.set({ DOMAINS: new_domains });
  });
  console.log(domainKey, ", Removed from whitelist.")
}

/**
 * Removes DOMAINS[domainKey] from DOMAINS
 * @param {string} domainKey - domain to be changed in whitelist 
 */
export async function permRemoveFromWhitelist(domainKey) {
  var new_domains = [];
  chrome.storage.local.get(["DOMAINS"], function (result) {
    new_domains = result.DOMAINS;
    delete new_domains[domainKey]
    chrome.storage.local.set({ DOMAINS: new_domains });
  });
}

//////////////////////////////////////////////////////////////////////////

/**
 * Creates an event listener that toggles a given domain's stored value in 
 * the whitelist if a user clicks on the object with the given element ID
 * @param {string} elementId - HTML element to be linked to the listener
 * @param {string} domain - domain to be changed in whitelist 
 */
export async function toggleListener(elementId, domain) {
  document.getElementById(elementId).addEventListener("click", () => {
    chrome.storage.local.get(["DOMAINS"], function (result) {
      if (result.DOMAINS[domain]) {
        removeFromWhitelist(domain);
      } else {
        addToWhitelist(domain);
      }
    })
  })
}