# Práctica Espree logging
## Indicar los valores de los argumentos

Se ha modificado el código de `logging-espree.js` para que el log también indique los valores de los argumentos que se pasaron a la función. 
Ejemplo:

```javascript
function foo(a, b) {
  var x = 'blah';
  var y = (function (z) {
    return z+3;
  })(2);
}
foo(1, 'wut', 3);
```

```javascript
function foo(a, b) {
    console.log(`Entering foo(${ a }, ${ b })`);
    var x = 'blah';
    var y = function (z) {
        console.log(`Entering <anonymous function>(${ z })`);
        return z + 3;
    }(2);
}
foo(1, 'wut', 3);
```

## CLI con [Commander.js](https://www.npmjs.com/package/commander)

Implementamos las opciones en linea de comandos en el fichero [log.js](bin/log.js) usando la librería commander:

```javascript
program
  .version(version)
  .argument("<filename>", 'file with the original code')
  .option("-o, --output <filename>", "file in which to write the output")
  .action((filename, options) => {
    transpile(filename, options.output);
  });

program.parse(process.argv);
```

## Reto 1: Soportar funciones flecha

Para soportar las fuciones ```function``` y las entradas arrow ```=> {...} ``` se pone una condición en la función addLogging del archivo [logging-espree.js](/src/logging-espree.js):

```javascript
if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') {
    addBeforeCode(node);
}
```
Con esta condición, al entrar en el nodo solo se ejecutará addBeforeCode si la entrada es una función (anónima o no) o una función arrow.

## Reto 2: Añadir el número de línea

Para añadir el número de línea se ha modificado la función addBeforeCode del fichero [logging-espree.js](/src/logging-espree.js):

```javascript
  const beforeCode = "console.log(`Entering " + name + "(" + args + ") at line " + node.loc.start.line + "`);";
```
Para que se detecte correctamente el número de línea con ```node.loc.start.line``` deberemos incluir ```{ ecmaVersion: espree.latestEcmaVersion, loc: true } ``` al parsear. En caso de no incluir el loc, no entenderá la propiedad loc.start.line y en consecuencia dará error. Y la última versión de ECMA sirve para procesar el token `

## Scripts de [package.json](package.json) <a name="scripts"></a>

Para esta práctica he visto conveniente añadir los siguientes scripts para probar los tests, ya sea individualmente (*test1*) o probando todos los ficheros de prueba (*test*). También con *test1node* vemos el resultado del primer archivo test. Por último realizamos el estudio de covertura con *npm run cov*. Para ello es importante usar c8 en lugar de nyc, como en casos anteriores, pues nyc analiza los *import* y en estos archivos importamos con *require*. c8 no tiene este problema.

```json
"scripts": {
    "test": "mocha test/test.mjs",
    "test1": "bin/log.js test/data/test1.js",
    "test1node": "bin/log.js test/data/test1.js | node -",
    "cov": "c8 npm run test"
},
```
Hay que mostrar que para que funcione el testeo con mocha y el covering con c8 hubo que añadir las dependencias pertinentes en el [package.json](package.json):
```json
"dependencies": {
    "acorn": "^8.8.2",
    "commander": "^10.0.0",
    "escodegen": "^2.0.0",
    "espree": "^9.4.1",
    "estraverse": "^5.2.0",
    "mocha": "^9.2.0",
    "nyc": "^15.1.0",
    "underscore": "^1.12.0",
    "c8": "^7.13.0"
},
"devDependencies": {
    "mocha": "^10.2.0"
},
```

## Tests

Para poder testear los ficheros de prueba primero había que terminar de implementar el fichero [test.js](./test/test.mjs):

```javascript
for (let i = 0; i < Test.length; i++) {
  it(`transpile(${Tst[i].input}, ${Tst[i].output})`, async () => {

    // Compile the input and check the output program is what expected
    await transpile(Test[i].input, Test[i].output);
    let output = await fs.readFile(Test[i].output, 'utf-8')
    let expected = await fs.readFile(Test[i].correctLogged, 'utf-8')
    assert.equal(removeSpaces(output), removeSpaces(expected));
    await fs.unlink(Test[i].output);

    // Run the output program and check the logged output is what expected
    let correctOut = await fs.readFile(Test[i].correctOut, 'utf-8')
    let oldLog = console.log; // mocking console.log
    let result = "";
    console.log = function (...s) { result += s.join('') }
      eval(output);
      assert.equal(removeSpaces(result), removeSpaces(correctOut))
    console.log = oldLog;
  });
}
```
Su contenido varía únicamente en la forma de llamar al array de test. A diferneica de práctcas anteriores, la nomeclatura actual es correctLogged.

Además de esta implementación he creado dos archivos de prueba más para asegurar el correcto comportamiento de las funciones. Estos archivos son [test4.js](test/data/test4.js) y [test5.js](test/data/test5.js). También han de incluirse en el fichero [test-description.mjs](./test/test-description.mjs)

### [test4.js](test/data/test4.js)

```javascript
function foo(a, b) {
    var x = 'chuchu';
    var y = (function (z) {
      return z/3;
    })(6);
  }
