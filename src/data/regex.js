/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://www.privacytechlab.org/
*/


/*
regex.js
================================================================================
regex.js keeps track of all the regular expressions we will use throughout the 
extension in multiple locations
*/


// This regex requires at least one of (do not|don't), (sell), & (information|info|data)
// OR a notice of the form "California Resident - Do Not Sell"
export const doNotSellPhrasing = new RegExp([
	/((California|CA).?Resident).{0,10}((Do.?Not|Don.?t).?Sell)|/,
	/(Do.?Not|Don.?t).?Sell.?(My)?.?(Personal)?.?(Information|Info|Data)/,
  ].map(r => r.source).join(''), "gmi");

export const uspPhrasing = /(us(-|_|.)?privacy)/gmi
export const uspCookiePhrasing = /(us(-|_)?privacy)/gmi
export const uspCookiePhrasingList = ["us_privacy", "us-privacy", "usprivacy"];

// Do Not Sell - Cookie variations
export const cookiesPhrasing = new RegExp([
	/(us-?_?privacy)|/,
	/(OptanonConsent)/
  ].map(r => r.source).join(''), "gmi");