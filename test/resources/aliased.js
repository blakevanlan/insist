function Foo(str) {
   assertArgs(arguments, nullable(String));
   assertOfType(str, String);
   var a = 'b';
};
