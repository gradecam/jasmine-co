[![Build Status](https://travis-ci.org/gradecam/jasmine-co.svg?branch=master)](https://travis-ci.org/gradecam/jasmine-co)

**Table of Contents**

* [Requirements](#requirements)
* [Quick Start](#quick-start)
* [What? Why?](#what-why)
* [Comparison / Examples](#comparison-examples)

# jasmine-co

`jasmine-co` is a simple Jasmine 2.x adapter that allows you to use
[co](https://github.com/tj/co) and ES6 generator functions to greatly
simplify your asynchronous test code using synchronous patterns.

`jasmine-co` also enables you to return promises from your specs without
manually worrying about handling Jasmine's `done` callback. For you
TypeScript fans, this means you can trivially use `async/await`.

Testing asynchronous functions doesn't have to be painful.


### <a name="requirements"></a>Requirements

1. NodeJS with support for generators
    * you can use `nodejs@0.12.x` with `--harmony`
    * or save yourself some trouble and just use `nodejs@4.x` which enables
      support for generators, arrow functions, and other ES6 features by
      default
2. Jasmine 2.x


### <a name="quick-start"></a>Quick Start

1. Install `jasmine-co`
    * globally, e.g. in a helpers file
    * install / uninstall within a specific `describe` block
    * install / uninstall for a specific `it`
    * one-off usage
    * etc.
2. Write tests as normal, but instead of using `function` + `done`, either...
    * use `function*` and `yield`, or
    * a `function` that returns a promise (thennable)
3. That's it.

##### Installed globally

```js
// spec/helpers/jasmine-co.helper.js
require('jasmine-co').install();

// spec/bookService.spec.js
describe("user models", function() {
    beforeEach(function*(){
        this.user = yield getUser(1);
    });

    it("should be able to get a list of owned books", function*() {
        var books = yield bookService.getBooksForUser(this.user);
        expect(books).toEqual(jasmine.any(Array));
    });

    it("should also work when promises are returned", function() {
        return bookService.getBooksForUser(this.user).then(function(books) {
            expect(books).toEqual(jasmine.any(Array));
        });
    });
});
```

##### Installed temporarily

```js
// spec/bookService.spec.js
var jasmineCo = require('jasmine-co');
describe("user models", function() {
    // install jasmine-co for methods in this describe block
    jasmineCo.install();

    beforeEach(function*(){
        this.user = yield getUser(1);
    });

    it("should be able to get a list of owned books", function*() {
        var books = yield bookService.getBooksForUser(this.user);
        expect(books).toEqual(jasmine.any(Array));
    });

    it("should also work when promises are returned", function() {
        return bookService.getBooksForUser(this.user).then(function(books) {
            expect(books).toEqual(jasmine.any(Array));
        });
    });

    // clean up
    jasmineCo.uninstall();
});
```

##### One-off usage

```js
// spec/bookService.spec.js
var jasmineCo = require('jasmine-co');
describe("user models", function() {
    // use jasmine-co as a one-off
    beforeEach(jasmineCo(function*(){
        this.user = yield getUser(1);
    }));

    // use jasmine-co as a one-off again
    it("should be able to get a list of owned books", jasmineCo(function*() {
        var books = yield bookService.getBooksForUser(this.user);
        expect(books).toEqual(jasmine.any(Array));
    }));

    // use jasmine-co as a one-off for a promise-returning spec
    it("should also work when promises are returned", function() {
        return bookService.getBooksForUser(this.user).then(function(books) {
            expect(books).toEqual(jasmine.any(Array));
        });
    });
});
```

##### TypeScript async/await example

```js
// spec/helpers/jasmine-co.helper.js
require('jasmine-co').install();

// spec/bookService.spec.ts
describe("user models", function() {
    beforeEach(async function(){
        this.user = await getUser(1);
    });

    it("should be able to get a list of owned books", async function() {
        var books = await bookService.getBooksForUser(this.user);
        expect(books).toEqual(jasmine.any(Array));
    });
});
```


### <a name="comparison-examples"></a>Comparison / Examples

How does `jasmine-co` actually help you clean up your test code? 
To answer that question, consider the following examples.

All examples are functionally equivalent.

##### 1. Promises

```js
beforeEach(function(done) {
    var self = this;
    userService.getUser(1).then(function(user) {
        self.user = user;
        return bookService.getBooksForUser(user);
    }).then(function(books) {
        self.books = books;
    }).then(done, done.fail);
});

it('should track books that are listed for sale', function(done) {
    var self = this;
    var book = this.books[0];
    book.listForSale(3.99).then(function() {
        return bookService.getBooksListedForSaleByUser(self.user);
    }).then(function(forSale) {
        expect(forSale[0].isbn).toEqual(book.isbn);
    }).then(done, done.fail);
});
```

##### 2. Using co directly

```js
var co = require('co');
beforeEach(function(done) {
    var self = this;
    co(function*() {
        self.user = yield userService.getUser(1);
        self.books = yield bookService.getBooksForUser(self.user);
    }).then(done, done.fail);
});

it('should track books that are listed for sale', function(done) {
    var self = this;
    var book = this.books[0];
    co(function*() {
        yield book.listForSale(3.99);
        var forSale = yield bookService.getBooksListedForSaleByUser(self.user);
        expect(forSale[0].isbn).toEqual(book.isbn);
    }).then(done, done.fail);
});
```

##### 3. Using jasmine-co

```js
require('jasmine-co').install();
beforeEach(function*() {
    this.user = yield userService.getUser(1);
    this.books = yield bookService.getBooksForUser(this.user);
});

it('should track books that are listed for sale', function*() {
    var book = this.books[0];
    yield book.listForSale(3.99);
    var forSale = yield bookService.getBooksListedForSaleByUser(this.user);
    expect(forSale[0].isbn).toEqual(book.isbn);
});
```


### License

This software is licensed under the MIT License.
