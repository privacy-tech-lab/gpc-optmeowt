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


// In general, these functions should be use with async / await for 
// syntactic sweetness & synchronous data handling 
// i.e., await setToStorage({ ENABLED: true })


/**
 * Wrapper for storage implementation - use this in the extension
 * @param {object} data - data to be synced to storage
 * @returns resolved promise
 */
function setToStorage(data) {
    return new Promise ((resolve, reject) => {
        chrome.storage.local.set(data, (result) => {
            // error handling for promise
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message)
                reject(chorme.runtime.lastError.message)
            } else {
                resolve()
            }
        })
    })
}

/**
 * Wrapper for retrieving data from storage - use this in the extension
 * @param {string} key - name of data to be retrieved from storage
 * @returns resolved promise with requested data
 */
function getFromStorage(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(key, (items) => {
            // error handling for promise
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message)
                reject(chorme.runtime.lastError.message)
            } else {
                resolve(items[key])
            }
        })
    })
}


export { setToStorage, getFromStorage }