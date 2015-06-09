
/**
 * Asserts that the arguments supplied are what's expected. If an argument can be multiples
 * types, use an array of acceptable types. 
 * @param {Array.<?>} args
 * @param {?,..} expected types
 * @return Returns an array with the arguments shifted into the correct indices.
**/
args = function (args) {
   // Find the minimum expected length.
   var expected = Array.prototype.slice.call(arguments, 1);
   var minimum = expected.length
   var hasOptionalTypes = false;
   var shiftedArgs = [];
   for (var i = 0; i < expected.length; i++) {
      if (!isValidType(expected[i])) {
         throw Error('Expected argument ' + i + ' is not a valid type.');
      }
      if (isOptionalType(expected[i])) {
         minimum--;
         hasOptionalTypes = true;
      }
      // Set each shiftedArgs element to null.
      shiftedArgs[i] = null;
   };
   // Exit early if in production, INSIST_IN_PROD is not equal to true and there are no optional
   // options.
   if (process.env.NODE_ENV === 'production' && process.env.INSIST_IN_PROD !== 'true' &&
         !hasOptionalTypes) {
      return [];
   }

   // Check if the args and expected lengths are different (and there are no optional args).
   if (minimum == expected.length && args.length != expected.length) {
      throw Error('Expected ' + expected.length + ' arguments but received ' +
            args.length + ' instead.');
   }
   // Check if the args are within the expected range.
   if (args.length < minimum || args.length > expected.length) {
      throw Error('Expected between ' + minimum + ' and ' + expected.length +
            ' arguments but received ' + args.length + ' instead.');
   }

   var getExpectedVsRecieved = function () {
      var argNames = [];
      var expectedNames = [];
      for (var i = 0; i < args.length; i++) {
         argNames.push(getNameForValue(args[i]));
      };
      for (var i = 0; i < expected.length; i++) {
         expectedNames.push(getNameForType(expected[i]));
      };
      return 'Expected arguments to be (' + expectedNames.join(', ') + ') but received (' +
            argNames.join(', ') + ') instead.';
   };

   var curArg = args.length - 1;
   var remainingOptionalArgs = expected.length - minimum;
   var optionalIndiceChunks = []
   var optionalIndiceChunk = []
   var availableArgsChunks = []
   var availableArgsChunk = []

   // First fill in all of the required types.
   for (i = expected.length - 1; i >= 0; i--) {
      var type = expected[i];
      if (isOptionalType(type)) {
         optionalIndiceChunk.unshift(i);
         continue;
      }
      // Capture groups of optional arguments separated by required arguments.
      optionalIndiceChunks.unshift(optionalIndiceChunk);
      optionalIndiceChunk = [];

      while (!isOfType(args[curArg], type)) {
         // Capture groups of available arguments separated by ones that have been used.
         availableArgsChunk.unshift(curArg);
         curArg--;
         remainingOptionalArgs--;
         if (curArg < 0 || remainingOptionalArgs < 0) {
            throw Error(getExpectedVsRecieved());
         }
      }
      availableArgsChunks.unshift(availableArgsChunk);
      availableArgsChunk = []
      shiftedArgs[i] = args[curArg--];
   }
   // Now that we have found all the required arguments, group the rest for processing with optional
   // arguments.
   while (curArg >= 0) {
      availableArgsChunk.unshift(curArg);
      curArg--;
   }
   availableArgsChunks.unshift(availableArgsChunk);
   optionalIndiceChunks.unshift(optionalIndiceChunk);

   // Make sure that the optional argument count matches up correctly.
   if (availableArgsChunks.length != optionalIndiceChunks.length) {
      throw Error(getExpectedVsRecieved());
   }

   // Go through all the optional chunks and argument chunks to match up the optional arguments.
   optionalIndiceChunks.forEach(function (optionalIndices, index) {
      availableArgsChunk = availableArgsChunks[index];
      i = 0;
      availableArgsChunk.forEach(function (argIndex) {
         arg = args[argIndex]
         // Skip forward until we find an optional expected argument that matches.
         while (!isOfType(arg, expected[optionalIndices[i]]) && i < optionalIndices.length) {
            i++;
         }
         // If none match then the arguments are invalid.
         if (i >= optionalIndices.length) {
            throw Error(getExpectedVsRecieved());
         }
         // Success! This is an optional expected argument.
         shiftedArgs[optionalIndices[i]] = arg;
      });
   });

   return shiftedArgs;
};

/**
 * Asserts that the supplied value is of the supplied type.
 * @param {?} value
 * @param {type} types
**/
ofType = function (value, type) {
   if (!isValidType(type)) {
      throw Error('Invalid type supplied.');   
   }  
   if (!isOfType(value, type)) {
      argName = getNameForValue(value);
      typeName = getNameForType(type);
      throw Error('Expected ' + argName + ' to be an instance of ' + typeName + '.');
   }
};

