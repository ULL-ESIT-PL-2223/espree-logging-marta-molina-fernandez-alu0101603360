function foo(a, b, c) {
    console.log(`Entering foo(${ a }, ${ b }, ${ c }) at line 1`);
    let x = (e => {
        console.log(`Entering <anonymous function>(${ e }) at line 2`);
        return e * 2;
    })(7);
    let y = function (x) {
        console.log(`Entering <anonymous function>(${ x }) at line 3`);
        return x ** x;
    }(2);
    console.log(x, y);
}
foo(8, 'wut', 3);