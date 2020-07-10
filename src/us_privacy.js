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
  (Unchecked runtime.lastError: No host permissions for cookies at url: 
    "chrome://extensions/".)
- Error: (Unchecked runtime.lastError: Failed to parse or set cookie named 
    "us_privacy".)
- Once you set a cookie, create a listener that checks
  if the cookie is modified, and check it agains the last
  version sent for a "server response" (ie. is it '1---'),
  then form a UI response for the user.

                    ----- Done -----
- Implemented check for different versions with iab_vars in `us_privacy.js`,
  (though not with a JSON)
- Have it respond if a cookie exists and parse it (though doesn't update 
    the cookie name)

                  ----- Parsing JSON -----
- Honestly, parsing JSON for this might be too roundabout
  I will implement it later
-!- Create something that pulls the data in when the extension is refreshed,
    right into `iab_vars`

                ----- Prev. Attempts -----
- push a cookie with HTTP headers
*/

iab_vars = [  // Make this not case-sensitive
  "usprivacy",
  "us-privacy",
  "us_privacy"
]
default_name = 'us_privacy'
default_value = '1NYN'

/**
 * Initializes the IAB proposal for CCPA Opt-Out functionality
 * via a `us_privacy` first-party cookie
 * Pulls data about the current tab and intializes the cookie-set process
 */
function initUSP() {

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
 * Collects all cookies with variations of the IAB `us_privacy`
 * cookie, and handles them according to how many exist
 * @param {string} url - url of the current tab
 */
function checkExistsAndHandleUSP(url) {
  var cookie_matches = []

  chrome.cookies.getAll({
    "url": url
  }, 
  function (cookie_arr) {
    // fetchAndHandleJSON('iab_cookies.json');
    console.log("cookie_arr: ", cookie_arr)
    for (var cookie in cookie_arr) {
      console.log("iterating...", cookie_arr[cookie]["name"]);
      if ( iab_vars.includes(cookie_arr[cookie]["name"]) ){
        console.log("An iab variation exists!!!")
        storeURLforDev(cookie_arr[cookie]["domain"])
        cookie_matches.push(cookie_arr[cookie])
      }
    }

    // Now we have an array of all the cookie matches.
    if (cookie_matches.length === 1) {
      value = parseUSP(cookie_matches[0]["value"])
      if (value == '1---') {
        console.log("This site recognized you are outside of \
the domain of the CCPA.")
      } else {
        updateUSP(cookie_matches[0], value, url);
      }
    }
    if (cookie_matches.length === 0) {
        updateUSP(null, '1NYN', url);
    }
    // If there are multiple cookies, handle here.
    // Currently deletes default cookie
    if (cookie_matches.length > 1) {
      console.log("MULTIPLE COOKIES EXIST!")
      for (var c in cookie_matches) {
        if (cookie_matches[c].name == default_name && 
          cookie_matches[c].domain.substr(0,1) !== ".") 
        {
          console.log("initializing delete cookie...")
          deleteCookie(url, cookie_matches[c].name)
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
function updateUSP(cookie, value, url) {
  // Maybe check to see if current_domain === origin_domain
  // Also try chrome.cookies.getAll() to check all windows?

  // chrome.cookies.get({ 
  //   "name": 'us_privacy', // Make this not case-sensitive
  //   "url": url
  // }, 
  // function (cookie) {
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


  /*
    Here maybe I could just pass in the whole cookie, and
    have make cookie just update the cookie values. 
  */
  let new_cookie = {}

  if (cookie === null) {
    new_cookie = makeCookieUSP(default_name, default_value, url)
  } else {
    new_cookie = pruneCookieUSP(cookie, value, url)
  }
  console.log("Updated cookie to be set: ", new_cookie)
  chrome.cookies.set(
    new_cookie, 
    function (details) {
      console.log("Created new cookie.")
    }
  )
    // }
  // })
}

/**
 * Parses a IAB cookie value given one exists, and updates
 * it according to its current value
 * @param {string} signal - the value of an IAB cookie. Example: `1YNN`. 
 * @return {string} - Updated IAB value to be set
 */
function parseUSP(signal) {
  console.log("parsing signal: ", signal)
  if (!isValidSignalUSP(signal)) {
    console.log('Existing domain is not Valid! Updating signal to \
                valid form...')
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
 * "Prunes" the values a retrieved cookie has set that a cookie
 * "to-be-set" cannot have. Also updates the value and url according
 * to the passed in values. 
 * @param {object} cookie - Cookie to be "pruned"
 * @param {string} value - value the updated cookie should have
 * @param {string} url - url the updated cookie should have
 * @return {object} - updated cookie to be returned
 */
function pruneCookieUSP(cookie, value, url) {
  console.log("cookie pruning: ", cookie)
  cookie.value = value
  cookie.url = url
  console.log("Prune cookie domain: ", cookie.domain)
  // Checks if a cookie made by a site is stored per domain/subdomain
  if (cookie.domain.substr(0,1) !== '.') {
    console.log("Domain to be pruned starts with '.'")
    cookie.domain = null;
  }
  if (cookie.hostOnly !== null) {
    delete cookie.hostOnly
  }
  if (cookie.session !== null) {
    delete cookie.session
  }
  console.log("Pruned cookie: ", cookie)
  return cookie
}

/**
 * Constructs a new cookie per the IAB spec
 * @param {string} url - The url the cookie should be assigned
 * @return {Object} - new IAB cookie
 */
function makeCookieUSP(name, value, url) {
  var time = new Date()
  var now = time.getTime()
  console.log("now ", now)

  let cookie = {}
  cookie.expirationDate = now/1000 + 31557600
  // cookie.domain = domain
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
  }, function(details) {
    if (details === null) {
      console.log("Delete failed.")
    } else {
      console.log("Successfully deleted cookie.")
    }
  })
}

/**
 * IAB spec V.1:
 * Checks if a given `us_privacy` signal is valid
 * @param {string} signal - `us_privacy` string
 * @returns {bool} - Represents if signal is a valid signal
 */
function isValidSignalUSP(signal) {
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

/**
 * Stores the url, assuming a IAB cookie was found by the extension,
 * to a special location for debuggin purposes. 
 * --- TO BE REMOVED IN FINAL VERSION --- 
 * @param {string} url - url to be stored
 */
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

/* 
Proposed JSON file handling for IAB signal variations
*/

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
// // Add error cases - 
// // https://stackoverflow.com/questions/47267221/fetch-response-json-and
        // -response-status
//       response.json().then(json => 
//         {
//           console.log("JSON: ", json)
//           // fun(json)
//         })
//     }
//   )
// }

/**
 * Initializes the "IAB" object in the local storage
 * for debugging purposes
 */
chrome.storage.local.get(["IAB"], function (
  result
) {
  if (result.IAB == undefined) {
    chrome.storage.local.set({ IAB: {} });
  }
});