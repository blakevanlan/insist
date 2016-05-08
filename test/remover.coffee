Remover = require("../lib/remover")
expect = require("chai").expect
fs = require("fs")

describe "remover", ->

   describe "findReference_", ->

   it "should remove single reference", ->
      remover = new Remover()
      result = remover.removeInsist(fs.readFileSync("./test/resources/single.js").toString())
      expected = "function Foo(str) {\n   var a = 'b';\n};\n"
      expect(result).to.equal(expected);
