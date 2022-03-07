

export function removeDynamicRule(id, domain) {
	let UpdateRuleOptions = { "removeRuleIds": [id] }
	
	chrome.declarativeNetRequest.updateDynamicRules(
	  UpdateRuleOptions, () => { console.log('Removed rule id#',id,' [',domain,'].'); }
	)
}


export function addDynamicRule(id, domain) {
	let UpdateRuleOptions = {
	  "addRules": [
      {
        "id": id,
        "priority": 2,
        "action": {
          "type": "modifyHeaders",
          "requestHeaders": [
            { "header": "Sec-GPC", "operation": "remove" },
            { "header": "DNT", "operation": "remove" }
          ]
        },
        "condition": { 
          "urlFilter": domain,
          "resourceTypes": [
            "main_frame",
            "sub_frame",
            "stylesheet",
            "script",
            "image",
            "font",
            "object",
            "xmlhttprequest",
            "ping",
            "csp_report",
            "media",
            "websocket",
            "webtransport",
            "webbundle",
            "other"
          ]
        }
      }
	  ],
	  "removeRuleIds": [id]
	}
	
	chrome.declarativeNetRequest.updateDynamicRules(
	  UpdateRuleOptions, () => { console.log('Added rule id#',id,' [',domain,'].'); }
	)
}
