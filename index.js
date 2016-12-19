var co = require('co'),
    isGeneratorFn = require('is-generator').fn;

var DEFAULT_METHODS = [
    'afterAll',
    'afterEach',
    'beforeAll',
    'beforeEach',
    'it', 'fit', //'xit',
];
var EXPECTS_NAME = ['it', 'fit', 'xit'];

var originalMethods = {},
    overrideMethods, installed;

module.exports = function jasmineCo(userFn) {
    return wrapFn(userFn);
};
module.exports.install = function install() {
    (overrideMethods || DEFAULT_METHODS).forEach(function(fname) {
        coifyJasmineFn(fname);
    });
    installed = true;
};
module.exports.uninstall = function uninstall() {
    Object.keys(originalMethods).forEach(function(key) {
        global[key] = originalMethods[key];
    });
    originalMethods = {};
    installed = false;
};
module.exports.isInstalled = function isInstalled() {
    return installed;
};
module.exports.setOverrideMethods = function setOverrideMethods(methods) {
    overrideMethods = Array.isArray(methods) ? methods : DEFAULT_METHODS;
};

function coifyJasmineFn(fname) {
    // don't process methods that don't exist globally or have already been overridden
    if (!global[fname] || originalMethods[fname]) { return; }

    var origFn = originalMethods[fname] = global[fname];
    global[fname] = wrapFn(origFn, EXPECTS_NAME.indexOf(fname) !== -1);
}

function wrapFn(origFn, expectsName) {
    return function() {
        var userFn = expectsName ? arguments[1] : arguments[0];
        var restParams = [].slice.call(arguments, expectsName ? 2 : 1);
        var args;
        if (isGeneratorFn(userFn)) {
            // if the user method is a generator:
            //   1. call it with the correct `this` context object
            //   2. wrap it in a co function which fails the spec if an exception is
            //      encountered and notifies jasmine that the spec is done when the co
            //      promise settles
            args = [function(done) {
                return co(userFn.bind(this)).then(done, done.fail);
            }];
            if (expectsName) { args.unshift(arguments[0]); }
            if (restParams.length) { args.push.apply(args, restParams); }
            return origFn.apply(null, args);
        } else if (userFn && !userFn.length) {
            // if the user method is a standard function that doesn't expect to be asynchronous
            // (i.e. it doesn't take `done` as a parameter), wrap it with a function that *is*
            // asynchronous and retrofit it to support returning a promise from the function
            args = [function(done) {
                var result = userFn.call(this);
                if (!(result && typeof result.then === 'function')) {
                    done();
                    return result;
                } else {
                    result.then(done, done.fail);
                }
            }];
            if (expectsName) { args.unshift(arguments[0]); }
            if (restParams.length) { args.push.apply(args, restParams); }
            return origFn.apply(null, args);
        } else {
            // if the user method is already asynchronous, just call the standard jasmine method
            // and let the user method take care of itself
            return origFn.apply(null, arguments);
        }
    };
}
