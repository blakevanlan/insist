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
foo('hi', 'true'); // throws error
```

## More interesting stuff
Insist can understand multiple types, optional arguments, nullable types, typed arrays, and classes.

### Multiple Types
Just put the desired types in an array.
```javascript
var insist = require('insist-types');

var foo = function (arg1) {
   insist.args(arguments, [String, Boolean, Object], String);
   // ...
};

foo('hi', 'hello'); // works!
foo(true, 'hello'); // works!
foo({}, 'hello'); // works!
foo(1, 'hello'); // throws error
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
```javascript
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
Both `insist.optional` and `insist.nullable` really just augment the type. In the above example, it would have worked to use `[Function, null]` instead of `insist.nullable(Function)`.

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

var fn = function (arg1) {
   insist.args(arguments, events.EventEmitter);
   // ...
};

fn(new Foo()); // works!
```


### Anything
Sometimes it's handy to have a definition that'll take anything.
```javascript
var insist = require('insist-types');

foo = function (arg1) {
   insist.args(arguments, insist.anything());
   // ...
};

foo(true); // works!
foo("true"); // works!
foo(1); // works!
foo(["true"]); // works!
foo({}); // works!
```

## Deloyment Note
Currently, when the `NODE_ENV` is set to `production`, all of the asserts will actually be turned off for performance.

## Full API
```javascript

insist.args(arguments, types...) // asserts the type of an arguments object
insist.ofType(value, type) // asserts the type of a value
insist.isType(type) // asserts that the supplied type is actually a type
insist.isValidType(type) // returns true|false for whether the type is actually a type
insist.isOptionalType(type) // returns true|flase for whether the type is an optional type
insist.isOfType(value, type) // returns true|false for whether the value is of the type
insist.getNameForType(type) // returns the name of the type
insist.getNameForValue(value) // returns the name of the value (ex. String, Anonymous function)
insist.arrayOf(type) // used for creating an array type
insist.nullable(type) // used for creating a nullable type
insist.optional() // used for creating an optional type
insist.anything() // used for a type that can be anything
```
