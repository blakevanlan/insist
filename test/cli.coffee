Remover = require("../lib/remover")
expect = require("chai").expect
fs = require("fs")

describe "cli", ->

  it("compiles the assets out to disk", function (done) {
    var argv = process.argv;
    process.argv = "node connect-assets -i test/assets/js -i test/assets/css".split(" ");

    bin.execute(this.logger, function () {
      process.argv = argv;
      rmrf("builtAssets", done);
    });
  });