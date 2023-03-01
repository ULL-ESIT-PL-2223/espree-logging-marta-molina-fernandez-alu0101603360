function foo(a, b) {
    var x = 'chuchu';
    var y = (function (z) {
      return z/3;
    })(6);
  }
foo(1, 'wut', 3);