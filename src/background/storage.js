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
    return new Promise ((resolve, reject) => {
        chrome.storage.local.set(data, (result) => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message)
                reject(chorme.runtime.lastError.message)
            } else {
                resolve()
            }
        })
    })
}

// function getFromStorage(key, callback) {
//         chrome.storage.local.get(key, (result) => callback(result[key]))
// }

// returns promise with info called from storage
// for use with async / await
// Make sure the data is not undefined pls 🥺
function getFromStorage(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(key, (items) => {
            // error handling for promise
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message)
                reject(chorme.runtime.lastError.message)
            } else {
                // Data retrieved successfully
                // if (items[key] != undefined) {
                    resolve(items[key])
                // } else {
                //     reject("Attempted data retrieval is undefined")
                // }
            }
        })
    })
}

export { setToStorage, getFromStorage }