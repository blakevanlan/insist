(function () {
var root = this;
var previousInstance = root.insist;
var isDisabled = false;

// Return the existing instance if already on global scope.
if (root.insist) return root.insist;

// Set the isDisabled flag if in production.
if (typeof process !== 'undefined') {
   if (process.env) {
      isDisabled = process.env.NODE_ENV === 'production' && process.env.INSIST_IN_PROD !== 'true';
   }
}

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
   if (isDisabled && !hasOptionalTypes) {
      return [];
   }

   // Check if the args and expected lengths are different (and there are no optional args).
   if (minimum == expected.length && args.length != expected.length) {
      throw Error(getExpectedVsRecieved_(expected, args));
   }
   // Check if the args are within the expected range.
   if (args.length < minimum || args.length > expected.length) {
      throw Error(getExpectedVsRecieved_(expected, args));
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
   var curArg = args.length - 1;
   var remainingOptionalArgs = expected.length - minimum;
   var optionalIndiceSegments = [];
   var optionalIndiceSegment = [];
   var availableArgsSegments = [];
   var availableArgsSegment = [];

   // Fill the return array with nulls first.
   for (var i = 0; i < expected.length; i++) shiftedArgs[i] = null;

   // Capture groups of available arguments separated by ones that have been used.
   var advanceArg = function () {
      availableArgsSegment.unshift(curArg);
      curArg--;
      remainingOptionalArgs--;
      if (curArg < 0 || remainingOptionalArgs < 0) {
         throw Error(getExpectedVsRecieved_(expected, args));
      }
   };

   // Fill in all of the required types, starting from the last expected argument and working
   // towards the first.
   for (i = expected.length - 1; i >= 0; i--) {
      var type = expected[i];
      if (isOptionalType(type)) {
         optionalIndiceSegment.unshift(i);
         continue;
      }
      // Keep moving down the line of arguments until one matches.
      while (!isOfType(args[curArg], type)) {
         advanceArg();
      }

      // Check if this argument should be left for a trailing optional argument.
      if (checkIfShouldLeaveArgument_(expected, i, args, curArg)) {
         // Found enough matches to let this be an optional argument. Advance the argument and
         // then restart on this same function.
         advanceArg();
         i++;
         continue;
      }

      // Capture groups of optional arguments separated by required arguments.
      optionalIndiceSegments.unshift(optionalIndiceSegment);
      optionalIndiceSegment = [];
      availableArgsSegments.unshift(availableArgsSegment);
      availableArgsSegment = []
      shiftedArgs[i] = args[curArg--];
   }
   // Now that we have found all the required arguments, group the rest for processing with optional
   // arguments.
   while (curArg >= 0) availableArgsSegment.unshift(curArg--);
   availableArgsSegments.unshift(availableArgsSegment);
   optionalIndiceSegments.unshift(optionalIndiceSegment);

   // Make sure that the optional argument count matches up correctly.
   if (availableArgsSegments.length != optionalIndiceSegments.length) {
      throw Error(getExpectedVsRecieved_(expected, args));
   }

   // Go through all the optional segments and argument segments to match up the optional arguments.
   optionalIndiceSegments.forEach(function (optionalIndices, index) {
      availableArgsSegment = availableArgsSegments[index];
      i = 0;
      availableArgsSegment.forEach(function (argIndex) {
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
 * Checks if the current argument should be left for an optional argument.
 * @param {Array} expected
 * @param {number} expectedIndex
 * @param {?} value
 * @returns {bool}
 * @private
 */
var checkIfShouldLeaveArgument_ = function (expected, expectedIndex, actual, actualIndex) {
   // Check how many optional types in front of this argument that match the current value.
   var consecutiveOptionals = countTrailingOptionals_(expected, expectedIndex, actual[actualIndex]);

   // Check how many required types are behind this argument that match the current value. We
   // will then use this value to determine if the current argument can be allowed to fill an
   // optional spot instead of a required one.
   var matchingRequires = countLeadingMatchingRequires_(expected, expectedIndex,
         actual[actualIndex]);

   // Now that we have found the consecutive matching types, more forward through the arguments
   // to see if there are enough to fill the option types.
   var matchesRequired = 1 + matchingRequires;
   var availableDistance = matchingRequires + consecutiveOptionals;

   // Determine if there are enough optional arguments.
   var i = actualIndex - 1;
   var type = expected[expectedIndex];
   while (i >= 0 && availableDistance > 0 && matchesRequired > 0) {
      if (isOfType(actual[i], type)) {
         matchesRequired--;
      }
      availableDistance--;
      i--;
   }
   return matchesRequired <= 0;
};

/**
 * Counts the number of trailing, consecutive optional arguments.
 * @param {Array} expected
 * @param {number} expectedIndex
 * @param {?} value
 * @returns {number}
 * @private
 */
var countTrailingOptionals_ = function (expected, expectedIndex, value) {
   var i = expectedIndex + 1;
   var matchingOptionals = 0;
   var inBetweenOptionals = 0;
   var tmpInBetween = 0;
   while (i < expected.length && isOptionalType(expected[i])) {
      if (isOfType(value, expected[i])) {
         matchingOptionals++;
         inBetweenOptionals += tmpInBetween;
         tmpInBetween = 0;
      } else {
         tmpInBetween++;
      }
      i++;
   }
   return matchingOptionals + inBetweenOptionals;
};

/**
 * Counts the number of leading required arguments.
 * @param {Array} expected
 * @param {number} expectedIndex
 * @param {?} value
 * @returns {number}
 * @private
 */
var countLeadingMatchingRequires_ = function (expected, expectedIndex, value) {
   var i = expectedIndex - 1;
   var matchingRequires = 0
   while (i >= 0) {
      if (!isOptionalType(expected[i]) && isOfType(value, expected[i])) {
         matchingRequires++;
      }
      i--;
   }
   return matchingRequires;
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
   if (type instanceof AnyType) return true;
   if (type instanceof Array) {
      // An array is only valid if it contains one or more valid types.
      if (!type.length) return false;
      for (var i = 0; i < type.length; i++) {
          if (!isValidType(type[i])) return false;
      };
      return true;
   }
   if (type instanceof ArrayOf) return isValidType(type.type);
   if (type instanceof EnumType) return (type.enumerable instanceof Object);
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
   if (type === null) return 'null';

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
   // Check if this type is asserting a type.
   if (type instanceof AnyType) {
      return isValidType(value);
   }

   // Check if this type is asserting an enum.
   if (type instanceof EnumType) {
      for (var key in type.enumerable) {
         if (type.enumerable.hasOwnProperty(key)) {
            if (type.enumerable[key] === value) {
               return true;
            }
         }
      }
      return false;
   }

   // Check if this type is asserting a typed array.
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

function AnyType () {
};

function EnumType (enumerable) {
   this.enumerable = enumerable;
};

var noop = function () {};
var insist = function (options) {
   options = options || {};

   // Handle isDisabled option.
   if (options.isDisabled == true) {
      isDisabled = true;
      // We can't noop inist.args because it can be used to shift arguments when dealing with
      // optional arguments.
      insist.ofType = noop;
      insist.isType = noop;
   } else {
      isDisabled = false;
      insist.ofType = ofType;
      insist.isType = isType;
   }
   return insist;
};

// Added the API methods.
insist.args = args;
insist.ofType = ofType;
insist.isType = isType;
insist.isValidType = isValidType;
insist.isOptionalType = isOptionalType;
insist.getNameForType = getNameForType;
insist.getNameForValue = getNameForValue;
insist.isOfType = isOfType;
insist.ArrayOf = ArrayOf;
insist.Type = AnyType;
insist.Enum = EnumType;
insist.arrayOf = function (type) {
   return new ArrayOf(type);
};
insist.nullable = function (type) {
   return [type, null];
};
insist.anything = function () {
   return [Object, String, Number, Boolean, null];
};
insist.optional = function (type) {
   return [type, undefined, null];
};
insist.type = function (type) {
   return new AnyType()
};
insist.enum = function (enumerable) {
   return new EnumType(enumerable)
};

// Export the script.
if (typeof module !== 'undefined') {
   module.exports = insist;
} else {
   root.insist = insist;
}

}).call(this);
