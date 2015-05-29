
/**
 * Asserts that the arguments supplied are what's expected. If an argument can be multiples
 * types, use an array of acceptable types. 
 * @param {Array.<?>} args
 * @param {?,..} expected types
**/
args = function (args) {
   // Find the minimum expected length.
   expected = Array.prototype.slice.call(arguments, 1);
   minimum = expected.length
   for (var i = 0; i < expected.length; i++) {
      if (isOptionalType(expected[i])) {
         minimum--;
      }
   } 
   // Check if the args and expected lengths are different (and there are no optional args).
   if (minimum == expected.length && args.length != expected.length) {
      throw Error('Expected ' + expected.length + ' arguments but received ' +
            args.length + ' instead.');
   }
   // Chick if the args are within the expected range.
   if (args.length < minimum || args.length > expected.length) {
      throw Error('Expected between ' + minimum + ' and ' + expected.length +
            ' arguments but received ' + args.length + ' instead.');
   }

   for (var i = 0; i < expected.length; i++) {
      type = expected[i];
      if (!isValidType(type)) {
         throw Error('Expected argument ' + i + ' is not a valid type.');
      }
      if (!isOfType(args[i], type)) {
         argName = getNameForValue(args[i]);
         typeName = getNameForType(type);
         throw Error('Expected argument ' + i + ' to be an instance of ' + typeName +
               ' but received ' + argName + 'instead.');
      }
   }
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
      argName = scope.getNameForValue(value);
      typeName = scope.getNameForType(type);
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
   var noop = function () {};
   insist.args = noop;
   insist.ofType = noop;
   insist.isType = noop;
}

module.exports = insist;
