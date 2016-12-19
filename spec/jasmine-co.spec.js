var jasmineCo = require('../index');

describe("jasmine-co", function() {
    describe("install / uninstall", function() {
        afterEach(function() {
            jasmineCo.uninstall();
        });

        it("should override global methods", function() {
            var orig = jasmine.getGlobal().it;
            jasmineCo.install();
            expect(jasmine.getGlobal().it).not.toBe(orig);
        });
        it("should only install once", function() {
            var orig = jasmine.getGlobal().it;
            jasmineCo.install();
            expect(jasmine.getGlobal().it).not.toBe(orig);
            var replaced = jasmine.getGlobal().it;
            jasmineCo.install();
            expect(jasmine.getGlobal().it).toBe(replaced);
        });
        it("should be possible to uninstall", function() {
            var orig = jasmine.getGlobal().it;
            jasmineCo.install();
            expect(jasmine.getGlobal().it).not.toBe(orig);
            jasmineCo.uninstall();
            expect(jasmine.getGlobal().it).toBe(orig);
        });
        it("should be possible to introspect current install state", function() {
            jasmineCo.install();
            expect(jasmineCo.isInstalled()).toBe(true);
            jasmineCo.uninstall();
            expect(jasmineCo.isInstalled()).toBe(false);
        });
    });

    describe("custom override methods", function() {
        beforeEach(function() {
            jasmineCo.setOverrideMethods();
            jasmineCo.uninstall();
        });

        it("should override all common methods by default", function() {
            // random assortment
            var orig = {
                it: jasmine.getGlobal().it,
                beforeAll: jasmine.getGlobal().beforeAll,
                afterEach: jasmine.getGlobal().afterEach,
                fit: jasmine.getGlobal().fit,
            };
            jasmineCo.install();
            Object.keys(orig).forEach(function(key) {
                expect(jasmine.getGlobal()[key]).not.toBe(orig[key]);
            });
        });
        it("should be possible to limit the functions that are overridden", function() {
            var orig = {
                it: jasmine.getGlobal().it,
                beforeAll: jasmine.getGlobal().beforeAll,
                afterEach: jasmine.getGlobal().afterEach,
            };
            jasmineCo.setOverrideMethods(['it', 'afterEach']);
            jasmineCo.install();
            expect(jasmine.getGlobal().it).not.toBe(orig.it);
            expect(jasmine.getGlobal().afterEach).not.toBe(orig.afterEach);
            expect(jasmine.getGlobal().beforeAll).toBe(orig.beforeAll);
        });
        it("should clear custom overrides if setOverrideMethods is called with no argument", function() {
            var orig = {
                it: jasmine.getGlobal().it,
                beforeAll: jasmine.getGlobal().beforeAll,
                afterEach: jasmine.getGlobal().afterEach,
            };
            jasmineCo.setOverrideMethods(['it', 'afterEach']);
            jasmineCo.install();
            jasmineCo.setOverrideMethods();
            jasmineCo.install();
            expect(jasmine.getGlobal().it).not.toBe(orig.it);
            expect(jasmine.getGlobal().afterEach).not.toBe(orig.afterEach);
            expect(jasmine.getGlobal().beforeAll).not.toBe(orig.beforeAll);
        });
    });

    describe("when installed", function() {
        jasmineCo.install();

        describe("generators", function() {
            it("should pass a generator-based spec", function*() {
                expect(yield [1]).toEqual([1]);
            });

            describe('with generator-based before blocks', function() {
                beforeEach(function*() {
                    this.val = yield new Promise(function(resolve, reject) { resolve(3); });
                });

                it("should have yielded values from the before block available in generator-based specs", function*() {
                    expect(this.val).toBe(3);
                    yield []; // just to silence jshint
                });
                it("should have yielded values from the before block available in standard specs", function() {
                    expect(this.val).toBe(3);
                });
            });
        });

        describe("promises", function() {
            it("should pass a promise-returning spec", function() {
                return new Promise(function(resolve, reject) {
                    resolve([1]);
                }).then(val => {
                    expect(val).toEqual([1]);
                });
            });

            describe('with promise-returning before blocks', function() {
                beforeEach(function() {
                    return new Promise((resolve, reject) => {
                        resolve(3);
                    }).then(val => {
                        this.val = val;
                    });
                });

                it("should have values from the before promise block available in promise-returning specs", function() {
                    return new Promise((resolve, reject) => {
                        resolve(4);
                    }).then(val => {
                        expect(this.val).toBe(3);
                        expect(val).toBe(4);
                    });
                });
                it("should have values from the before promise block available in standard specs", function() {
                    expect(this.val).toBe(3);
                });
            });
        });

        describe("generators + promises", function() {
            beforeEach(function*(){
                this.val = yield [1];
            });

            it("should be possible to use promise- and generator-based functions interoperate", function() {
                return new Promise((resolve, reject) => {
                    resolve();
                }).then(() => {
                    expect(this.val).toEqual([1]);
                });
            });
        });

        describe("custom timeouts", function() {
            var origTimeout;
            beforeAll(() => {
                origTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
                jasmine.DEFAULT_TIMEOUT_INTERVAL = 0;
            });
            afterAll(() => jasmine.DEFAULT_TIMEOUT_INTERVAL = origTimeout);


            beforeAll(function() { // tests custom delay on promise-returning setup method
                return new Promise(resolve => {
                    setTimeout(() => resolve(true), 25);
                }).then(val => this.delayedBeforeAll = val);
            }, 50);

            beforeEach(function*() { // tests custom delay on generator-based setup method
                var promise = new Promise(resolve => {
                    setTimeout(() => resolve(true), 25);
                });
                this.delayedBeforeEach = yield promise;
            }, 50);

            it("should be honored for `beforeAll` and `beforeEach` methods", function() {
                expect(this.delayedBeforeAll).toBe(true);
                expect(this.delayedBeforeEach).toBe(true);
            });

            it("should be honored for `it` methods", function*() {
                var promise = new Promise(resolve => {
                    setTimeout(() => resolve(true), 25);
                });
                expect(yield promise).toBe(true);
            }, 50);
        });

        jasmineCo.uninstall();
    });

    describe("invoking jasmine-co as a function", function() {
        it("should pass a spec when passed a standard function", jasmineCo(function() {
            expect(1).toBe(1);
        }));
        it("should pass a spec when passed a generator function", jasmineCo(function*() {
            expect(yield [1]).toEqual([1]);
        }));
        it("should pass a spec when the function returns a promise", jasmineCo(function() {
            return new Promise((resolve, reject) => {
                resolve(1);
            }).then(val => {
                expect(val).toBe(1);
            });
        }));
    });
});
