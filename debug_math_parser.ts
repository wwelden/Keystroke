import { Lexer } from './src/Lexer';
import { Parser } from './src/Parser';

function debugParse(input: string) {
    console.log(`\nParsing: "${input}"`);
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const doc = parser.parse();

    console.log(`Document children count: ${doc.children.length}`);
    doc.children.forEach((child, index) => {
        console.log(`  ${index}: ${child.constructor.name} (type: ${child.type})`);
        if (child.value) {
            console.log(`      value: "${child.value}"`);
        }
        if (child.children && child.children.length > 0) {
            console.log(`      children: ${child.children.length}`);
            child.children.forEach((grandchild, gIndex) => {
                console.log(`        ${gIndex}: ${grandchild.constructor.name} (type: ${grandchild.type})`);
                if (grandchild.value) {
                    console.log(`            value: "${grandchild.value}"`);
                }
            });
        }
    });
}

// Test the failing math cases
debugParse('$x^2$');
debugParse('$x~n$');
