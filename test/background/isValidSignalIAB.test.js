/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://privacytechlab.org/
*/

/*
isValidSignalIAB.test.js
================================================================================
isValidSignalIAB.test.js tests the IAB signals by checking valid inputs for the isValidSignalIAB function
*/

import assert from 'assert';
import {isValidSignalIAB} from '../../src/background/cookiesIAB.js';

describe('Check different IAB signals for validity', () => {
    it('should accept 1--- as true string', () => {
        assert.equal(isValidSignalIAB("1---"), true);
    });
    it('should accept string with all valid chars', () => {
        assert.equal(isValidSignalIAB("1YNY"), true);
        assert.equal(isValidSignalIAB("1YYY"), true);
        assert.equal(isValidSignalIAB("1NNN"), true);
    });
    it('should reject too short string', () => {
        assert.equal(isValidSignalIAB("1--"), false);
    });
    it('should reject string with invalid chars', () => {
        assert.equal(isValidSignalIAB("2YYY"), false);
        assert.equal(isValidSignalIAB("1YWY"), false);
        assert.equal(isValidSignalIAB("1WWY"), false);
        assert.equal(isValidSignalIAB("1YYW"), false);
    });

});

