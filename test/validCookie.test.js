var isValidSignalIAB = require('../src/background/cookiesIAB.js');
const expect = require('chai').expect;

describe('Valid Cookie String test', function(){

    context('valid string', function(){
        it('should return true', function(){
            expect(isValidSignalIAB("1---")).to.equal(true);
        })
    })

    context('invalid string', function(){
        it('should return false', function(){
            expect(isValidSignalIAB("abcd")).to.equal(false);
        })
    })
})