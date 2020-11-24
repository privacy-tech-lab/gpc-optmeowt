/*
OptMeowt is licensed under the MIT License
Copyright (c) 2020 Kuba Alicki, Daniel Knopf, Abdallah Salia, Sebastian Zimmeck
privacy-tech-lab, https://privacytechlab.org/
*/


/*
cookie_lists_YAML.js
================================================================================
cookie_lists_YAML.js fetches all files mentioned in cookieYAMLS, retrieves
their respective cookies (custom & 3rd party), and places them.
*/


export const cookieJSONS = [
  "json/cookies_3p.JSON",
  "json/cookies_usercustom.JSON"
]

function checkCookieLists(callback, domainFilter) {
  for (let loc in cookieJSONS) {
    console.log(cookieJSONS[loc])
    retrieveCookieJSON(cookieJSONS[loc], callback, domainFilter)
  }
}

checkCookieLists(setAllCookies);

////////////////////////////////////////////////////////////////////////////////

/// Sets all cookies from cookieJSONS on OptMeowt install

/**
 * Retrieves the cookie data stored in the 3rd_party_cookies json file
 * @param {string} location - Location/name of the JSON to be fetched
 * @return {Object} Data inside JSON file in an object
 */
function retrieveCookieJSON(location, callback, domainFilter) {
  fetch(location)
  .then(response => {
    // console.log("Response before text(): ",response)
    return response.text()
  })
  .then(value => {
    console.log(`Retrieved ${location}`)
    var json = JSON.parse(value)
    var locname = location.substring(5, (location.length - 5))
    console.log("locname", locname)
    console.log(json)
    if (locname === "cookies_3p") {
      chrome.storage.local.set({ "THIRDPARTYCOOKIES": JSON.parse(value) })
    }
    if (locname === "cookies_usercustom") {
      chrome.storage.local.set({ "CUSTOMCOOKIES": JSON.parse(value) })
    }
    callback(json, domainFilter)
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
function setAllCookies(cookies) {
  // Updates time once
  var date = new Date()
  var now = date.getTime()
  var cookie_time = now/1000 + 31557600
  var path = '/'

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
    if (cookies[item].path !== null) {
      path = cookies[item].path
    } else {
      path = '/'
    }

    // Sets cookie parameters
    let cookie_param = {
      url: cookie_url,
      name: cookies[item].name,
      value: cookies[item].value,
      expirationDate: cookie_time,
      path: path
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


/**
 * Sets a cookie at the given domain for each item in the passed in
 * cookies object. Currently updates cookie url info based on domain.
 * @param {Object} cookies - Collection of info regarding each 3rd
 *                           party cookie to be set
 * Each item in `cookies` must contain a 'name', 'value', and 'domain'
 */
function setFilteredCookies(cookies, domainFilter) {
  // Updates time once
  var date = new Date()
  var now = date.getTime()
  var cookie_time = now/1000 + 31557600
  var path = '/'

  for (var item in cookies) {
    if (cookies[item].domain in domainFilter) {
      // Updates cookie url based on domain, checks for domain/subdomain spec
      let cookie_url = cookies[item].domain
      let all_domains = false
      if (cookie_url.substr(0,1) === '.') {
        cookie_url = cookie_url.substr(1)
        all_domains = true
      }
      cookie_url = `https://${cookie_url}/`
      console.log(`Current cookie url... ${cookie_url}`)
      if (cookies[item].path !== null) {
        path = cookies[item].path
      } else {
        path = '/'
      }

      // Sets cookie parameters
      let cookie_param = {
        url: cookie_url,
        name: cookies[item].name,
        value: cookies[item].value,
        expirationDate: cookie_time,
        path: path
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
}

////////////////////////////////////////////////////////////////////////////////
