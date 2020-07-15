/*
OptMeowt is licensed under the MIT License
Copyright (c) 2020 Kuba Alicki, David Baraka, Rafael Goldstein, Sebastian Zimmeck
privacy-tech-lab, https://privacy-tech-lab.github.io/
*/


/*
cookies_3p.js
================================================================================
cookies_3p.js updates the opt-out 3rd party cookies as specified in 
cookies_3p.json when the extension is loaded
*/


/**
 * Retrieves the cookie data stored in the 3rd_party_cookies json file
 * @param {string} location - Location/name of the JSON to be fetched
 * @return {Object} Data inside JSON object
 */
fetch("cookies_3p.json")
  .then(response => { return response.json() })
  .then(json => {
    console.log("Retrieved 3rd party cookies: ", json)
    handleThirdParties(json)
  })
  .catch(e => console.log(`Failed while setting 3rd party cookies: ${e}`))

/**
 * Sets a cookie at the given domain for each item in the passed in 
 * cookies object. Currently updates cookie url info based on domain.
 * @param {Object} cookies - Collection of info regarding each 3rd 
 *                           party cookie to be set
 * Each item in `cookies` must contain a 'name', 'value', and 'domain'
 */
function handleThirdParties(cookies) {
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
