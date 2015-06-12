
/**
 * Asserts that the arguments supplied are what's expected. If an argument can be multiples
 * types, use an array of acceptable types. 
 * @param {Array.<?>} args
 * @param {?,..} expected types
 * @return Returns an array with the arguments shifted into the correct indices.
**/
var args = function (args) {
   // Find the minimum expected length.
   var expected = Array.prototype.slice.call(arguments, 1);
   var minimum = expected.length
   var hasOptionalTypes = false;
   
   for (var i = 0; i < expected.length; i++) {
      if (!isValidType(expected[i])) {
         throw Error('Expected argument ' + i + ' is not a valid type.');
      }
      if (isOptionalType(expected[i])) {
         minimum--;
         hasOptionalTypes = true;
      }
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

   // We don't have to worry about shifting if all the arguments are present.
   if (args.length === expected.length) {
      for (var i = 0; i < expected.length; i++) {
         if (!isOfType(args[i], expected[i])) {
            throw Error(getExpectedVsRecieved_(expected, args));
         }
      };
      return args;
   }

   return shiftArguments_(expected, args, minimum);
};


/**
 * Returns an array of all of the arguments shifted into the correct place.
 * @param {Array} expected
 * @param {Array} actual
 * @returns {Array}
 * @private
 */
var shiftArguments_ = function (expected, args, minimum) {
   var shiftedArgs = [];
   var j = 0;
   var curArg = args.length - 1;
   var remainingOptionalArgs = expected.length - minimum;
   var optionalIndiceChunks = [];
   var optionalIndiceChunk = [];
   var availableArgsChunks = [];
   var availableArgsChunk = [];

   // Fill the return array with nulls first.
   for (var i = 0; i < expected.length; i++) shiftedArgs[i] = null;

   // Capture groups of available arguments separated by ones that have been used.
   var advanceArg = function () {
      availableArgsChunk.unshift(curArg);
      curArg--;
      remainingOptionalArgs--;
      if (curArg < 0 || remainingOptionalArgs < 0) {
         throw Error(getExpectedVsRecieved_(expected, args));
      }
   };

   // First fill in all of the required types.
   for (i = expected.length - 1; i >= 0; i--) {
      var type = expected[i];
      if (isOptionalType(type)) {
         optionalIndiceChunk.unshift(i);
         continue;
      }
      // Keep moving down the line of arguments until one matches.
      while (!isOfType(args[curArg], type)) {
         advanceArg();
      }

      // Check how many optional types in front of this argument that match the current value.
      j = i + 1;
      var matchingOptionals = 0;
      var inBetweenOptionals = 0;
      var tmpInBetween = 0;
      while (j < expected.length && isOptionalType(expected[j])) {
         if (isOfType(args[curArg], expected[j])) {
            matchingOptionals++;
            inBetweenOptionals += tmpInBetween;
            tmpInBetween = 0;
         } else {
            tmpInBetween++;
         }
         j++;
      }

      // Check how many required types are behind this argument that match the current value. We
      // will then use this value to determine if the current argument can be allowed to fill an
      // optional spot instead of a required one.
      j = i - 1;
      var matchingRequireds = 0
      while (j >= 0) {
         if (!isOptionalType(expected[j]) && isOfType(args[curArg], expected[j])) {
            matchingRequireds++;
         }
         j--;
      }

      // Now that we have found the consecutive matching types, more forward through the arguments
      // to see if there are enough to fill the option types.
      var matchesRequired = 1 + matchingRequireds;
      var availableDistance = matchingRequireds + inBetweenOptionals + matchingOptionals;

      // Determine if there are enough optional arguments.
      j = curArg - 1;
      while (j >= 0 && availableDistance > 0 && matchesRequired > 0) {
         if (isOfType(args[j], type)) {
            matchesRequired--;
         }
         availableDistance--;
         j--;
      }
      if (matchesRequired <= 0) {
         // Found enough matches to let this be an optional argument. Advance the argument and
         // then restart on this same function.
         advanceArg();
         i++;
         continue;
      }

      // Capture groups of optional arguments separated by required arguments and rest the chunk
      // arrays to prepare for the next grouping.
      optionalIndiceChunks.unshift(optionalIndiceChunk);
      optionalIndiceChunk = [];
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
      throw Error(getExpectedVsRecieved_(expected, args));
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
            throw Error(getExpectedVsRecieved_(expected, args));
         }
         // Success! This is an optional expected argument.
         shiftedArgs[optionalIndices[i++]] = arg;
      });
   });

   return shiftedArgs;
};

/**
 * Returns a string of expected arguments vs actual.
 * @param {Array} expected
 * @param {Array} actual
 * @returns {string}
 * @private
 */
var getExpectedVsRecieved_ = function (expected, actual) {
   var argNames = [];
   var expectedNames = [];
   for (var i = 0; i < actual.length; i++) {
      argNames.push(getNameForValue(actual[i]));
   };
   for (var i = 0; i < expected.length; i++) {
      expectedNames.push(getNameForType(expected[i]));
   };
   return 'Expected arguments to be (' + expectedNames.join(', ') + ') but received (' +
         argNames.join(', ') + ') instead.';
};

/**
 * Asserts that the supplied value is of the supplied type.
 * @param {?} value
 * @param {type} types
**/
var ofType = function (value, type) {
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
var isType = function (type) {
   if (!isValidType(type)) {
      throw Error('Expected a type but received ' + type + '.'); 
   }
};

/**
 * Determines if the argument is a valid type.
 * @param {type} type
 * @return {boolean} 
**/
var isValidType = function (type) {
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
var isOptionalType = function (type) {
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
var getNameForValue = function (value) {
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
var getNameForType = function (type) {
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
var isOfType = function (value, type) {
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
   var actualType = typeof value
   if (type === String) return actualType === 'string';
   if (type === Boolean) return actualType === 'boolean';
   if (type === Number) return actualType === 'number';
   return false;
};

function ArrayOf (type) {
   this.type = type;
};

var insist = {
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
