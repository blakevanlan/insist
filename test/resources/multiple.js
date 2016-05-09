function Foo(str, num) {
   insist.args(arguments, String, Number);
   var a = 'b';
};

function Bar() {
   insist.args(arguments);
   var c = 'd';
   insist.ofType(c, String);
};
