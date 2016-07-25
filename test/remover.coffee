Remover = require("../lib/remover")
expect = require("chai").expect
fs = require("fs")

describe "remover", ->

   it "should remove single reference, including the preceding space", ->
      remover = new Remover()
      result = remover.removeInsist(fs.readFileSync("./test/resources/single.js").toString())
      expected = "function Foo(str, num) {\n   var a = 'b';\n};\n"
      expect(result).to.equal(expected);

   it "should remove multiple references, including the preceding space", ->
      remover = new Remover()
      result = remover.removeInsist(fs.readFileSync("./test/resources/multiple.js").toString())
      expected = "function Foo(str, num) {\n   var a = 'b';\n};\n\nfunction Bar() {\n   var c = 'd';\n};\n"
      expect(result).to.equal(expected);

   it "should not remove references that are shifting arguments", ->
      remover = new Remover()
      result = remover.removeInsist(fs.readFileSync("./test/resources/shifted.js").toString())
      expected = "function Foo(str, num) {\n   var a = 'b';\n};\n\nfunction Bar(str, fn) {\n   var args = insist.args(arguments, insist.optional(String), Function);\n   var c = 'd';\n};\n"
      expect(result).to.equal(expected);

   it "should only remove references that are calling the method", ->
      remover = new Remover()
      result = remover.removeInsist(fs.readFileSync("./test/resources/referenced.js").toString())
      expected = "function Foo(str, num) {\n   console.log(insist.args);\n};\n";
      expect(result).to.equal(expected);

   describe "options", ->

      it "should remove aliased references", ->
         remover = new Remover({
            aliases: {
               args: 'assertArgs',
               ofType: 'assertOfType'
            }
         });
         result = remover.removeInsist(fs.readFileSync("./test/resources/aliased.js").toString())
         expected = "function Foo(str) {\n   var a = 'b';\n};\n";
         expect(result).to.equal(expected);
