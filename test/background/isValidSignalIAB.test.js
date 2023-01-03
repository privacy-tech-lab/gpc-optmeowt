import assert from 'assert';
import {isValidSignalIAB} from '../../src/background/cookiesIAB.js';

describe('Check different IAB signals for validity', () => {
    it('should accept 1--- as true string', () => {
        assert.equal(isValidSignalIAB("1---"), true);
    });
    it('should accept 1YNY as true string', () => {
        assert.equal(isValidSignalIAB("1YNY"), true);
    });
    it('should reject 1-- as false string', () => {
        assert.equal(isValidSignalIAB("1--"), false);
    });
    it('should reject 2YYY as false string', () => {
        assert.equal(isValidSignalIAB("2YYY"), false);
    });
    it('should reject 1WWW as false string', () => {
        assert.equal(isValidSignalIAB("1WWW"), false);
    });

});

