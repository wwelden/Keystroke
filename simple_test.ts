import { Lexer } from './src/Lexer';

// Test just the problematic part
const input = '\n * ';
const lexer = new Lexer(input);

console.log('Input:', JSON.stringify(input));
console.log('Tokens:');

let token;
let count = 0;
do {
    token = lexer.nextToken();
    console.log(`${count++}: ${token.type} = "${token.literal}"`);
} while (token.type !== 'EOF' && count < 10);
