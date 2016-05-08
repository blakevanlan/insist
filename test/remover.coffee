Remover = require("../lib/remover")
expect = require("chai").expect
fs = require("fs")

describe "remover", ->

   it "should remove single reference, including the preceding space", ->
      remover = new Remover()
      result = remover.removeInsist(fs.readFileSync("./test/resources/single.js").toString())
      expected = "function Foo(str, num) {\n   var a = 'b';\n};\n"
      expect(result).to.equal(expected);

   it.only "should remove multiple references, including the preceding space", ->
      remover = new Remover()
      result = remover.removeInsist(fs.readFileSync("./test/resources/multiple.js").toString())
      expected = "function Foo(str, num) {\n   var a = 'b';\n};\n\nfunction Bar() {\n   var c = 'd';\n};\n";
      expect(result).to.equal(expected);
