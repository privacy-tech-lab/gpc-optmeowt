import {injectScript} from "../../content-scripts/contentScript.js";
import assert from "assert";



describe("Test prepend-ing script to document", () => {
    const uspapiRequest = `
  try {
    __uspapi('getUSPData', 1, (data) => {
      let currURL = document.URL
      window.postMessage({ type: "USPAPI_TO_CONTENT_SCRIPT_REQUEST", result: data, url: currURL });
    });
  } catch (e) {
    window.postMessage({ type: "USPAPI_TO_CONTENT_SCRIPT_REQUEST", result: "USPAPI_FAILED" });
  }
`;

    it("Should prepend script 'uspapiRequest' to document", () => {
        assert.doesNotThrow(injectScript(uspapiRequest), "object");
    });

    it("Should prepend script 'uspapiRequest' to document", () => {
        assert.throws(injectScript(uspapiRequest), "object");
    });
});