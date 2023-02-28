import * as escodegen from "escodegen";
import * as espree from "espree";
import * as estraverse from "estraverse";
import * as fs from "fs/promises";

export async function transpile(inputFile, outputFile) {
  let input = await fs.readFile(inputFile, 'utf-8')
  const output = addLogging(input);
  if (outputFile === undefined) {
      console.log(output);
      return;
  }
  await fs.writeFile(outputFile, output)
}

export function addLogging(code) {
  const ast = espree.parse(code, { ecmaVersion: espree.latestEcmaVersion, loc: true});
  estraverse.traverse(ast, {
    enter: function(node, parent){
      if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
        addBeforeCode(node);
      }
    }
  });
  return escodegen.generate(ast);
}

function addBeforeCode(node) {
  const name = node.id ? node.id.name : '<anonymous function>' ;
  const args = node.params.map(p => `$\{${p.name}}`).join(', ');
  const beforeCode = "console.log(`Entering " + name + "(" + args + ") at line " + node.loc.start.line + "`);";
  const beforeNodes = espree.parse(beforeCode, { ecmaVersion: espree.latestEcmaVersion, loc: true }).body;
  node.body.body = beforeNodes.concat(node.body.body);
}
