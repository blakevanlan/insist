var insist = require("../index");

var Remover = module.exports = function Remover(options) {
   insist.args(arguments, insist.optional(Object));
   options = options || {};
   this.aliases_ = Remover.parseAliases_(options.aliases);
};

Remover.prototype.removeInsist = function(source) {
   insist.args(arguments, String);
   for (var aliasName in this.aliases_) {
      source = this.removeAlias_(source, this.aliases_[aliasName]);
   }
   return source;
};

Remover.prototype.removeAlias_ = function(source, alias) {
   insist.args(arguments, String, RegExp);
   var result;
   var references = [];
   // Find all of the references in the source.
   while ((result = alias.exec(source)) !== null) {
      var reference = this.findReference_(source, result.index, result[0]);
      if (!reference.isShifting) {
         references.push(reference);
      }
   }
   // Remove the references, starting from the end to maintain the proper indices.
   for (var i = references.length - 1; i >= 0; i--) {
      source = source.slice(0, references[i].startIndex) + source.slice(references[i].endIndex);
   }
   return source;
};

/**
 * Determines the length of the reference, return an object with alias, startIndex and endIndex.
 * The endIndex is exclusive.
 */
Remover.prototype.findReference_ = function(source, startIndex, alias) {
   insist.args(arguments, String, Number, String);
   return {
      alias: alias,
      startIndex: this.determineStatementStartIndex_(source, startIndex),
      endIndex: this.determineStatementEndIndex_(source, startIndex, alias),
      isShifting: this.determineIsShifting_(source, startIndex),
   };
};

/**
 * Determines the start of the insist statement including removing the preceding space and endline.
 * Only remove the spaces preceding the insist statement if they are preceded by an endline.
 */
Remover.prototype.determineStatementStartIndex_ = function(source, startIndex) {
   insist.args(arguments, String, Number);
   var char;
   var index = startIndex;
   do {
      index--;
      char = source[index];
   } while (index > 0 && char === ' ');
   
   return (char === '\n') ? index : startIndex;
};

/** Determines the end of the insist statement. Returned value is exclusive end index. */
Remover.prototype.determineStatementEndIndex_ = function(source, startIndex, alias) {
   insist.args(arguments, String, Number, String);
   var char;
   var openParenthesesCount = 0;
   var endIndex = startIndex + alias.length - 1;
   while (endIndex < source.length && (char !== ')' || openParenthesesCount > 0)) {
      endIndex++;
      char = source[endIndex];
      if (char === '(') {
         openParenthesesCount++;
      } else if (char === ')') {
         openParenthesesCount--;
      }
   }
   if (source[endIndex + 1] === ';') {
      endIndex++;
   }
   return endIndex + 1;
};

/** Determines if the return value is being used. */
Remover.prototype.determineIsShifting_ = function(source, startIndex) {
   insist.args(arguments, String, Number);
   var char;
   var index = startIndex;
   do {
      index--;
      char = source[index];
   } while (index > 0 && (char === ' ' || char === '\n'));
   return char === '=';
};

Remover.parseAliases_ = function(optionAliases) {
   insist.args(arguments, insist.optional(Object));
   optionAliases = optionAliases || {};
   var defaultAliases = {
      args: 'insist.args',
      ofType: 'insist.ofType'
   };
   var result = {};
   for (var aliasName in defaultAliases) {
      var alias = optionAliases[aliasName] || defaultAliases[aliasName];
      insist.ofType(alias, String);
      result[aliasName] = new RegExp(alias.replace(/\./g, '\\.'), 'g');
   }
   return result;
};
