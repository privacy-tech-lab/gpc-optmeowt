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


export async function handleDownload() {
    console.log("Downloading ...");
    chrome.storage.local.get(["DOMAINS"], function (result) {
      var domains = result.DOMAINS;
      var blob = new Blob([JSON.stringify(domains, null, 4)], 
                          {type: "text/plain;charset=utf-8"});
      saveAs(blob, "whitelist_backup.txt");
    })
    console.log("Downloaded!")
}

export async function startUpload() {
  document.getElementById("upload-whitelist").value = ""
  document.getElementById("upload-whitelist").click()
}

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

// Sets DOMAINS[urlKey] to true
export async function addToWhitelist(urlKey) {
  var new_domains = [];
  chrome.storage.local.get(["DOMAINS"], function (result) {
    new_domains = result.DOMAINS;
    new_domains[urlKey] = true;
    chrome.storage.local.set({ DOMAINS: new_domains });
  }); 
  console.log(urlKey, ", Added to whitelist.")
}

// Sets DOMAINS[urlKey] to false
export async function removeFromWhitelist(urlKey) {
  var new_domains = [];
  chrome.storage.local.get(["DOMAINS"], function (result) {
    new_domains = result.DOMAINS;
    new_domains[urlKey] = false;
    chrome.storage.local.set({ DOMAINS: new_domains });
  });
  console.log(urlKey, ", Removed from whitelist.")
}

// Removes DOMAINS[urlKey] from DOMAINS
export async function permRemoveFromWhitelist(urlKey) {
  var new_domains = [];
  chrome.storage.local.get(["DOMAINS"], function (result) {
    new_domains = result.DOMAINS;
    delete new_domains[urlKey]
    chrome.storage.local.set({ DOMAINS: new_domains });
  });
}

//////////////////////////////////////////////////////////////////////////

// elementId: (string) representing element to grab by ID
// domain: (string) representing domain to link toggle to in backend
// Creates an event listener to toggle a given element ID corresponding to a domain
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