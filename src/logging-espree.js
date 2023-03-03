import * as escodegen from "escodegen";
import * as espree from "espree";
import * as estraverse from "estraverse";
import * as fs from "fs/promises";

/**
 * Transpile the input file and write the output to the output file or to the console.
 * @param {inputFile} - File with the input code to be transpiled.
 * @param {outputFile} - Optional file in which to write the output.
 * @returns {Promise<void>} - A promise that resolves when the output is written or printed in the console.
 */
export async function transpile(inputFile, outputFile) {
  let input = await fs.readFile(inputFile, 'utf-8')
  const output = addLogging(input);
  if (outputFile === undefined) {
      console.log(output);
      return;
  }
  await fs.writeFile(outputFile, output)
}

/**
 * Add logging to the input code.
 * @param {code} - Code to be readed with estraverse and modified.
 * @returns {string} - The input code with logging added.
 */
export function addLogging(code) {
  const ast = espree.parse(code, { ecmaVersion: espree.latestEcmaVersion, loc: true});
  estraverse.traverse(ast, {
    enter: function(node, parent){
      if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') {
        addBeforeCode(node);
      }
    }
  });
  return escodegen.generate(ast);
}

/**
 * Function to write in the AST.
 * @param {node} - Node to be modified.
 * @returns {void} - Modification.
 */
function addBeforeCode(node) {
  const name = node.id ? node.id.name : '<anonymous function>' ;
  const args = node.params.map(p => `$\{${p.name}}`).join(', ');
  const beforeCode = "console.log(`Entering " + name + "(" + args + ") at line " + node.loc.start.line + "`);";
  const beforeNodes = espree.parse(beforeCode, { ecmaVersion: espree.latestEcmaVersion, loc: true }).body;
  node.body.body = beforeNodes.concat(node.body.body);
}
