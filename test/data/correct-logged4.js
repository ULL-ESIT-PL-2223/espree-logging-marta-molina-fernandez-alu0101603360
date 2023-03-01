function foo(a, b) {
    console.log(`Entering foo(${ a }, ${ b }) at line 1`);
    var x = 'chuchu';
    var y = function (z) {
        console.log(`Entering <anonymous function>(${ z }) at line 3`);
        return z / 3;
    }(6);
}
foo(1, 'wut', 3);