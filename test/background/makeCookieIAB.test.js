/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://privacytechlab.org/
*/

/*
makeCookieIAB.test.js
================================================================================
makeCookieIAB.test.js makes a new cookie and checks against expected cookie values
*/

import assert from "assert";
import { makeCookieIAB } from "../../src/background/cookiesIAB.js";

it("checks whether a new cookie is constructed per the IAB spec", () => {
  var name = "test_cookie";
  var value = "test_value";
  var url = "http://test_url.com";
  var ex_cookie = makeCookieIAB(name, value, url);

  assert.equal(ex_cookie.name, "test_cookie");
  assert.equal(ex_cookie.value, "test_value");
  assert.equal(ex_cookie.url, "http://test_url.com");
});
