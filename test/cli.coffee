Remover = require("../lib/remover")
expect = require("chai").expect
fs = require("fs")
ncp = require("ncp").ncp
rmrf = require("rmrf")

bin = require("../bin/insist-types");

describe "cli", ->

   beforeEach (done) ->
      log = ""
      @logger = {
         log: (message) -> log += message + "\n"
         time: ->
         timeEnd: (message) -> log += message + "\n"
         getLog: -> return log
      }
      ncp("./test/resources", "./test/tmp-res", {clobber: true}, done)

   afterEach ->
      rmrf("./test/tmp-res")

   it "should remove insist-types from included files", (done) ->
      argv = process.argv
      process.argv = "node insist-types -i ./test/tmp-res/single.js".split(" ")

      bin.execute @logger, ->
         process.argv = argv
         source = fs.readFileSync("./test/tmp-res/single.js").toString()
         expect(source).to.equal("function Foo(str, num) {\n   var a = 'b';\n};\n")
         done()

   it "should remove insist-types from included directory", (done) ->
      argv = process.argv
      process.argv = "node insist-types -i ./test/tmp-res".split(" ")

      bin.execute @logger, ->
         process.argv = argv
         # single.js
         source = fs.readFileSync("./test/tmp-res/single.js").toString()
         expect(source).to.equal("function Foo(str, num) {\n   var a = 'b';\n};\n")
         # multiple.js
         source = fs.readFileSync("./test/tmp-res/multiple.js").toString()
         expect(source).to.equal("function Foo(str, num) {\n   var a = 'b';\n};\n\nfunction Bar() {\n   var c = 'd';\n};\n")
         
         done()

   it "should remove aliased references", (done) ->
      argv = process.argv
      process.argv = "node insist-types -i ./test/tmp-res/aliased.js -a assertArgs -t assertOfType".split(" ")

      bin.execute @logger, ->
         process.argv = argv
         source = fs.readFileSync("./test/tmp-res/aliased.js").toString()
         expect(source).to.equal("function Foo(str) {\n   var a = 'b';\n};\n")
         done()
