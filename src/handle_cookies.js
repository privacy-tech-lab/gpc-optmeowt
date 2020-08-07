/*
OptMeowt is licensed under the MIT License
Copyright (c) 2020 Kuba Alicki, David Baraka, Rafael Goldstein, Sebastian Zimmeck
privacy-tech-lab, https://privacy-tech-lab.github.io/
*/


/*
cookies_fetch.js
================================================================================
cookies_fetch.js updates fetches all files mentioned in cookieJSONS, retrieves 
the cookies there (custom & 3rd party), and sets them. 
*/


////////////////////////////////////////////////////////////////////////////////

const cookieJSONS = [
  "cookies_3p.JSON",
  "cookies_custom.JSON"
]

for (let loc in cookieJSONS) {
  console.log(cookieJSONS[loc])
  retrieveCookieJSON(cookieJSONS[loc], setAllRetrievedCookies)
}

////////////////////////////////////////////////////////////////////////////////

/// Sets all cookies from cookieJSONS on OptMeowt install

/**
 * Retrieves the cookie data stored in the 3rd_party_cookies json file
 * @param {string} location - Location/name of the JSON to be fetched
 * @return {Object} Data inside JSON object
 */
function retrieveCookieJSON(location, callback) {
  fetch(location)
  .then(response => { return response.json() })
  .then(json => {
    console.log(`Retrieved ${location}: ${json}`)
    callback(json)
  })
  .catch(e => console.log(`Failed while setting ${location} cookies: ${e}`))
}

/**
 * Sets a cookie at the given domain for each item in the passed in 
 * cookies object. Currently updates cookie url info based on domain.
 * @param {Object} cookies - Collection of info regarding each 3rd 
 *                           party cookie to be set
 * Each item in `cookies` must contain a 'name', 'value', and 'domain'
 */
function setAllRetrievedCookies(cookies) {
  // Updates time once
  var date = new Date()
  var now = date.getTime()
  var cookie_time = now/1000 + 31557600
  
  for (var item in cookies) {

    // Updates cookie url based on domain, checks for domain/subdomain spec
    let cookie_url = cookies[item].domain
    let all_domains = false
    if (cookie_url.substr(0,1) === '.') {
      cookie_url = cookie_url.substr(1)
      all_domains = true
    }
    cookie_url = `https://${cookie_url}/`
    console.log(`Current cookie url... ${cookie_url}`)

    // Sets cookie parameters
    let cookie_param = {
      url: cookie_url,
      name: cookies[item].name,
      value: cookies[item].value,
      expirationDate: cookie_time
    }
    if (all_domains) {
      cookie_param["domain"] = cookies[item].domain
    }

    // Sets cookie
    chrome.cookies.set(cookie_param, function (cookie) {
      console.log(`Updated ${cookie.name} cookie`)
    })

  }
}

////////////////////////////////////////////////////////////////////////////////

/// Functions for updating the cookie JSON files

function updateJSONandSetCookie(cookies, file) {
  console.log("Starting updateJSONandSetCookie...")
  setAllRetrievedCookies(cookies)
  addAllCookiesToStorage(cookies)
  // retrieveCookieJSON(file, function (json) {
    // console.log("updateJSONandSetCookie worked, here's JSON, ", json)
    // setNewJSON(json, cookies)
  // })
}

function addAllCookiesToStorage(cookies) {
  chrome.storage.local.get(["CUSTOM_COOKIES"], function (result) {
    var custom_cookies = result.CUSTOM_COOKIES;

    chrome.storage.local.set({"DOMAINS": domains})
  })
}

// updateJSONandSetCookie(data, "cookies_custom.JSON")

////////////////////////////////////////////////////////////////////////////////