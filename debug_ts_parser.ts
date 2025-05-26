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
    });
}

// Test cases that are failing
debugParse('# Hello World');
debugParse('**bold text**');
debugParse('_italic text_');
debugParse('> This is a quote');
debugParse('---');
