"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise_1 = require("./Promise");
const test = () => {
    const defer = {};
    defer.promise = new Promise_1.MyPromise((resolve, reject) => {
        defer.resolve = resolve;
        defer.reject = reject;
    });
    return defer;
};
const testPromise = {
    deferred: test
};
try {
    module.exports = testPromise;
}
catch (e) {
    console.log(e);
}
