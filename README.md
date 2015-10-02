<div style="float:right; background-color: #f5f5f5; border:1px solid #ccc; margin: 10px 10px 10px 20px; padding:15px 10px; ">
<div style="text-align:center"><strong>Table of Contents</strong></div>
  <ul style="margin-bottom: 0px;">
    <li><a href="#requirements">Requirements</a></li>
    <li><a href="#quick-start">Quick Start</a></li>
    <li><a href="#what-why">What? Why?</a></li>
    <li><a href="#comparison-examples">Comparison / Examples</a></li>
  </ul>
</div>

# jasmine-co

`jasmine-co` is a simple Jasmine 2.x adapter that allows you to use
[co](https://github.com/tj/co) and ES6 generator functions to greatly
simplify your asynchronous test code using synchronous patterns.

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
    * etc.
2. Write tests as you normally would, but use `function*` and `yield` instead
   of `function` + `done`
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
        var books = yield bookService.getBooksForUser(user);
        expect(books).toEqual(jasmine.any(Array));
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
        var books = yield bookService.getBooksForUser(user);
        expect(books).toEqual(jasmine.any(Array));
    });

    // clean up
    jasmineCo.uninstall();
});
```


### <a name="what-why"></a>What? Why?

Asynchronous code is an inevitable component of any web service, helps avoid
blocking I/O operations, and the list goes on. There's nothing wrong with
well-written asynchronous code. Asynchronous code is good!

Testing asynchronous code can be painful. When writing a test you want to
get from Point A to Point B quickly so you can test all the interesting
behaviors and interactions. Callback hell is very tedious inside a test;
Promises are better, but there is still a fair bit of boilerplate to setup
your tests and deal with the Promise resolve / rejection handlers.

Wouldn't it be great if you could test your asynchronous methods using
simple, synchronous patterns?

We thought so, too. Enter `jasmine-co`.

##### How?

The real magic that allows us to write code this way is a combination of
ES6 generator functions and a nice little library called [co](https://github.com/tj/co).
`co` wraps your ES6 generator functions and waits for asynchronous operations
to complete any time it sees a `yield` statement. As a result, you can easily
write asynchronous code using synchronous patterns, all without actually
making your code blocking. Thus, the following becomes possible:

```js
var list = yield someMethodThatReturnsAnArrayUsingPromises();
console.log(list.length); // this works
```

So we wrapped Jasmine's global methods to support this syntax.


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