foo(1, 'wut', 3);
```

### [test5.js](test/data/test5.js)

```javascript
function foo(a, b, c) {
    let x = (e => { return e * 2 })(7);
    let y = (function (x) { return x**x })(2);
    console.log(x,y);
  }
foo(8, 'wut', 3);
```

### [test-description.mjs](./test/test-description.mjs)

```javascript
{
    input: 'test4.js',
    output: 'logged4.js',
    correctLogged: 'correct-logged4.js',
    correctOut: 'logged-out4.txt'
  },
  {
    input: 'test5.js',
    output: 'logged5.js',
    correctLogged: 'correct-logged5.js',
    correctOut: 'logged-out5.txt'
  },
```

### Resultados

Todos los test pasan la prueba:

![test](/docs/img/test.png)

## Covering

Sobre el estudio de cobertura no hay más que comentar que lo mencionado en el [apartado](#scripts) de los scripts del [package.json](package.json) sobre el uso de c8 en lugar de nyc. Vemos el correcto funcionamiento de la herramienta:

![cov](/docs/img/cov.png)

## GitHub Actions

Para la integración continua ha sido necesario crear los directorios .github y workflows y dentro de este último el fichero [mpdejs.yml](.github/workflows/nodejs.yml). En este último fichero configuramos cómo y cuándo queremos que se ejecute la integración continua. En este caso, se ejecutará el comando ci (clean and install) y se probarán los test cada vez que se haga un push en la rama main.
  
```yaml
  - run: npm ci
  - run: npm test
``` 

## Documentación

Para la publicar la documentación he creído conveniente crear una [página web](https://ull-esit-pl-2223.github.io/espree-logging-marta-molina-fernandez-alu0101603360/) gracias a ```documentation build src/** -f html -o docs``` y subirla a GitHub Pages. El comando en cuestión genera la documentación en formato html y la guarda en el directorio docs. Luego para visualizarla en el buscador usamos ```npx http-server docs -p 8005```. Observamos parte de la [página web](https://ull-esit-pl-2223.github.io/espree-logging-marta-molina-fernandez-alu0101603360/):

![doc](/docs/img/page.png)

## Versionado semántico en la evolución del módulo

Para el versionado he usado tags con el objetivo de hacer la diferenciación de versiones. Para crear una etiqueta usamos ```git tag <version>``` y luego subimos la misma al repositorio con ```git push origin master --tags```. En este caso, las versiones inciales creadas son la 1.0.0.

![tag](/docs/img/tag0.png)
![tag](/docs/img/tag1.png)

## Publicación del paquete npmjs

Publicar el paquete ha sido una tarea compleja pues se han dado gran cantidad de errores de verificación y propiedad:

![npm](/docs/img/err1.png)
![npm](/docs/img/err2.png)

Finalmente, tras cambiar el ámbito de la publicación al mismo nombre de usuario de la cuenta de npm  (martamolf19), conseguí publicar el paquete. Antes de ello tuve que crear un token de acceso en github y en npm para obtener permisos sobre el repositorio y la publicación además de modificar el fichero [package.json](package.json) en numerosas ocasiones para evitar errores.

Vemos el inicio de sesión en la cuenta npm desde la terminal:

![npm](/docs/img/login.png)

Y el cambio más relevante en el [package.json](./package.json) en el que declaramos el ámbito:

```json
"name": "martamolf19",
"version": "1.0.1",
```

### Publicación del paquete

Publicamos con ```npm publish --access public```. Vemos que se ha publicado correctamente en la [página de npm](https://www.npmjs.com/package/martamolf19?activeTab=versions):

![npm](/docs/img/publi_pack.png)
![npm](/docs/img/npm_pack_page.png)

E instalamos el paquete publicado en la terminal con ```npm i martamolf19```:

![npm](/docs/img/instalado_martamolf19.png)

