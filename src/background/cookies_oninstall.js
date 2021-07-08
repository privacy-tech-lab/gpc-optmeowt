/*
OptMeowt is licensed under the MIT License
Copyright (c) 2020 Kuba Alicki, Daniel Knopf, Abdallah Salia, Sebastian Zimmeck
privacy-tech-lab, https://privacytechlab.org/
*/


/*
cookies_oninstall.js
================================================================================
cookies_oninstall.js fetches all files mentioned in cookieJSONS, retrieves
their respective cookies (custom & 3rd party), and places them.
*/


import { cookies_daa } from "../data/cookies_daa.js"
import { cookies_usercustom } from "../data/cookies_usercustom.js"


(() => {
  setAllCookies(cookies_daa)
  setAllCookies(cookies_usercustom)
})();

/**
 * Sets a cookie at the given domain for each cookie in the passed in
 * cookies object. Currently updates cookie url info based on domain.
 * @param {Object} cookies - Collection of info regarding each 3rd
 *                           party cookie to be set
 * Each cookie in `cookies` must contain a 'name', 'value', and 'domain'
 */
function setAllCookies(cookies) {
  // Updates the time once for all new cookies
  let date = new Date()
  let now = date.getTime()
  let cookieTime = now/1000 + 31557600
  let path = '/'

  for (let cookieKey in cookies) {
    // Updates cookie url based on its domain, checks for domain/subdomain spec
    let cookieUrl = cookies[cookieKey].domain
    let allDomainsFlag = false

    if (cookieUrl.substr(0,1) === '.') {
      cookieUrl = cookieUrl.substr(1)
      allDomainsFlag = true
    }
    cookieUrl = `https://${cookieUrl}/`

    // Updates cookie path
    if (cookies[cookieKey].path !== null) {
      path = cookies[cookieKey].path
    } else {
      path = '/'
    }

    // Sets new cookie properties
    let newCookie = {
      url: cookieUrl,
      name: cookies[cookieKey].name,
      value: cookies[cookieKey].value,
      expirationDate: cookieTime,
      path: path
    }

    if (allDomainsFlag) {
      newCookie["domain"] = cookies[cookieKey].domain
    }

    // Sets cookie
    chrome.cookies.set(newCookie, (result) => {})
  }
}