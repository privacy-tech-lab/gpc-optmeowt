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

var websitesFlagsDict = {}

//Finds DNS words in webpages.
//TODO: Check if words are in link
//TODO: Check for similar/noncompliant wording
//TODO: port to chrome
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

function generateEmptyFlagsDictTuple(){
	var setFlagsDict = [];
	var unsetFlagsDict = [];

	urlFlags.forEach(flag => {
		setFlagsDict[flag] = 0;
		unsetFlagsDict[flag] = 0; }
	);
	return [unsetFlagsDict, setFlagsDict];
}

//Handles all http requests
function logRequest(requestDetails){
  	console.log("Request to: " + requestDetails.url + " FROM " + requestDetails.initiator);
	//console.log(requestDetails.documentUrl);
	var flagSettingsDict = parseURLForSignal(requestDetails.url);
	
	//Check if the request initiator is already in the websites dictionary. If not, set it up!
	if(Object.keys(flagSettingsDict).length > 0){
		if(!(requestDetails.initiator in websitesFlagsDict)){
			console.log("Setting up flag logger for requestor " + requestDetails.initiator);
			websitesFlagsDict[requestDetails.initiator] = generateEmptyFlagsDictTuple();
			console.log(generateEmptyFlagsDictTuple());
		}
	}
	
	for(var flag in flagSettingsDict){
		if(checkTruthy(flag, flagSettingsDict[flag])){
			websitesFlagsDict[requestDetails.initiator][1][flag] += 1;
		}
		else{
			websitesFlagsDict[requestDetails.initiator][0][flag] += 1;
		}
	}
	for(var website in websitesFlagsDict){
		for(var flag in websitesFlagsDict[website][0]){
			console.log(website + " flag " + flag + " has " + websitesFlagsDict[website][0][flag]);
		}
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

	return flagSettingsDict;
}

//chrome.tabs.onUpdated.addListener(checkForDNSLink);
chrome.webRequest.onBeforeRequest.addListener(
  logRequest,
  {urls: ["<all_urls>"]}
);
