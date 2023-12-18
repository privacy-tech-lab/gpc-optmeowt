/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://privacytechlab.org/
*/

/*
cookiesOnInstall.js
================================================================================
cookiesOnInstall.js fetches all files mentioned in cookieJSONS, retrieves
their respective cookies (3rd party), and places them.
*/

import { cookie_list } from "../../data/cookie_list.js";

function initCookiesOnInstall() {
  setAllCookies(cookie_list);
}

function initCookiesPerDomain(domainFilter) {
  setFilteredCookies(cookie_list, domainFilter);
}

function deleteCookiesPerDomain(domainFilter) {
  deleteFilteredCookies(cookie_list, domainFilter);
}

/**
 * Sets a cookie at the given domain for each cookie in the passed in
 * cookies object. Currently updates cookie url info based on domain.
 * @param {Object} cookies - Collection of info regarding each 3rd
 *                           party cookie to be set
 * Each cookie in `cookies` must contain a 'name', 'value', and 'domain'
 */
function setAllCookies(cookies) {
  // Updates the time once for all new cookies
  let date = new Date();
  let now = date.getTime();
  let cookieTime = now / 1000 + 31557600;
  let path = "/";

  for (let cookieKey in cookies) {
    // Updates cookie url based on its domain, checks for domain/subdomain spec
    let cookieUrl = cookies[cookieKey].domain;
    let allDomainsFlag = false;

    if (cookieUrl.substr(0, 1) === ".") {
      cookieUrl = cookieUrl.substr(1);
      allDomainsFlag = true;
    }
    cookieUrl = `https://${cookieUrl}/`;

    // Updates cookie path
    if (cookies[cookieKey].path !== null) {
      path = cookies[cookieKey].path;
    } else {
      path = "/";
    }

    // Sets new cookie properties
    let newCookie = {
      url: cookieUrl,
      name: cookies[cookieKey].name,
      value: cookies[cookieKey].value,
      expirationDate: cookieTime,
      path: path,
    };

    if (allDomainsFlag) {
      newCookie["domain"] = cookies[cookieKey].domain;
    }

    // Sets cookie
    chrome.cookies.set(newCookie, (result) => {});
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
  let date = new Date();
  let now = date.getTime();
  let cookieTime = now / 1000 + 31557600;
  let path = "/";

  for (let item in cookies) {
    for (let domain in domainFilter) {
      // Notice that this `if` will trigger only for sites mentioned in our
      // cookies, i.e. primarily only adtech websites since all our cookies
      // are adtech opt outs
      if (domainFilter[domain] == cookies[item].domain) {
        // Updates cookie url based on domain, checks for domain/subdomain spec
        let cookieUrl = cookies[item].domain;
        let allDomains = false;

        if (cookieUrl.substr(0, 1) === ".") {
          cookieUrl = cookieUrl.substr(1);
          allDomains = true;
        }
        cookieUrl = `https://${cookieUrl}/`;

        if (cookies[item].path !== null) {
          path = cookies[item].path;
        } else {
          path = "/";
        }

        // Sets cookie parameters
        let newCookie = {
          url: cookieUrl,
          name: cookies[item].name,
          value: cookies[item].value,
          expirationDate: cookieTime,
          path: path,
        };

        if (allDomains) {
          newCookie["domain"] = cookies[item].domain;
        }

        // Sets cookie
        chrome.cookies.set(newCookie, (result) => {});
      }
    }
  }
}

/**
 * Sets a cookie at the given domain for each item in the passed in
 * cookies object. Currently updates cookie url info based on domain.
 * @param {Object} cookies - Collection of info regarding each 3rd
 *                           party cookie to be set
 * Each item in `cookies` must contain a 'name', 'value', and 'domain'
 */
 function deleteFilteredCookies(cookies, domainFilter) {

  for (let item in cookies) {
    for (let domain in domainFilter) {
      // Notice that this `if` will trigger only for sites mentioned in our
      // cookies, i.e. primarily only adtech websites since all our cookies
      // are adtech opt outs
      if (domainFilter[domain] == cookies[item].domain) {
        // Deletes cookie url based on domain, checks for domain/subdomain spec
        let cookieUrl = cookies[item].domain;
        let name = cookies[item].name;

        chrome.cookies.remove({
          url: cookieUrl,
          name: name,
        });
      }
    }
  }
}

export {
  initCookiesOnInstall,
  initCookiesPerDomain,
  deleteCookiesPerDomain,
  setAllCookies,
  setFilteredCookies,
};
