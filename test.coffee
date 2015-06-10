insist = require("./index")
expect = require("chai").expect

describe "insist", ->

   class Foo 
      constructor: ->

   class Bar extends Foo
      constructor: ->

   describe "args", ->

      it "should not throw with empty args", ->
         insist.args([])

      it "should not throw with expected length", ->
         insist.args(["foo"], String)

      it "should throw if mismatched length", ->
         fn = -> insist.args(["foo"])
         expect(fn).to.throw(Error)

      it "should not throw if optional args are excluded", ->
         insist.args(["foo"], String, insist.optional(String))

      it "should shift arguments for optional types", ->
         insist.args([(->)], insist.optional(Object), Function)

      it "should throw if wrong shifted args", ->
         fn = -> insist.args([{}], insist.optional(String), Number);
         expect(fn).to.throw(Error)

      it "should throw if there isn't a matching optional type", ->
         fn = -> insist.args([{}], insist.optional(String), insist.optional(Number));
         expect(fn).to.throw(Error)

      it "should return the original args if there are no optional types", ->
         result = insist.args([true, "string"], Boolean, String)
         expect(result).to.eql([true, "string"])

      it "should return the shifted args if there are missing optional args", ->
         result = insist.args([true, "false"], Boolean, insist.optional(Object), String)
         expect(result).to.eql([true, null, "false"])

      it "should shift args into non-optional position if multiple args match", ->
         fn = ->
         result = insist.args([fn], insist.optional(Object), Function)
         expect(result).to.eql([null, fn])

      describe "complex optional cases", ->

         it "should pass complex test 1", ->
            fn = ->
            result = insist.args([{}, fn, true, fn], insist.optional(Object), Function,
                  insist.optional(String), insist.optional(Boolean), Function)
            expect(result).to.eql([{}, fn, null, true, fn])

         it "should pass complex test 2", ->
            fn = ->
            result = insist.args([fn, true, fn], insist.optional(Object), Function,
                  insist.optional(String), insist.optional(Boolean), Function)
            expect(result).to.eql([null, fn, null, true, fn])

         it "should pass complex test 3", ->
            test = ->
               fn = ->
               insist.args([fn, {}, fn], insist.optional(Object), Function,
                  insist.optional(String), insist.optional(Boolean), Function)
            expect(test).to.throw(Error)

         it "should pass complex test 4", ->
            fn = ->
            result = insist.args([fn], insist.optional(Function), Function)
            expect(result).to.eql([null, fn])

         it "should pass complex test 5", ->
            fn = ->
            result = insist.args(["foo", "bar", "foobar", fn], String, insist.optional(String), 
                  insist.optional(String), insist.optional(Boolean), Function)
            expect(result).to.eql(["foo", "bar", "foobar", null, fn])

         it "should pass complex test 6", ->
            fn = ->
            result = insist.args(["foo", "bar", fn], String, String, 
                  insist.optional(String), Function)
            expect(result).to.eql(["foo", "bar", null, fn])

   describe "ofType", ->

      it "should throw if value of the wrong type is supplied", ->
         fn = -> insist.ofType("blah", Boolean)
         expect(fn).to.throw(Error)

      it "should not throw if value of the correct type is supplied", ->
         insist.ofType({foo: "bar"}, Object) 

   describe "isValidType", ->

      it "should return true if function is supplied", ->
         expect(insist.isValidType(String)).to.be.true

      it "should return false if primitive is supplied", ->
         expect(insist.isValidType("foo")).to.be.false

      it "should return true if null is supplied", ->
         expect(insist.isValidType(null)).to.be.true

      it "should return true if undefined is supplied", ->
         expect(insist.isValidType(undefined)).to.be.true

      it "should return true if an array of valid types is supplied", ->
         expect(insist.isValidType([String, Boolean])).to.be.true

      it "should return false if an array of invalid types is supplied", ->
         expect(insist.isValidType([String, true])).to.be.false

      it "should return true if an array containing sub array of valid types is supplied", ->
         expect(insist.isValidType([String, [Boolean, null]])).to.be.true

      it "should return true if ArrayOf is supplied with valid inner type", ->
         expect(insist.isValidType(new insist.ArrayOf(Boolean))).to.be.true

      it "should return false if ArrayOf is supplied with invalid inner type", ->
         expect(insist.isValidType(new insist.ArrayOf({}))).to.be.false

   describe "isOptionalType", ->

      it "should return true if undefined is supplied", ->
         expect(insist.isOptionalType(undefined)).to.be.true

      it "should return false if null is supplied", ->
         expect(insist.isOptionalType(null)).to.be.false

      it "should return false if a primitive is supplied", ->
         expect(insist.isOptionalType(Boolean)).to.be.false

      it "should return true if an array with undefined is supplied", ->
         expect(insist.isOptionalType([String, undefined])).to.be.true

      it "should return false if an array without undefined is supplied", ->
         expect(insist.isOptionalType([String, Object])).to.be.false

      it "should return true if an array with undefined in a subarray is supplied", ->
         expect(insist.isOptionalType([String, [undefined, null, Boolean]])).to.be.true

   describe "getNameForValue", ->

      describe "primitives", ->

         it "should return 'null' for null", ->
            expect(insist.getNameForValue(null)).to.equal("null")

         it "should return 'undefined' for undefined", ->
            expect(insist.getNameForValue(undefined)).to.equal("undefined")

         it "should return 'String' for a string", ->
            expect(insist.getNameForValue("foo")).to.equal("String")

         it "should return 'Number' for a number", ->
            expect(insist.getNameForValue(2)).to.equal("Number")

         it "should return 'Boolean' for a boolean", ->
            expect(insist.getNameForValue(false)).to.equal("Boolean")

      describe "Arrays", ->

         it "should return 'Array(empty)' for an empty array", ->
            expect(insist.getNameForValue([])).to.equal("Array(empty)")

         it "should return 'Array(mixed)' for an array with mixed types", ->
            expect(insist.getNameForValue([false, "foo", {}, null])).to.equal("Array(mixed)")

         it "should return array sub types inside brackets", ->
            # expect(insist.getNameForValue([false, false])).to.equal("Array<Boolean>")            
            expect(insist.getNameForValue([["bar", "foobar"]]))
                  .to.equal("Array<Array<String>>")

      describe "Objects, Functions and Classes", ->

         it "should return 'Object' for a plain object", ->
            expect(insist.getNameForValue({foo: true, name: 'Bob'})).to.equal("Object")

         it "should return 'Anonymous function' for an anonymous function", ->
            expect(insist.getNameForValue(->)).to.equal("Anonymous function")            

         it "should return the name of the class for an instance", ->
            expect(insist.getNameForValue(new Foo())).to.equal("Foo")            

   describe "getNameForType", ->

      it "should return 'null' for null", ->
         expect(insist.getNameForType(null)).to.equal("null")

      it "should return 'undefined' for undefined", ->
         expect(insist.getNameForType(undefined)).to.equal("undefined")

      it "should return a list of types if an array is supplied", ->
         expect(insist.getNameForType([Boolean, Foo])).to.equal("Boolean or Foo")

      it "should return subtypes if an ArrayOf type is supplied", ->
         expect(insist.getNameForType(new insist.ArrayOf([Bar]))).to.equal("Array<Bar>")

      it "should return recursive subtypes if an ArrayOf type is supplied", ->
         type = new insist.ArrayOf(new insist.ArrayOf(String))
         expect(insist.getNameForType(type)).to.equal("Array<Array<String>>")

   describe "isOfType", ->

      describe "primitives", ->

         it "should return true if expecting undefined and supplied undefined", ->
            expect(insist.isOfType(undefined, undefined)).to.be.true

         it "should return true if expecting String and supplied string primitive", ->
            expect(insist.isOfType("foo", String)).to.be.true

         it "should return true if expecting String and supplied String object", ->
            expect(insist.isOfType(new String("foo"), String)).to.be.true

         it "should return false if expecting String and string not supplied", ->
            expect(insist.isOfType([2], String)).to.be.false

         it "should return true if expecting Number and supplied number primitive", ->
            expect(insist.isOfType(2, Number)).to.be.true

         it "should return true if expecting Number and supplied Number object", ->
            expect(insist.isOfType(new Number(2), Number)).to.be.true

         it "should return false if expecting Number and number not supplied", ->
            expect(insist.isOfType("2", Number)).to.be.false

         it "should return true if expecting Boolean and supplied boolean primitive", ->
            expect(insist.isOfType(true, Boolean)).to.be.true

         it "should return true if expecting Boolean and supplied Boolean object", ->
            expect(insist.isOfType(new Boolean(true), Boolean)).to.be.true

         it "should return false if expecting Boolean and boolean not supplied", ->
            expect(insist.isOfType(0, Boolean)).to.be.false

      describe "objects and functions", ->

         it "should return true when object is expected and supplied", ->
            expect(insist.isOfType({}, Object)).to.be.true

         it "should return false when object is expected and not supplied", ->
            expect(insist.isOfType(0, Object)).to.be.false

         it "should return true when anonymous function is expected and supplied", ->
            expect(insist.isOfType((->), Function)).to.be.true

         it "should return false when function is expected and not supplied", ->
            expect(insist.isOfType({}, Function)).to.be.false

      describe "classes", ->

         it "should return true when class is compared", ->
            expect(insist.isOfType(new Foo(), Foo)).to.be.true

         it "should return true when superclass is expected and subclass is supplied", ->
            expect(insist.isOfType(new Bar(), Foo)).to.be.true

         it "should return false when class is expected and an object is supplied", ->
            expect(insist.isOfType({}, Foo)).to.be.false

      describe "multiple types", ->

         it "should return true when one of the expected types is supplied", ->
            expect(insist.isOfType("foo", [String, Number])).to.be.true
            expect(insist.isOfType("foo", [Number, String])).to.be.true

         it "should return false when none of the expected types is supplied", ->
            expect(insist.isOfType({}, [String, Number])).to.be.false

      describe "array of type", ->

         it "should return true when an array of expected primitive type is supplied", ->
            expect(insist.isOfType([true, false], insist.arrayOf(Boolean))).to.be.true

         it "should return true when an array of expected object type is supplied", ->
            expect(insist.isOfType([{}, {}], insist.arrayOf(Object))).to.be.true

         it "should return false when an array of expected type is not supplied", ->
            expect(insist.isOfType([true, "false"], insist.arrayOf(Boolean))).to.be.false

         it "should return false when an array is expected but not supplied", ->
            expect(insist.isOfType({}, insist.arrayOf(String))).to.be.false

   describe "nullable", ->

      it "should pass isOfType", ->
         insist.isOfType(null, insist.nullable(String))
         insist.isOfType("foo", insist.nullable(String))
