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
        assert.equal(parseIAB("1WYY"), '1NYN');
    });

    it('Should parse valid signal 1--- to 1YYY', () => {
        assert.equal(parseIAB("1---"), '1YYY');
    });

    it('Should change third char in valid signal to Y', () => {
        assert.equal(parseIAB("1NNN"), '1NYN');
        assert.equal(parseIAB("1YNY"), '1YYY');
        assert.equal(parseIAB("1NNY"), '1NYY');
    });
    
}) 