/**
 * @param {?} type
**/
isType = function (type) {
   if (!isValidType(type)) {
      throw Error('Expected a type but received ' + type + '.'); 
   }
};

/**
 * Determines if the argument is a valid type.
 * @param {type} type
 * @return {boolean} 
**/
isValidType = function (type) {
   if (type === null) return true;
   if (type === undefined) return true;
   if (type instanceof Array) {
      // An array is only valid if it contains one or more valid types.
      if (!type.length) return false;
      for (var i = 0; i < type.length; i++) {
          if (!isValidType(type[i])) return false;
      };
      return true;
   }
   if (type instanceof ArrayOf) return isValidType(type.type);
   return (type instanceof Function);
};

/**
 * @param {type} type
 * @return {boolean}
**/
isOptionalType = function (type) {
   if (type === undefined) return true;
   if (type instanceof Array) {
      for (var i = 0; i < type.length; i++) {
          if (isOptionalType(type[i])) return true;
      };
   }
   return false;
};

/**
 * Gets the pretty name for the type of the value.
 * @param {?} value
 * @return {string}
**/
getNameForValue = function (value) {
   if (value === undefined) return 'undefined';
   if (value === null) return 'null';

   // Look inside the array to determine the inner type.
   if (value instanceof Array) {
      if (!value.length) return 'Array(empty)';
      var innerType = undefined;
      for (var i = 0; i < value.length; i++) {
         type = getNameForValue(value[i]);
         if (innerType !== undefined && innerType !== type) {
            return 'Array(mixed)';
         }
         innerType = type;
      };
      return 'Array<' + innerType + '>';
   }

   if (value instanceof Function) {
      if (value.name) return value.name;
      return 'Anonymous function';
   }

   // Try and use the constructor to find the name of the type.
   if (value instanceof Object) {
      if (value.constructor) return value.constructor.name;
      return 'Object';
   }

   // No other way to determine the name of the type, just capitilize the typeof value.
   name = typeof value;
   return name[0].toUpperCase() + name.substring(1);
};

/**
 * Gets the pretty name for the type.
 * @param {type} type
 * @return {string}
**/
getNameForType = function (type) {
   if (type === undefined) return 'undefined';
   if (type === null) return "null";

   // Create a list of all the possible types.
   if (type instanceof Array) {
      if (!type.length) return 'None';
      var possibleTypes = [];
      for (var i = 0; i < type.length; i++) {
         possibleTypes.push(getNameForType(type[i]));
      };
      return possibleTypes.join(' or ');
   }

   // Look inside the array to determine the inner type.
   if (type instanceof ArrayOf) {
      return 'Array<' + getNameForType(type.type) + '>';
   }

   // All types should be functions.
   if (type instanceof Function) return type.name 
   return 'Invalid type';
};

/**
 * @param {?} value Value to check the type of.
 * @param {type} type
 * @return {boolean}
**/
isOfType = function (value, type) {
   // Check if this type is asserting an array of objects.
   if (type instanceof ArrayOf) {
      if (!(value instanceof Array)) return false;
      for (var i = 0; i < value.length; i++) {
         if (!isOfType(value[i], type.type)) return false;
      };
      return true;
   }

   // Check if the type is actually a group of types, any of which are valid.
   if (type instanceof Array) {
      for (var i = 0; i < type.length; i++) {
         if (isOfType(value, type[i])) return true;
      };
      return false;
   };

   // Check for null first.
   if (type === null) return value === null;
   if (type === undefined) return value === undefined;
   if (value === null || value === undefined) return false;
   
   // Handle primitives types differently.
   var isValid = value instanceof type;
   if (isValid || (type !== String && type !== Boolean && type !== Number)) {
      return isValid;
   }
   if (type === String) return typeof value === 'string';
   if (type === Boolean) return typeof value === 'boolean';
   if (type === Number) return typeof value === 'number';
   return false;
};

function ArrayOf (type) {
   this.type = type;
};

insist = {
   args: args,
   ofType: ofType,
   isType: isType,
   isValidType: isValidType,
   isOptionalType: isOptionalType,
   getNameForType: getNameForType,
   getNameForValue: getNameForValue,
   isOfType: isOfType,
   ArrayOf: ArrayOf,
   arrayOf: function (type) {
      return new ArrayOf(type);
   },
   nullable: function (type) {
      return [type, null];
   },
   anything: function () {
      return [Object, String, Number, Boolean, null];
   },
   optional: function (type) {
      return [type, undefined, null];
   }
};

if (process.env.NODE_ENV === 'production' && process.env.INSIST_IN_PROD !== 'true') {
   // We can't noop inist.args because it can be used to shift arguments when dealing with optional
   // arguments.
   var noop = function () {};
   insist.ofType = noop;
   insist.isType = noop;
}

module.exports = insist;
