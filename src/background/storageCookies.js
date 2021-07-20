/*
OptMeowt is licensed under the MIT License
Copyright (c) 2020 Kuba Alicki, Daniel Knopf, Abdallah Salia, Sebastian Zimmeck
privacy-tech-lab, https://privacytechlab.org/
*/


/*
storageCookies.js
================================================================================
storageCookies.js handles OptMeowt's reads/writes of cookies to some domain
*/

 
export const storageCookies = {

	async addCookiesForGivenDomain(domainKey) {
		let domainFilter;
		if (domainKey.substr(0,1) === '.') {
			domainFilter = [domainKey.substr(1), domainKey, `www${domainKey.substr(1)}`]
		} else if (domainKey.substr(0,1) === 'w') {
			domainFilter = [domainKey.substr(3), domainKey.substr(4), domainKey]
		} else {
			domainFilter = [domainKey, `.${domainKey}`, `www.${domainKey}`]
		}
	  
		// Since this can run anywhere (popup, settings, background), 
		// we must tell the background to set our correct optout cookies
		chrome.runtime.sendMessage({
			msg: "SET_OPTOUT_COOKEIS",
			data: domainFilter
		});
	  },

	async deleteCookiesForGivenDomain(domainKey) {
		let cookieArr = []
		chrome.cookies.getAll({ "domain": `${domainKey}` }, function(cookies) {
			cookieArr = cookies

			for (let i in cookieArr) {
				//(`Cookie #${i}: ${cookieArr[i]}`)
				chrome.cookies.remove({
					"url": `https://${domainKey}/`,
					"name": cookieArr[i].name
				}, function(details) {
					if (details === null) {
						//console.log("Delete failed.")
					} else {
						//console.log("Successfully deleted cookie.")
					}
				})
				chrome.cookies.remove({
					"url": `https://www.${domainKey}/`,
					"name": cookieArr[i].name
				}, function(details) {
					if (details === null) {
						//console.log("Delete failed.")
					} else {
						//console.log("Successfully deleted cookie.")
					}
				})
			}
		});
	  }

}