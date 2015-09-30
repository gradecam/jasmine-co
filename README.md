# jasmine-co

Simple Jasmine 2.x adapter that allows you to use [co](https://github.com/tj/co)
and ES6 generator functions to greatly simplify your asynchronous test code.

### Requirements

1. NodeJS with support for generators
    * you can use `nodejs@0.12.x` with `--harmony`
    * or save yourself some trouble and just use `nodejs@4.x` which has
      support for generators on by default
2. Jasmine 2.x

### Examples

The examples below assume you are using Promises (let’s be honest, writing asynchronous
code is painful enough that you probably want to avoid callback hell anyway). The
`fail` / `done` pattern used in the examples below isn’t complicated, but it may look
unfamiliar at first glance so here’s a brief explanation:

1. Standard syntax for a promise callback is `.then(successHandler, failHandler)`, with
   the return value of either function being used to modify the ultimate resolve value of
   the Promise you’re chaining.
2. When writing an asynchronous Jasmine function, you need to call `done` to let Jasmine
   know you’re ready for it to move on to the next methods. If something goes wrong, you
   may want to call `fail` to let Jasmine know something went wrong, which is great, but
   but realize that this won’t call `done` for you.
3. So this simple pattern will notify Jasmine of failures (returning `undefined` and thus
   causing the resulting Promise to be resolved) and then call `done` after either a
   successful or failed run: `.then(null, fail).then(done)`

##### 1. Promises

```js
beforeEach(function(done) {
    var self = this;
    userService.getUser(1).then(function(user) {
        self.user = user;
        return bookService.getBooksForUser(user);
    }).then(function(books) {
        self.books = books;
    }).then(null, fail).then(done);
});

it('should track books that are listed for sale', function(done) {
    var self = this;
    var book = this.books[0];
    book.listForSale(3.99).then(function() {
        return bookService.getBooksListedForSaleByUser(self.user);
    }).then(function(forSale) {
        expect(forSale[0].isbn).toEqual(book.isbn);
    }).then(null, fail).then(done);
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
    }).then(null, fail).then(done);
});

it('should track books that are listed for sale', function(done) {
    var self = this;
    var book = this.books[0];
    co(function*() {
        yield book.listForSale(3.99);
        var forSale = yield bookService.getBooksListedForSaleByUser(self.user);
        expect(forSale[0].isbn).toEqual(book.isbn);
    }).then(null, fail).then(done);
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
