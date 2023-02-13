import { getWellknown } from "../../content-scripts/contentScripts.js";
import assert from "assert";

describe("Wellknown URLs", async () => {
    var url = "www.abc.com"
    const r = await fetch(`${"www.abc.com".origin}/.well-known/gpc.json`);

    it("Add URL", () => {
        getWellknown(url);
        chrome.runtme.onMessage.addListener(
            function(request, sender, sendResponse) {
                assert.equal(request.data, r.json())
            }
        );
    });
});