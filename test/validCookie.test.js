import assert from 'assert';
import {isValidSignalIAB} from '../src/background/cookiesIAB.js';

it('should accept 1--- as true string', () => {
    assert.equal(isValidSignalIAB("1---"), true);
});
