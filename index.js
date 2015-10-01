var co = require('co');

var DEFAULT_METHODS = [
    'afterAll',
    'afterEach',
    'beforeAll',
    'beforeEach',
    'it', 'fit', //'xit',
];
var originalMethods = {},
    overrideMethods, isInstalled;

module.exports = {
    install: function() {
        (overrideMethods || DEFAULT_METHODS).forEach(function(fname) {
            coifyJasmineFn(fname);
        });
        isInstalled = true;
    },
    uninstall: function() {
        Object.keys(originalMethods).forEach(function(key) {
            global[key] = originalMethods[key];
        });
        originalMethods = {};
        isInstalled = false;
    },
    isInstalled: function() {
        return isInstalled;
    },
    setOverrideMethods: function(methods) {
        overrideMethods = Array.isArray(methods) ? methods : DEFAULT_METHODS;
    }
};

function coifyJasmineFn(fname) {
    // don't process methods that don't exist globally or have already been overridden
    if (!global[fname] || originalMethods[fname]) { return; }

    var origFn = originalMethods[fname] = global[fname];
    global[fname] = function() {
        var expectsName = arguments.length > 1; // `it('does stuff', fn)` (length 2) vs `beforeEach(fn)` (length 1)
        var userFn = expectsName ? arguments[1] : arguments[0];
        if (/^function\s*\*/.test(userFn.toString())) {
            // if the user method is a generator:
            //   1. call it with the correct `this` context object
            //   2. wrap it in a co function which fails the spec if an exception is
            //      encountered and notifies jasmine that the spec is done when the co
            //      promise settles
            var args = [function(done) {
                return co(userFn.bind(this)).then(done, done.fail);
            }];
            if (expectsName) { args.unshift(arguments[0]); }
            return origFn.apply(null, args);
        } else {
            // if the user method is a standard function, just call the standard jasmine method
            return origFn.apply(null, arguments);
        }
    };
}
