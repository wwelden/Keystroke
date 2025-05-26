import { Lexer } from './src/Lexer';
import { Parser } from './src/Parser';
import { Renderer } from './src/Renderer';

function processMarkdown(input: string): string {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const renderer = new Renderer();
    const ast = parser.parse();
    return renderer.render(ast);
}

// Test cases
const testCases = [
    '**Bold text**',
    '$x ~n  $',
    '$f(x) = x ^2 + y ~1  $',
    `# Title
**Bold**and*italic*
* List item 1
* List item 2
> Quote
[Link](https://example.com)`
];

testCases.forEach((input, index) => {
    const result = processMarkdown(input);
    console.log(`\nTest ${index + 1}:`);
    console.log('Input:', JSON.stringify(input));
    console.log('Output:', JSON.stringify(result));
    if (index === 0) {
        console.log('Expected bold:', JSON.stringify('<b>Bold text</b>\n'));
    }
});
