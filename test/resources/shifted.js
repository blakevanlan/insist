function Foo(str, num) {
   insist.args(arguments, String, Number);
   var a = 'b';
};

function Bar(str, fn) {
   var args = insist.args(arguments, insist.optional(String), Function);
   var c = 'd';
};
