import assert from "assert";
import { pruneCookieIAB } from "../../src/background/cookiesIAB.js";
import { makeCookieIAB } from "../../src/background/cookiesIAB.js";

/**
 * "Prunes" the values a retrieved cookie has set that a cookie
 * "to-be-set" cannot have. Also updates the value and url according
 * to the passed in values.
 * @param {object} cookie
 
 function pruneCookieIAB(cookie, value, url) {
    cookie.value = value;
    cookie.url = url;
    // Checks if a cookie made by a site is stored per domain/subdomain
    if (cookie.domain.substr(0, 1) !== ".") {
      cookie.domain = null;
    }
    if (cookie.hostOnly !== null) {
      delete cookie.hostOnly;
    }
    if (cookie.session !== null) {
      delete cookie.session;
    }
    return cookie;
  }
*/

describe("Checks if cookie is stored per domain/subdomain", () => {
    it("Cookie with incorrect domain", () => {
        var name = "test_cookie";
        var value = "test_value";
        var url = "http://test_url.com";
        var ex_cookie = makeCookieIAB(name, value, url);
        ex_cookie.domain = "abcd";
        
        ex_cookie = pruneCookieIAB(ex_cookie, value, url);
    
        assert.equal(ex_cookie.domain, null);
    
    });

    it("Cookie with correct domain", () => {
        var name = "test_cookie";
        var value = "test_value";
        var url = "http://test_url.com";
        var ex_cookie = makeCookieIAB(name, value, url);
        ex_cookie.domain = ".";
        
        ex_cookie = pruneCookieIAB(ex_cookie, value, url);
    
        assert.equal(ex_cookie.domain, ".");
    
    });

    it("Cookie with hostOnly == null", () => {
        var name = "test_cookie";
        var value = "test_value";
        var url = "http://test_url.com";
        var ex_cookie = makeCookieIAB(name, value, url);
        ex_cookie.domain = ".";
        ex_cookie.hostOnly = null;
        
        ex_cookie = pruneCookieIAB(ex_cookie, value, url);
    
        assert.equal(ex_cookie.hostOnly, null);
    
    });

    it("Cookie with hostOnly != null", () => {
        var name = "test_cookie";
        var value = "test_value";
        var url = "http://test_url.com";
        var ex_cookie = makeCookieIAB(name, value, url);
        ex_cookie.domain = ".";
        ex_cookie.hostOnly = true;
        
        ex_cookie = pruneCookieIAB(ex_cookie, value, url);
    
        assert.equal(ex_cookie.hostOnly, undefined);
    
    });

    it("Cookie with session == null", () => {
        var name = "test_cookie";
        var value = "test_value";
        var url = "http://test_url.com";
        var ex_cookie = makeCookieIAB(name, value, url);
        ex_cookie.domain = ".";
        ex_cookie.hostOnly = null;
        ex_cookie.session = null;
        
        ex_cookie = pruneCookieIAB(ex_cookie, value, url);
    
        assert.equal(ex_cookie.session, null);
    
    });

    it("Cookie with session != null", () => {
        var name = "test_cookie";
        var value = "test_value";
        var url = "http://test_url.com";
        var ex_cookie = makeCookieIAB(name, value, url);
        ex_cookie.domain = ".";
        ex_cookie.hostOnly = true;
        ex_cookie.session = true;
        
        ex_cookie = pruneCookieIAB(ex_cookie, value, url);
    
        assert.equal(ex_cookie.session, undefined);
    
    });
});
