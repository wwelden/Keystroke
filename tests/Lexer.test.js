"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Lexer_1 = require("../src/Lexer");
const Token_1 = require("../src/Token");
describe('Lexer', () => {
    // Helper function to verify token matches expected type and literal
    function expectToken(actual, expected) {
        expect(actual.type).toBe(expected.type);
        expect(actual.literal).toBe(expected.literal);
    }
    // Helper function to verify sequence of tokens
    function expectTokens(lexer, expectedTokens) {
        expectedTokens.forEach(expected => {
            const token = lexer.nextToken();
            expectToken(token, expected);
        });
    }
    describe('constructor', () => {
        it('should initialize with empty input', () => {
            const lexer = new Lexer_1.Lexer('');
            expect(lexer).toBeDefined();
        });
        it('should initialize with non-empty input', () => {
            const lexer = new Lexer_1.Lexer('Hello');
            expect(lexer).toBeDefined();
        });
    });
    describe('nextToken', () => {
        it('should tokenize headers', () => {
            const input = '# Header1\n## Header2\n### Header3\n#### Header4\n##### Header5\n###### Header6';
            const lexer = new Lexer_1.Lexer(input);
            expectTokens(lexer, [
                { type: Token_1.TokenType.HEADER1, literal: '#' },
                { type: Token_1.TokenType.SPACE, literal: ' ' },
                { type: Token_1.TokenType.TEXT, literal: 'Header1' },
                { type: Token_1.TokenType.NEWLINE, literal: '\n' },
                { type: Token_1.TokenType.HEADER2, literal: '##' },
                { type: Token_1.TokenType.SPACE, literal: ' ' },
                { type: Token_1.TokenType.TEXT, literal: 'Header2' },
                { type: Token_1.TokenType.NEWLINE, literal: '\n' },
                { type: Token_1.TokenType.HEADER3, literal: '###' },
                { type: Token_1.TokenType.SPACE, literal: ' ' },
                { type: Token_1.TokenType.TEXT, literal: 'Header3' },
                { type: Token_1.TokenType.NEWLINE, literal: '\n' },
                { type: Token_1.TokenType.HEADER4, literal: '####' },
                { type: Token_1.TokenType.SPACE, literal: ' ' },
                { type: Token_1.TokenType.TEXT, literal: 'Header4' },
                { type: Token_1.TokenType.NEWLINE, literal: '\n' },
                { type: Token_1.TokenType.HEADER5, literal: '#####' },
                { type: Token_1.TokenType.SPACE, literal: ' ' },
                { type: Token_1.TokenType.TEXT, literal: 'Header5' },
                { type: Token_1.TokenType.NEWLINE, literal: '\n' },
                { type: Token_1.TokenType.HEADER6, literal: '######' },
                { type: Token_1.TokenType.SPACE, literal: ' ' },
                { type: Token_1.TokenType.TEXT, literal: 'Header6' },
                { type: Token_1.TokenType.EOF, literal: '' }
            ]);
        });
        it('should tokenize text formatting', () => {
            const input = '**bold** _italic_ ~~strikethrough~~ `code`';
            const lexer = new Lexer_1.Lexer(input);
            expectTokens(lexer, [
                { type: Token_1.TokenType.BOLD, literal: '**' },
                { type: Token_1.TokenType.TEXT, literal: 'bold' },
                { type: Token_1.TokenType.BOLD, literal: '**' },
                { type: Token_1.TokenType.SPACE, literal: ' ' },
                { type: Token_1.TokenType.ITALIC, literal: '_' },
                { type: Token_1.TokenType.TEXT, literal: 'italic' },
                { type: Token_1.TokenType.ITALIC, literal: '_' },
                { type: Token_1.TokenType.SPACE, literal: ' ' },
                { type: Token_1.TokenType.STRIKETHROUGH, literal: '~~' },
                { type: Token_1.TokenType.TEXT, literal: 'strikethrough' },
                { type: Token_1.TokenType.STRIKETHROUGH, literal: '~~' },
                { type: Token_1.TokenType.SPACE, literal: ' ' },
                { type: Token_1.TokenType.INLINE_CODE, literal: '`' },
                { type: Token_1.TokenType.TEXT, literal: 'code' },
                { type: Token_1.TokenType.INLINE_CODE, literal: '`' },
                { type: Token_1.TokenType.EOF, literal: '' }
            ]);
        });
        it('test tasks', () => {
            const input = '- [ ] Task 1\n - [x] Task 2\n - [ ] Task 3';
            const lexer = new Lexer_1.Lexer(input);
            expectTokens(lexer, [
                { type: Token_1.TokenType.CHECKLIST, literal: '- [ ]' },
                { type: Token_1.TokenType.SPACE, literal: ' ' },
                { type: Token_1.TokenType.TEXT, literal: 'Task' },
                { type: Token_1.TokenType.SPACE, literal: ' ' },
                { type: Token_1.TokenType.TEXT, literal: '1' },
                { type: Token_1.TokenType.NEWLINE, literal: '\n' },
                { type: Token_1.TokenType.SPACE, literal: ' ' },
                { type: Token_1.TokenType.CHECKLIST_CHECKED, literal: '- [x]' },
                { type: Token_1.TokenType.SPACE, literal: ' ' },
                { type: Token_1.TokenType.TEXT, literal: 'Task' },
                { type: Token_1.TokenType.SPACE, literal: ' ' },
                { type: Token_1.TokenType.TEXT, literal: '2' },
                { type: Token_1.TokenType.NEWLINE, literal: '\n' },
                { type: Token_1.TokenType.SPACE, literal: ' ' },
                { type: Token_1.TokenType.CHECKLIST, literal: '- [ ]' },
                { type: Token_1.TokenType.SPACE, literal: ' ' },
                { type: Token_1.TokenType.TEXT, literal: 'Task' },
                { type: Token_1.TokenType.SPACE, literal: ' ' },
                { type: Token_1.TokenType.TEXT, literal: '3' },
                // { type: TokenType.NEWLINE, literal: '\n' },
                { type: Token_1.TokenType.EOF, literal: '' }
            ]);
        });
        it('should tokenize lists', () => {
            const input = '* Item 1\n * Item 2\n - [ ] Todo\n - [x] Done';
            const lexer = new Lexer_1.Lexer(input);
            expectTokens(lexer, [
                { type: Token_1.TokenType.UNORDERED_LIST, literal: '*' },
                { type: Token_1.TokenType.SPACE, literal: ' ' },
                { type: Token_1.TokenType.TEXT, literal: 'Item' },
                { type: Token_1.TokenType.SPACE, literal: ' ' },
                { type: Token_1.TokenType.TEXT, literal: '1' },
                { type: Token_1.TokenType.NEWLINE, literal: '\n' },
                { type: Token_1.TokenType.SPACE, literal: ' ' },
                { type: Token_1.TokenType.UNORDERED_LIST, literal: '*' },
                { type: Token_1.TokenType.SPACE, literal: ' ' },
                { type: Token_1.TokenType.TEXT, literal: 'Item' },
                { type: Token_1.TokenType.SPACE, literal: ' ' },
                { type: Token_1.TokenType.TEXT, literal: '2' },
                { type: Token_1.TokenType.NEWLINE, literal: '\n' },
                { type: Token_1.TokenType.SPACE, literal: ' ' },
                { type: Token_1.TokenType.CHECKLIST, literal: '- [ ]' },
                { type: Token_1.TokenType.SPACE, literal: ' ' },
                { type: Token_1.TokenType.TEXT, literal: 'Todo' },
                { type: Token_1.TokenType.NEWLINE, literal: '\n' },
                { type: Token_1.TokenType.SPACE, literal: ' ' },
                { type: Token_1.TokenType.CHECKLIST_CHECKED, literal: '- [x]' },
                { type: Token_1.TokenType.SPACE, literal: ' ' },
                { type: Token_1.TokenType.TEXT, literal: 'Done' },
                { type: Token_1.TokenType.EOF, literal: '' }
            ]);
        });
        it('should tokenize links', () => {
            const input = '[Link text](https://example.com)';
            const lexer = new Lexer_1.Lexer(input);
            expectTokens(lexer, [
                { type: Token_1.TokenType.LEFT_BRACKET, literal: '[' },
                { type: Token_1.TokenType.TEXT, literal: 'Link' },
                { type: Token_1.TokenType.SPACE, literal: ' ' },
                { type: Token_1.TokenType.TEXT, literal: 'text' },
                { type: Token_1.TokenType.RIGHT_BRACKET, literal: ']' },
                { type: Token_1.TokenType.LEFT_PARENTHESIS, literal: '(' },
                { type: Token_1.TokenType.TEXT, literal: 'https://example.com' },
                { type: Token_1.TokenType.RIGHT_PARENTHESIS, literal: ')' },
                { type: Token_1.TokenType.EOF, literal: '' }
            ]);
        });
        it('should tokenize blockquotes and horizontal rules', () => {
            const input = '> Blockquote\n---';
            const lexer = new Lexer_1.Lexer(input);
            expectTokens(lexer, [
                { type: Token_1.TokenType.BLOCKQUOTE, literal: '>' },
                { type: Token_1.TokenType.SPACE, literal: ' ' },
                { type: Token_1.TokenType.TEXT, literal: 'Blockquote' },
                { type: Token_1.TokenType.NEWLINE, literal: '\n' },
                { type: Token_1.TokenType.HORIZONTAL_RULE, literal: '---' },
                { type: Token_1.TokenType.EOF, literal: '' }
            ]);
        });
        it('should tokenize math expressions', () => {
            const input = '$1+2=3 $ x ^2 y ~1';
            const lexer = new Lexer_1.Lexer(input);
            expectTokens(lexer, [
                { type: Token_1.TokenType.MATH, literal: '$' },
                { type: Token_1.TokenType.TEXT, literal: '1+2=3' },
                { type: Token_1.TokenType.SPACE, literal: ' ' },
                { type: Token_1.TokenType.MATH, literal: '$' },
                { type: Token_1.TokenType.SPACE, literal: ' ' },
                { type: Token_1.TokenType.TEXT, literal: 'x' },
                { type: Token_1.TokenType.SPACE, literal: ' ' },
                { type: Token_1.TokenType.SUPERSCRIPT, literal: '^' },
                { type: Token_1.TokenType.TEXT, literal: '2' },
                { type: Token_1.TokenType.SPACE, literal: ' ' },
                { type: Token_1.TokenType.TEXT, literal: 'y' },
                { type: Token_1.TokenType.SPACE, literal: ' ' },
                { type: Token_1.TokenType.SUBSCRIPT, literal: '~' },
                { type: Token_1.TokenType.TEXT, literal: '1' },
                { type: Token_1.TokenType.EOF, literal: '' }
            ]);
        });
    });
    describe('readText', () => {
        it('should handle mixed text content', () => {
            const input = 'Hello, World! 123';
            const lexer = new Lexer_1.Lexer(input);
            expectToken(lexer.nextToken(), { type: Token_1.TokenType.TEXT, literal: 'Hello,' });
            expectToken(lexer.nextToken(), { type: Token_1.TokenType.SPACE, literal: ' ' });
            expectToken(lexer.nextToken(), { type: Token_1.TokenType.TEXT, literal: 'World!' });
            expectToken(lexer.nextToken(), { type: Token_1.TokenType.SPACE, literal: ' ' });
            expectToken(lexer.nextToken(), { type: Token_1.TokenType.TEXT, literal: '123' });
        });
    });
});
