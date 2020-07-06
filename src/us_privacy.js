/*
OptMeowt is licensed under the MIT License
Copyright (c) 2020 Kuba Alicki, David Baraka, Rafael Goldstein, Sebastian Zimmeck
privacy-tech-lab, https://privacy-tech-lab.github.io/
*/


/*
us_privacy.js
================================================================================
us_privacy.js handles the IAB CCPA `us_privacy` proposal cookie 
modification process
*/


/*
                  ----- Dev Notes -----
- In the future, maybe try using `chorme.cookie.getAll()`
- Once you set a cookie, create a listener that checks
  if the cookie is modified, and check it agains the last
  version sent for a "server response" (ie. is it '1---'),
  then form a UI response for the user.

                ----- Prev. Attempts -----
- I have also tried
  `details.requestHeaders.push({ 
    name: "cookie", 
    value: "1NYN;path=/;domain=" + d + "" });`
  HTTP headers, but this one line didn't work so I shelved it. 

*/

/**
 * Updates `us_privacy` cookie with user option
 * Checks if there are multiple 
 * @param {Object} details - 
 */
function initUSPrivacyCookie(details) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    console.log("tabs: ", tabs)
    var tab = tabs[0];
    if (tab.url != undefined) {
      var url = new URL(tab.url);
      var parsed = psl.parse(url.hostname)
      var domain = parsed.domain;

    updateUSPrivacyCookie(url, domain);
    }
  })
}
  
/**
 * -----INCOMPLETE-----
 * but semi functioning
 * @param {*} url_obj 
 * @param {*} domain 
 */
function updateUSPrivacyCookie (url_obj, domain) {
  // Maybe check to see if current_domain === origin_domain
  // Also try chrome.cookies.getAll() to check all windows?

  chrome.cookies.get({ 
    "name": 'us_privacy', // Make this not case-sensitive
    "url": url_obj.origin + '/'
  }, 
  function (cookie) {
    /* 
      This next block of code was originally written with
      the assumption that this cookie call would check to 
      see if the cookie exists, and then modify it, but
      then only sites with this specific cookie already in 
      place at the moment this runs, would recieve a cookie.

      For testing purposes, it is commented out so that
      all sites recieve the dummy signal.
    */
    // if (cookie !== null) {
    //   console.log("COOKIE EXISTS")
    //   let new_cookie = cookie
    //   console.log("cookie: ", cookie)

    //   console.log("cookie domain is: ", cookie.domain)
    //   new_cookie.value = 'SUCCESS'
    //   new_cookie.url = url_obj.origin + '/'
    //   new_cookie.domain = null;
    //   if (new_cookie.hostOnly !== null) {
    //     delete new_cookie.hostOnly
    //   }
    //   if (new_cookie.session !== null) {
    //     delete new_cookie.session
    //   }
    //   console.log("new_cookie: ", new_cookie)
    //   chrome.cookies.set(new_cookie, function (details) {
    //       console.log("Found and updated cookie value.")
    //     })
    // } else {
      console.log("COOKIE NULL, creating new cookie")
      chrome.cookies.set(
        makeUSPrivacyCookie(url_obj.origin + '/'), 
        function (details) {
          console.log("Created new cookie.")
        }
      )
    // }
  })
}

/**
 * -----INCOMPLETE-----
 * @param {string} signal - 'us_privacy.value` from a cookie
 * @return {} 
 */
function parseUSPrivacySignal (signal) {
  if (signal.length != false) {
  }
}

/**
 * Constructs a new `us_privacy` cookie
 * @param {string} url - The url the cookie should be assigned
 * @return {Object} `us_privacy` cookie
 */
function makeUSPrivacyCookie(url) {
  var time = new Date()
  var now = time.getTime()
  console.log("now ", now)

  let cookie = {}
  cookie.expirationDate = now/1000 + 31557600
  cookie.url = url;
  cookie.name = 'us_privacy'
  cookie.value = ':)'
  return cookie
}

/**
 * Checks if a given `us_privacy` signal is valid for verion '1'
 * @param {string} signal - `us_privacy` string
 * @returns {bool} Represents if signal is a valid signal
 */
function isValidUSPrivacySignal (signal) {
  var valid_chars = ['y', 'n', 'Y', 'N']
  if (signal.length != 4) { 
    return false 
  }
  if (signal.charAt(0) !== '1') {
    return false
  }
  if (signal === "1---") {
    return true
  }
  if (!valid_chars.includes(signal.charAt(1))) {
    return false
  }
  if (!valid_chars.includes(signal.charAt(2))) {
    return false
  }
  if (!valid_chars.includes(signal.charAt(3))) {
    return false
  } 
  return true
}