function foo(a, b, c) {
    let x = (e => { return e * 2 })(7);
    let y = (function (x) { return x**x })(2);
    console.log(x,y);
  }
foo(8, 'wut', 3);