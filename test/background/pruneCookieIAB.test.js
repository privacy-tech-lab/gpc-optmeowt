/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://privacytechlab.org/
*/

/*
pruneCookieIAB.test.js
================================================================================
pruneCookieIAB.test.js makes a cookie and checks various properties of the new cookie
*/


import assert from "assert";
import { pruneCookieIAB } from "../../src/background/cookiesIAB.js";
import { makeCookieIAB } from "../../src/background/cookiesIAB.js";

/**
 * "Prunes" the values a retrieved cookie has set that a cookie
 * "to-be-set" cannot have. Also updates the value and url according
 * to the passed in values.
 * @param {object} cookie
 
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
