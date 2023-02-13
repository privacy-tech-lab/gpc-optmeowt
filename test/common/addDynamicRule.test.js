import {addDynamicRule} from "../../src/common/editRules.js";
import assert from "assert";

describe("Add and remove headers", () => {
    it("Should remove Sec-GPC and DNT headers", async () => {
        addDynamicRule(30, "www.example.com");
        const rules = await chrome.declarativeNetRequest.getDynamicRules();
        assert.equal(rules[30]["id"], "www.example.com");
    });
});
