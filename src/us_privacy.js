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
                    ----- To-Do -----
- Add some kind of check to stop the cookie from being updated
  more than once per site refresh.
- Think about how we will disable the feature if a certain site is 
  "unwhitelisted" specifically
- Make sure that if a cookie exists, you are updating the specific version
  that the site has
- Create a check that checks for mulitiple copies of the cookie, 
  say if `usprivacy` and `us_privacy` exists, you want to keep the one
  that we did NOT add in, i.e. keep `usprivacy`. 
- Implement a UI feature to note if a site says youre 'outside of California'
- We have the issue of cookies being sent to sites that don't really
  need them, i.e. 'chrome://...' sites and our background/'options.html'
  pages, so we need to filter this out. 
  (Unchecked runtime.lastError: No host permissions for cookies at url: "chrome://extensions/".)
- Error: (Unchecked runtime.lastError: Failed to parse or set cookie named "us_privacy".)

                    ----- Done -----
- Implemented check for different versions with iab_vars in `us_privacy.js`,
  (though not with a JSON)
- Have it respond if a cookie exists and parse it (though doesn't update the cookie name)

                  ----- Parsing JSON -----
- Honestly, parsing JSON for this might be too roundabout
  I will implement it later
-!- Create something that pulls the data in when the extension is refreshed,
    right into `iab_vars`

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

iab_vars = [
  "usprivacy",
  "us-privacy",
  "us_privacy"
]
cookie_exists = false
usp_cookie = {}

/**
 * Updates `us_privacy` cookie with user option
 * Checks if there are multiple 
 * @param {Object} details - 
 */
function initUSP(details) {
  usp_cookie = {}

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    console.log("tabs: ", tabs)
    if (tabs[0] != undefined && tabs[0].url != undefined) {
      var tab = tabs[0];
      var url_obj = new URL(tab.url);
      var parsed = psl.parse(url_obj.hostname)
      var domain = parsed.domain;
      var url = url_obj.origin + '/'

      checkExistsAndHandleUSP(url, domain);
    }
  })
}

/**
 * This will assume there is only ONE cookie;
 * once it finds one, it assumes it is the only one.
 * 
 * STRUCTURE: fetch iab_cookies.json, and then chain
 * to another function that handles the promise
 * @param {string} url - location of JSON files
 */
function checkExistsAndHandleUSP (url, domain) {
  chrome.cookies.getAll({
    "url": url
  }, 
  function (cookie_arr) {
    // fetchAndHandleJSON('iab_cookies.json');
    console.log("cookie_arr: ", cookie_arr)
    cookie_exists = false
    for (var cookie in cookie_arr) {
      console.log("iterating...", cookie_arr[cookie]["name"]);
      if ( iab_vars.includes(cookie_arr[cookie]["name"]) ){
        console.log("An iab variation exists!!!")
        storeURLforDev(cookie_arr[cookie]["domain"])
        cookie_exists = true
        usp_cookie = cookie_arr[cookie]
        // return
      }
    }
    console.log("cookie_exists: ", cookie_exists)
    if (cookie_exists) {
      // value = 'EXISTS'
      value = parseUSP(usp_cookie["value"])
      if (value == '1---') {
        console.log("This site recognized you are outside of the domain of the CCPA.")
      } else {
        updateUSP(url, domain, value);
      }
    } else {
      updateUSP(url, domain, '1NNN');
    }
  })
}

function storeURLforDev(url) {
  chrome.storage.local.get(["IAB"], 
  function (result) {
    var iab = result.IAB
    if (iab[url] === undefined) {
      iab[url] = false
      chrome.storage.local.set({"IAB": iab});
      console.log("Stored current iab website");
    } 
  })
}

// function handleExistsUSP (json) {
//   iab_vars = json["iab"]
//   console.log("iab_vars", iab_vars)
//   if 
// }

// /**
//  * 
//  * @param {string} location - Location/name of the JSON to be fetched
//  * @return {Object} Data inside JSON object
//  */
// function fetchAndHandleJSON(location) {
//   return fetch(location)
//   .then(
//     response => {
//       console.log('Retrieved iab cookie JSON!')
//       // Add error cases - 
//       // https://stackoverflow.com/questions/47267221/fetch-response-json-and-response-status
//       response.json().then(json => 
//         {
//           console.log("JSON: ", json)
//           // fun(json)
//         })
//     }
//   )
// }
  
/**
 * -----INCOMPLETE-----
 * but semi functioning
 * @param {*} url_obj 
 * @param {*} domain 
 */
function updateUSP (url, domain, value) {
  // Maybe check to see if current_domain === origin_domain
  // Also try chrome.cookies.getAll() to check all windows?

  chrome.cookies.get({ 
    "name": 'us_privacy', // Make this not case-sensitive
    "url": url
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
    //   new_cookie.url = url
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
        makeCookieUSP(url, value), 
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
 * @return {string} - Updated signal
 */
function parseUSP (signal) {
  console.log("parsing signal: ", signal)
  if (!isValidSignalUSP(signal)) {
    console.log('Existing domain is not Valid! Updating signal to valid form...')
    return '1NYN'
  }
  if (signal === '1---') {
    return '1---'
  } else {
    signal = signal.substr(0,2) + 'Y' + signal.substr(3, 1)
    console.log("Updated signal before push: ", signal)
    return signal
  }
}

/**
 * Constructs a new `us_privacy` cookie
 * @param {string} url - The url the cookie should be assigned
 * @return {Object} `us_privacy` cookie
 */
function makeCookieUSP(url, value) {
  var time = new Date()
  var now = time.getTime()
  console.log("now ", now)

  let cookie = {}
  cookie.expirationDate = now/1000 + 31557600
  cookie.url = url;
  cookie.name = 'us_privacy'
  cookie.value = value
  return cookie
}

/**
 * Checks if a given `us_privacy` signal is valid for verion '1'
 * @param {string} signal - `us_privacy` string
 * @returns {bool} Represents if signal is a valid signal
 */
function isValidSignalUSP (signal) {
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

chrome.storage.local.get(["IAB"], function (
  result
) {
  if (result.IAB == undefined) {
    chrome.storage.local.set({ IAB: {} });
  }
});