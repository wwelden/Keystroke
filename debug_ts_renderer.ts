import { Renderer } from './src/Renderer';
import { Token, TokenType } from './src/Token';
import { BoldNode, TextNode } from './src/Ast';

const renderer = new Renderer();

// Test bold text
const token = new Token(TokenType.BOLD, '**');
const bold = new BoldNode(token, 'Bold text');
bold.children.push(new TextNode(new Token(TokenType.TEXT, 'Bold text'), 'Bold text'));

const result = renderer.render(bold);
console.log('Bold result:', JSON.stringify(result));
console.log('Expected without newline:', JSON.stringify('<b>Bold text</b>'));
console.log('Expected with newline:', JSON.stringify('<b>Bold text</b>\n'));
