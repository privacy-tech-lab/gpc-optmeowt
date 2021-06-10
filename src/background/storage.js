/*
OptMeowt is licensed under the MIT License
Copyright (c) 2020 Kuba Alicki, Daniel Knopf, Abdallah Salia, Sebastian Zimmeck
privacy-tech-lab, https://privacytechlab.org/
*/


/*
storage.js
================================================================================
storage.js handles OptMeowt's reads/writes of data to some local location
*/

function setToStorage(data) {
    chrome.storage.local.set(data, () => {})
}

function getFromStorage(key, func) {
    chrome.storage.local.get(key, (result) => func(result[key]))
}

export { setToStorage, getFromStorage }