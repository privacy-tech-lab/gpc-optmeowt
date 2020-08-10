/*
OptMeowt is licensed under the MIT License
Copyright (c) 2020 Kuba Alicki, David Baraka, Rafael Goldstein, Sebastian Zimmeck
privacy-tech-lab, https://privacy-tech-lab.github.io/
*/


/*
cookie_lists_YAML.js
================================================================================
cookie_lists_YAML.js fetches all files mentioned in cookieYAMLS, retrieves 
their respective cookies (custom & 3rd party), and places them.  
*/


import { YAML } from "../libs/yaml-1.10.0/index.js";

const cookieYAMLS = [
  "yaml/cookies_3p.YAML",
  "yaml/cookies_usercustom.YAML"
]

for (let loc in cookieYAMLS) {
  console.log(cookieYAMLS[loc])
  retrieveCookieYAML(cookieYAMLS[loc], setAllCookies)
}

////////////////////////////////////////////////////////////////////////////////

/// Sets all cookies from cookieYAMLS on OptMeowt install

/**
 * Retrieves the cookie data stored in the 3rd_party_cookies yaml file
 * @param {string} location - Location/name of the YAML to be fetched
 * @return {Object} Data inside YAML file in an object
 */
function retrieveCookieYAML(location, callback) {
  fetch(location)
  .then(response => { 
    // console.log("Response before text(): ",response)
    return response.text() 
  })
  .then(value => {
    console.log(`Retrieved ${location}`)
    var json = YAML.parse(value)
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

////////////////////////////////////////////////////////////////////////////////