# Insist
Insist on types! Make your code more readable by explicitly requiring type for function parameters.

[ ![Codeship Status for blakevanlan/insist](https://codeship.com/projects/4aa39aa0-e875-0132-01bd-0e94167ad564/status?branch=master)](https://codeship.com/projects/82814)

## Install
```bash
npm install insist-types
```
Supports both Node and the browser. On the browser, exported as `window.insist`.

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

var foo = function (arg1, arg2) {
   insist.args(arguments, [String, Boolean, Object], String);
   // ...
};

foo('hi', 'hello'); // works!
foo(true, 'hello'); // works!
foo({}, 'hello'); // works!
foo(1, 'hello'); // throws error
```

### Optional Types
`insist.args` always returns an array of the arguments and shifts each argument into the proper
index when dealing with optional types.
```javascript
var insist = require('insist-types');

var foo = function (arg1, optionalArg2, arg3) {
   var args = insist.args(arguments, Number, insist.optional(Object), Function);
   // args will be [{number}, {object or null}, {function}]
};

foo(1, function () {}); // works!
foo(2, null, function () {}); // works!
foo(3, {}) // throws error
foo(4) // throws error
```

### Nullable Types
```javascript
var insist = require('insist-types');

var foo = function (arg1) {
   insist.args(arguments, insist.nullable(Function));
   // ...
};

foo(null); // works!
foo(function () {}); // works!
foo(); // throws error
foo('wrong') // throws error
```
Both `insist.optional` and `insist.nullable` really just augment the type. In the above example, it would have worked to use `[Function, null]` instead of `insist.nullable(Function)`. If you want to include `undefined` make sure you use `insist.optional` instead of `insist.nullable`.

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
To handle the last case (`foo([1, [2, 3, [4]]]);`), you can just use an array instead.
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

foo(null); // works!
foo(true); // works!
foo("true"); // works!
foo(1); // works!
foo(["true"]); // works!
foo({}); // works!
foo(); // throws error
```
I've debated a lot about whether `null` and `undefined` should be include in `insist.anything`. Currently, `null` is acceptable and `undefined` is not because I've found this to be the most useful `anything`. Open an issue if you have some input!

### Type
It can be valuable to assert that a parameter is actually a type.
```javascript
var insist = require('insist-types');

foo = function (arg1) {
   insist.args(arguments, insist.type());
   // ...
};

foo(String); // works!
foo(null); // works!
foo(undefined); // works!
foo(insist.arrayOf(Number)); // works!
foo("bar"); // throws error
```

### Enum
```javascript
var insist = require('insist-types');

Colors = {
  RED: "red",
  GREEN: "green",
  BLUE: "blue" 
};

foo = function (arg1) {
   insist.args(arguments, insist.enum(Colors));
   // ...
};

foo(Colors.GREEN); // works!
foo("red"); // works!
foo("yellow"); // throws error
foo(Colors); // throws error
```

## Options
You can set options on insist.
```javascript
insist({isDisabled: true});
// or
var insist = require('insist')({isDisabled: true});
```
### Available Options
#### isDisabled
When set to `true`, all asserts are set to noops, except for `insist.args`, which checks for optional expected types (so as to not break argument shifting). In Node, when `NODE_ENV` is set to `production`, isDisabled is set to true by default, unless `INSIST_IN_PROD` is set to `true`.

## Remover
It's recommended that insist is removed from production code, especially client-side JavaScript, for both size and efficiency. The Remover class makes this simple. It is worth noting, before removing a reference, the reference is checked to make sure that it is not being used to shift arguments. If it is, the reference will not be removed.
```javascript
var source = fs.readFileSync('source/file.js').toString();
var remover = new Remover();
var newSource remover.removeInsist(source);
fs.writeFileSync('source/out.js', newSource);
``` 

### Options
Currently, there is only one option for the remover: _aliases_. This option allows for when insist methods of been aliased to something else in a codebase.
```javascript
var source = fs.readFileSync('source/file.js').toString();
var remover = new Remover({
  aliases: {
    args: 'assertArgs',
    ofType: 'assertOfType'
  }
});
var newSource remover.removeInsist(source);
fs.writeFileSync('source/out.js', newSource);
``` 

### CLI
The remover is also available through the CLI. 
```bash
usage: insist-types [-h] [-v] -i [DIR|FILE [DIR|FILE ...]] [-a STRING]
                    [-t STRING]
                    

Removes insist-types from matching files.

Optional arguments:
  -h, --help            Show this help message and exit.
  -v, --version         Show program's version number and exit.
  -i [DIR|FILE [DIR|FILE ...]], --include [DIR|FILE [DIR|FILE ...]]
                        Adds the directory or file to be included in the 
                        processing. At least one required.
  -a STRING, --argsAlias STRING
                        Specifies the alias for insist.args. Defaults to 
                        'insist.args'.
  -t STRING, --ofTypeAlias STRING
                        Specifies the alias for insist.ofType. Defaults to 
                        'insist.ofType'.
```

## Full API
```javascript
insist.args(arguments, types...) // asserts the type of an arguments object and returns the shifted arguments
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
insist.type() // used for a type that expects a type
insist.enum(SomeEnumObject) // used for creating an enum type

insist.Remover // used to remove references from source
insist.Remover.prototype.removeInsist(source) // removes references
```

## Changelist

#### 1.4.2
* Fixed bug with cyclical references

#### 1.4.1
* Properly exported insist.Remover

#### 1.4.0
* Added CLI for insist.Remover

#### 1.3.0
* Adds insist.Remover for removing references from source. Recommended to be used before shipping code to production.
* Relaxed restriction that types must be functions. Fixes #2.

#### 1.2.1
* Fixed bug with exporting to browser

#### 1.2.0
* Added browser support, now exports to window.insist when module doesn't exist
* Added option support
* Added isDisabled option to explicitly enable or disable (useful for browser environments)

#### 1.1.0
* Added support for checking for types (insist.type)
* Added support for enums
