/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://www.privacytechlab.org/
*/


/*
cookiesIAB.js
================================================================================
cookiesIAB.js handles the IAB CCPA `usprivacy` proposal cookie
modification process
*/


/*
  ! Handle the case when the site recognizes you are outside of CA
  ! Handle the case of trying to add cookies on a chrome:// page  or browser://
  is the boolean for checking multipel cookies correct?


                    ----- To-Do -----
- Add some kind of check to stop the cookie from being updated
  more than once per site refresh.
- Think about how we will disable the feature if a certain site is
  "not in the domainlist" specifically
- Make sure that if a cookie exists, you are updating the specific version
  that the site has
- Create a check that checks for mulitiple copies of the cookie,
  say if `usprivacy` and `us_privacy` exists, you want to keep the one
  that we did NOT add in, i.e. keep `usprivacy`.
- Implement a UI feature to note if a site says youre 'outside of California'
- We have the issue of cookies being sent to sites that don't really
  need them, i.e. 'chrome://...' sites and our background/'options.html'
  pages, so we need to filter this out.
  (Unchecked runtime.lastError: No host permissions for cookies at url:
    "chrome://extensions/".)
- Error: (Unchecked runtime.lastError: Failed to parse or set cookie named
    "us_privacy".)
- Once you set a cookie, create a listener that checks
  if the cookie is modified, and check it agains the last
  version sent for a "server response" (ie. is it '1---'),
  then form a UI response for the user.
*/

let iabVars = [  // Make this not case-sensitive
  "usprivacy",
  "us-privacy",
  "us_privacy"
]
let defaultName = 'usprivacy'
let defaultValue = '1NYN'

/**
 * Initializes the IAB proposal for CCPA Opt-Out functionality
 * via a `us_privacy` first-party cookie
 * Pulls data about the current tab and intializes the cookie-set process
 */
export function initIAB() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs[0] != undefined && tabs[0].url != undefined) {
      var tab = tabs[0];
      var urlObj = new URL(tab.url);
      var url = urlObj.href;

      // Filter out chrome://* links as they are local
      if (url.substr(0,9).toLowerCase() !== 'chrome://') {
        checkExistsAndHandleIAB(url);
      }
    }
  })
}

/**
 * Collects all cookies with variations of the IAB `us_privacy`
 * cookie, and handles them according to how many exist
 * @param {string} url - url of the current tab
 */
function checkExistsAndHandleIAB(url) {
  let cookieMatches = []

  chrome.cookies.getAll({ "url": url }, function (cookieArr) {
    for (var cookie in cookieArr) {
      if ( iabVars.includes(cookieArr[cookie]["name"]) ){
        cookieMatches.push(cookieArr[cookie])
      }
    }

    // Now we have an array of all the cookie matches
    if (cookieMatches.length === 1) {
      let value = parseIAB(cookieMatches[0]["value"])
      updateIAB(cookieMatches[0], value, url);
    }
    if (cookieMatches.length === 0) {
        updateIAB(null, '1NYN', url);
    }
    // If there are multiple cookies, handle here.
    // Currently deletes default cookie
    if (cookieMatches.length > 1) {
      for (var c in cookieMatches) {
        if (cookieMatches[c].name == defaultName &&
          cookieMatches[c].domain.substr(0,1) !== ".")
        {
          deleteCookie(url, cookieMatches[c].name)
        }
      }
    }
  })
}

/**
 * If a cookie exists, it will be updated and set
 * If a cookie does not exist, it will be created then set
 * according to the IAB standards and the passed in values
 * @param {object} cookie - existing cookie to be updated
 * @param {string} value - value to be given to new cookie
 * @param {string} url - url to be set to new cookie
 */
function updateIAB(cookie, value, url) {
  let newCookie = {}

  if (cookie === null) {
    newCookie = makeCookieIAB(defaultName, defaultValue, url)
  } else {
    newCookie = pruneCookieIAB(cookie, value, url)
  }
  chrome.cookies.set( newCookie )
}

/**
 * Parses a IAB cookie value given one exists, and updates
 * it according to its current value
 * @param {string} signal - the value of an IAB cookie. Example: `1YNN`.
 * @return {string} - Updated IAB value to be set
 */
function parseIAB(signal) {
  if (!isValidSignalIAB(signal)) {
    return '1NYN'
  }
  if (signal === '1---') {
    return '1YYY'
  } else {
    signal = signal.substr(0,2) + 'Y' + signal.substr(3, 1)
    return signal
  }
}

/**
 * "Prunes" the values a retrieved cookie has set that a cookie
 * "to-be-set" cannot have. Also updates the value and url according
 * to the passed in values.
 * @param {object} cookie - Cookie to be "pruned"
 * @param {string} value - value the updated cookie should have
 * @param {string} url - url the updated cookie should have
 * @return {object} - updated cookie to be returned
 */
function pruneCookieIAB(cookie, value, url) {
  cookie.value = value
  cookie.url = url
  // Checks if a cookie made by a site is stored per domain/subdomain
  if (cookie.domain.substr(0,1) !== '.') {
    cookie.domain = null;
  }
  if (cookie.hostOnly !== null) {
    delete cookie.hostOnly
  }
  if (cookie.session !== null) {
    delete cookie.session
  }
  return cookie
}

/**
 * Constructs a new cookie per the IAB spec
 * @param {string} url - The url the cookie should be assigned
 * @return {Object} - new IAB cookie
 */
function makeCookieIAB(name, value, url) {
  var time = new Date()
  var now = time.getTime()

  let cookie = {}
  cookie.expirationDate = now/1000 + 31557600
  cookie.url = url;
  cookie.name = name
  cookie.value = value
  return cookie
}

/**
 * Deletes a given cookie
 * @param {string} url - url of cookie
 * @param {string} name - name of cookie
 */
function deleteCookie(url, name) {
  chrome.cookies.remove({
    "url": url,
    "name": name
  })
}

/**
 * IAB spec V.1:
 * Checks if a given `us_privacy` signal is valid
 * @param {string} signal - `us_privacy` string
 * @returns {bool} - Represents if signal is a valid signal
 */
export function isValidSignalIAB(signal) {
  var validChars = ['y', 'n', 'Y', 'N', '-']
  if (signal.length != 4) {
    return false
  }
  if (signal.charAt(0) !== '1') {
    return false
  }
  if (signal === "1---") {
    return true
  }
  if (!validChars.includes(signal.charAt(1))) {
    return false
  }
  if (!validChars.includes(signal.charAt(2))) {
    return false
  }
  if (!validChars.includes(signal.charAt(3))) {
    return false
  }
  return true
}

/******************************************************************************/
