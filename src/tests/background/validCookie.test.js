

import { isValidSignalIAB } from "./cookiesIAB"; 

/* Test mocking
jest.mock("../../background/cookiesIAB", () => jest.fn());

beforeEach(() => {
    isValidSignalIAB.mock;
});
*/

test('IAB signal is valid', () =>{
    const IABsignal = isValidSignalIAB('1---');
    expect(IABsignal).toBeTruthy();
});