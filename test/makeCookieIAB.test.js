import assert from "assert";
import { makeCookieIAB } from "../src/background/cookiesIAB.js";

// function makeCookieIAB(name, value, url) {
//   var time = new Date();
//   var now = time.getTime();

//   let cookie = {};
//   cookie.expirationDate = now / 1000 + 31557600;
//   cookie.url = url;
//   cookie.name = name;
//   cookie.value = value;
//   return cookie;
// }

it("checks whether a new cookie is constructed per the IAB spec", () => {
  var time = new Date();
  var now = time.getTime();
  var name = "test_cookie";
  var value = "test_value";
  var url = "http://test_url.com";
  var expirationDate = now / 1000 + 31557600;
  var ex_cookie = makeCookieIAB(name, value, url);

  assert.equal(ex_cookie.name, "test_cookie");
  assert.equal(ex_cookie.value, "test_value");
  assert.equal(ex_cookie.url, "http://test_url.com");
  assert.equal(ex_cookie.expirationDate, now / 1000 + 31557600);
});
