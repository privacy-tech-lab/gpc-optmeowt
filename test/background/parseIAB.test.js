/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://privacytechlab.org/
*/

/*
parseIAB.test.js
================================================================================
parseIAB.test.js checks to make sure IAB signal is parsed correctly with Y as the third character
*/

import assert from "assert";
import { parseIAB } from "../../src/background/cookiesIAB.js";


describe("Check parsing of IAB signal", () => {
    it('Should parse invalid signal to 1NYN', () => {
        assert.equal(parseIAB("1WYY", true), '1NYN');
    });

    it('Should parse valid signal 1--- to 1YYY', () => {
        assert.equal(parseIAB("1---",true ), '1YYY');
    });

    it('Should change third char in valid signal to Y', () => {
        assert.equal(parseIAB("1NNN", true), '1NYN');
        assert.equal(parseIAB("1YNY", true), '1YYY');
        assert.equal(parseIAB("1NNY", true), '1NYY');
    });

    it('Should change third char in valid signal to N', () => {
        assert.equal(parseIAB("1NYN", false), '1NNN');
        assert.equal(parseIAB("1YYN", false), '1YNN');
        assert.equal(parseIAB("1YYY", false), '1YNY');
    });
    
}) 

