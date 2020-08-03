# OptMeowt Functionality 

> This document should outline OptMeowt's 'under-the-hood' functionality. This includes mechanisms implemented, functions used, how Do Not Sell signals are sent, and how responses are recieved and handled. 

## Big Picture

OptMeowt has three main systems for implementing our 5 Do Not Sell functionalities
1. Setting HTTP Headers (Do Not Sell and DNT)
2. Setting 1st party cookies (namely IAB `usprivacy` string)
3. Setting 3rd party cookies on OptMeowt install (based on the DAA Opt Out Tool cookies)
Custom headers/cookies use a combination of the above methods. 

These Do Not Sell signals are placed with two overarching systems
1. A'real time' functionality that updates our opt out request headers and 1st party opt out cookies before each request is finalized. 
2. An 'on install' functionality that runs and places 3rd party opt out cookies once. This does not run again afterwards.  

## (1) Real Time/Run-Always Functionality (Headers and 1st party cookeis)

This functionality is the 'main' OptMeowt function, and is what will be running in the backround most of the time since it reads placed cookies, writes opt outs if applicable, etc. all in the background of a user's web actions. 

If OptMeowt is enabled, a `chrome.webRequest.onBeforeSendHeaders` listener will be added in `enable()`. This listener, which will block a request before it is sent out to be modified by OptMeowt, will first check to see if a signal should be sent according to user options (via `updateDomainsAndSignal()`), and then will invoke `us_privacy.js` in order to run our 1st party cookie functionality as well as add both the DNT and Do Not Sell headers. Afterwards, it will unblock and send the request. 

***Overall Schema***
`webRequest.onBeforeSendHeaders`
=> `addHeaders` function
==> `updateDomainsAndSignal()` *(Checks if a signal should be sent)*
==> *If* a signal should be sent, call `initUSP()` from `us_privacy.js` *(Invokes 1st party cookie functionality)*
==> *If* a signal should be sent, push `DNT` and `DNS` request headers *(Header functionality)*
=> Unblock

***1st Party Cookies Schema***
`initUSP()`
=> `chrome.tabs.query( Retrieve current tab... , checkExistsAndHandleUSP(url) )`
==> `chrome.cookies.getAll( ... )`
==> *For* cookie in *cookie_arr*
===> *If* one cookie, check if `1---`
===> *If* no cookies, set default
===> *If* more than cookie, delete our default cookie


## (2) On Install/Run-Once Functionality (3rd party cookies)

On OptMeowt's install, this functionality will run once, and afterwards will not run again. Functionality to rerun or give users more options can be added in the future. 

On Install, OptMeowt fetches the 3rd party data we have collected from `cookies_3p.js` and loads it. When it finishes loading, then it calls `handleThirdParties(cookies)` and places all the cookies it retrieves. 

***3rd Party Cookies Schema***
`fetch("cookies_3p.json")`
=> `handleThirdParties(json)`
==> *For* item in *cookies*, `chrome.cookies.set( place 3p cookie here... )`


## Handling Responses

Currently, we have not yet implemented a specific functionality for accepting or parsing responses. This relates to issue #47 in regards to displaying when a publisher denies a request to opt out. 

As we flesh this out in regards to cookie responses and future response header functionality, we will reflect changes made here. 
