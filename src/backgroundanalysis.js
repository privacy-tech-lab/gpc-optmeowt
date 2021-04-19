console.log("Compliance analysis mode loaded!");


//Privacy Opt-in Flags
let urlFlags = ['gdpr', //Values: 0, 1. General Data Protection Regulation EU
				'gdpr_consent', //URL-safe base64-encoded GDPR consent string. Only meaningful if gdpr=1
				'gdpr_pd', //0 / 1 (optional, default: 1). GDPR indicates no personal data in request if gdpr_pd=0
				'rdp', //Restrict Data Processing (Google framework)
				'us_privacy' //0, 1, or [privacy string] (?)
				//Look into:
				//MSRDP (??) flag
				];

let setFlags = [];	//Number of RDP flags which are truthy
let unsetFlags = [];//Number of RDP flgas which are falsy

urlFlags.forEach(flag => {
	setFlags[flag] = 0;
	unsetFlags[flag] = 0; }
)

//Finds DNS words in webpages.
//TODO: Check if words are in link
//TODO: Check for similar/noncompliant wording
async function checkForDNSLink(tabId, changeInfo, tabInfo){
	if (changeInfo.status != "complete") {return;}

	let dns_link = await browser.find.find("Do Not Sell", {tabId: tabId});
	console.log(dns_link.count + " dns link matches on page " + tabInfo.url);
}

//Checks if a value means true/false for a specific flag
//TODO: Figure out what different values mean for different flags.
function checkTruthy(flag, value){
	if(value != 0 && value != ""){
		return true;
	}
	return false;
}

//Handles all http requests
function logRequest(requestDetails){
  	//console.log("Request to: " + requestDetails.Url);
	//console.log(requestDetails.documentUrl);
	var flagSettingsDict = parseURLForSignal(requestDetails.url);
	
	for(var flag in flagSettingsDict){
		if(checkTruthy(flag, flagSettingsDict[flag])){
			setFlags[flag] += 1;
		}
		else{
			unsetFlags[flag] += 1;
		}
	}
	for(flag in unsetFlags){
		console.log(flag + " count " + unsetFlags[flag]);
	}
}

//Parses a URL string looking for a predetermined set of RDP-type flags
//TODO: account for multiple repeating flags in a URL
function parseURLForSignal(url){
	var flagSettingsDict = [];

	//Unescape the URL strip off everything until the parameter bit (anything after the question mark)
	url = unescape(url);
	url = url.substring(url.indexOf("\?"));
	if(url.length == 0){
		return;
	}

	var params = new URLSearchParams(url);

	urlFlags.forEach(flag => {
		if(params.has(flag)){
			flagSettingsDict[flag] = params.get(flag);
		}
	});

	//for(flag in flagSettingsDict){
	//	console.log(flag + " is set to " + flagSettingsDict[flag]);
	//}

	return flagSettingsDict;
}

chrome.tabs.onUpdated.addListener(checkForDNSLink);
chrome.webRequest.onBeforeRequest.addListener(
  logRequest,
  {urls: ["<all_urls>"]}
);
