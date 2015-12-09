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

        it("should pass a spec with a generator function provided", function*() {
            expect(yield [1]).toEqual([1]);
        });

        describe('using generator-based before blocks', function() {
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

        jasmineCo.uninstall();
    });

    describe("invoking jasmine-co as a function", function() {
        it("should pass a spec when passed a standard function", jasmineCo(function() {
            expect(1).toBe(1);
        }));
        it("should pass a spec when passed a generator function", jasmineCo(function*() {
            expect(yield [1]).toEqual([1]);
        }));
    });
});
