# Insist
Insist on types! Make your code more readable by explicitly requiring type for function parameters.

## Install
```bash
npm install insist-types
```

## Basic Usage
```javascript
var insist = require('insist-types');

var foo = function (arg1, arg2) {
   insist.args(arguments, String, Boolean);
   // ...
};

foo('hi', true); // works!
foo('I'm', 'wrong'); // throws error
```

## More interesting stuff
Insist can understand multiple types, optional arguments, nullable types, typed arrays, and classes.

### Multiple Types
Just put the desired types in an array.
```javascript
var insist = require('insist-types');

var foo = function (arg1) {
   insist.args(arguments, [String, Boolean, Object]);
   // ...
};

foo('hi'); // works!
foo(true); // works!
foo({}); // works!
foo(1); // throws error
```

### Optional Types
Optional types are some what simple right now. You can really only have trailing optional arguments because the comparison isn't shifted as optional arguments are found. They need a little more love.

```javascript
var insist = require('insist-types');

var foo = function (arg1, optionalArg2) {
   insist.args(arguments, Number, insist.optional(Function));
   // ...
};

foo(1); // works!
foo(2, function () {}); // works!
foo(3, null); // works!
foo(4, {}) // throws error
```

### Nullable Types
```
var insist = require('insist-types');

var foo = function (arg1) {
   insist.args(arguments, insist.nullable(Function));
   // ...
};

foo(); // works!
foo(null); // works!
foo(function () {}); // works!
foo('wrong') // throws error
```
Both `insist.optional` and `insist.nullable` really just augment the type. In the above example, it would have worked to use `[Function, null]` instead of `insist.nullable`.

### Typed Arrays
```javascript
var insist = require('insist-types');

var foo = function (arg1) {
   insist.args(arguments, insist.arrayOf(Number));
   // ...
};

foo([]); // works!
foo([1]); // works!
foo([1, 2]); // works!
foo([1, '2']); // throws error
```
You can also nest arrays.
```javascript
var insist = require('insist-types');

var foo = function (arg1) {
   insist.args(arguments, insist.arrayOf([Number, insist.arrayOf(Number)));
   // ...
};

foo([]); // works!
foo([1]); // works!
foo([1, [2, 3]]); // works!
foo([1, [2, 3, [4]]]); // throws error
```
To handle the last case, you can just use an array instead.
```javascript
var insist = require('insist-types');

var foo = function (arg1) {
   insist.args(arguments, insist.arrayOf([Number, Array]));
   // ...
};

foo([]); // works!
foo([1]); // works!
foo([1, [2, 3]]); // works!
foo([1, [2, 3, [4]]]); // works!
```

### Classes
```javascript
var insist = require('insist-types');

function Bar() {};

var foo = function (arg1) {
   insist.args(arguments, Bar);
   // ...
};

foo(new Bar()); // works!
foo({}); // throws error
```
Sublasses work too!
```javascript
var insist = require('insist-types');
var util = require('util');
var events = require('events');

function Foo() {
   events.EventEmitter.call(this);
};
util.inherits(Foo, events.EventEmitter);

foo = function (arg1) {
   insist.args(arguments, events.EventEmitter);
   // ...
};

foo(new Foo()); // works!
```
