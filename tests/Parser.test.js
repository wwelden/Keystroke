"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Lexer_1 = require("../src/Lexer");
const Parser_1 = require("../src/Parser");
const Token_1 = require("../src/Token");
const Ast_1 = require("../src/Ast");
describe('Parser', () => {
    function parse(input, currentToken, peekToken, peekNextToken) {
        const lexer = new Lexer_1.Lexer(input);
        const parser = new Parser_1.Parser(lexer, currentToken, peekToken, peekNextToken);
        return parser.parse();
    }
    describe('Headers', () => {
        it('should parse header1', () => {
            const doc = parse('# Hello World', new Token_1.Token(Token_1.TokenType.HEADER1, '#'), new Token_1.Token(Token_1.TokenType.TEXT, 'Hello'), new Token_1.Token(Token_1.TokenType.TEXT, 'World'));
            expect(doc.children[0]).toBeInstanceOf(Ast_1.Header1Node);
            expect(doc.children[0].type).toBe(Token_1.TokenType.HEADER1);
            expect(doc.children[0].children[1].value).toBe('Hello');
        });
    });
    describe('Text Formatting', () => {
        it('should parse bold text', () => {
            const doc = parse('**bold text**', new Token_1.Token(Token_1.TokenType.BOLD, '**'), new Token_1.Token(Token_1.TokenType.TEXT, 'bold'), new Token_1.Token(Token_1.TokenType.TEXT, 'text'));
            expect(doc.children[0]).toBeInstanceOf(Ast_1.BoldNode);
            expect(doc.children[0].type).toBe(Token_1.TokenType.BOLD);
            expect(doc.children[0].children[0].value).toBe('bold');
            expect(doc.children[0].children[0].type).toBe(Token_1.TokenType.TEXT);
            expect(doc.children[0].children[1].value).toBe('text');
        });
        it('should parse italic text', () => {
            const doc = parse('_italic text_', new Token_1.Token(Token_1.TokenType.ITALIC, '_'), new Token_1.Token(Token_1.TokenType.TEXT, 'italic'), new Token_1.Token(Token_1.TokenType.TEXT, 'text'));
            expect(doc.children[0]).toBeInstanceOf(Ast_1.ItalicNode);
            expect(doc.children[0].type).toBe(Token_1.TokenType.ITALIC);
            expect(doc.children[0].children[0].value).toBe('italic');
            expect(doc.children[0].children[0].type).toBe(Token_1.TokenType.TEXT);
            expect(doc.children[0].children[1].value).toBe('text');
        });
    });
    describe('Lists', () => {
        it('should parse unordered list', () => {
            const input = `
            * Item 1
            * Item 2
            `;
            const doc = parse(input, new Token_1.Token(Token_1.TokenType.UNORDERED_LIST, '*'), new Token_1.Token(Token_1.TokenType.TEXT, 'Item 1'), new Token_1.Token(Token_1.TokenType.NEWLINE, '\n'));
            expect(doc.children[0]).toBeInstanceOf(Ast_1.ListNode);
            expect(doc.children[0].type).toBe(Token_1.TokenType.UNORDERED_LIST);
        });
        it('should parse checklist items', () => {
            const input = `
            - [ ] Todo
            - [x] Done
            `;
            const doc = parse(input, new Token_1.Token(Token_1.TokenType.CHECKLIST, '- [ ]'), new Token_1.Token(Token_1.TokenType.TEXT, 'Todo'), new Token_1.Token(Token_1.TokenType.NEWLINE, '\n'));
            expect(doc.children[0]).toBeInstanceOf(Ast_1.ChecklistNode);
            // expect(doc.children[0].children[0].value).toBe('Todo');
            expect(doc.children[1]).toBeInstanceOf(Ast_1.ChecklistCheckedNode);
            // expect(doc.children[3].children[0].value).toBe('Done');
        });
    });
    describe('Links', () => {
        it('should parse links', () => {
            const doc = parse('[Example](https://example.com)', new Token_1.Token(Token_1.TokenType.LEFT_BRACKET, '['), new Token_1.Token(Token_1.TokenType.TEXT, 'Example'), new Token_1.Token(Token_1.TokenType.RIGHT_BRACKET, ']'));
            expect(doc.children[0]).toBeInstanceOf(Ast_1.LinkNode);
            expect(doc.children[0].text).toBe('Example');
            expect(doc.children[0].url).toBe('https://example.com');
        });
    });
    describe('Blockquotes', () => {
        it('should parse blockquotes', () => {
            const doc = parse('> This is a quote\n\n', new Token_1.Token(Token_1.TokenType.BLOCKQUOTE, '>'), new Token_1.Token(Token_1.TokenType.TEXT, 'This is a quote'), new Token_1.Token(Token_1.TokenType.NEWLINE, '\n'));
            expect(doc.children[0]).toBeInstanceOf(Ast_1.BlockquoteNode);
            expect(doc.children[0].type).toBe(Token_1.TokenType.BLOCKQUOTE);
        });
    });
    describe('Horizontal Rules', () => {
        it('should parse horizontal rules', () => {
            const doc = parse('---', new Token_1.Token(Token_1.TokenType.HORIZONTAL_RULE, '---'), new Token_1.Token(Token_1.TokenType.NEWLINE, '\n'), new Token_1.Token(Token_1.TokenType.NEWLINE, '\n'));
            expect(doc.children[0]).toBeInstanceOf(Ast_1.HorizontalRuleNode);
            expect(doc.children[0].type).toBe(Token_1.TokenType.HORIZONTAL_RULE);
        });
    });
    describe('Mixed Content', () => {
        it('should parse mixed markdown content', () => {
            const input = `# Header
            **Bold text**
            > Blockquote
            - [ ] Todo item
            [Link](https://example.com)`;
            const doc = parse(input, new Token_1.Token(Token_1.TokenType.HEADER1, '#'), new Token_1.Token(Token_1.TokenType.TEXT, 'Header'), new Token_1.Token(Token_1.TokenType.NEWLINE, '\n'));
            expect(doc.children[0]).toBeInstanceOf(Ast_1.Header1Node);
            expect(doc.children[2]).toBeInstanceOf(Ast_1.BoldNode);
            expect(doc.children[4]).toBeInstanceOf(Ast_1.BlockquoteNode);
            expect(doc.children[6]).toBeInstanceOf(Ast_1.ChecklistNode);
            expect(doc.children[8]).toBeInstanceOf(Ast_1.LinkNode);
        });
    });
    describe('Math', () => {
        it('should parse math expressions', () => {
            const doc = parse('$1+2=3$', new Token_1.Token(Token_1.TokenType.MATH, '$'), new Token_1.Token(Token_1.TokenType.TEXT, '1+2=3'), new Token_1.Token(Token_1.TokenType.MATH, '$'));
            expect(doc.children[0]).toBeInstanceOf(Ast_1.MathNode);
            expect(doc.children[0].type).toBe(Token_1.TokenType.MATH);
            expect(doc.children[0].text).toBe('1+2=3');
        });
        it('should parse superscript', () => {
            const doc = parse('x^2', new Token_1.Token(Token_1.TokenType.MATH, 'x^'), new Token_1.Token(Token_1.TokenType.TEXT, '2'), new Token_1.Token(Token_1.TokenType.MATH, '$'));
            expect(doc.children[1]).toBeInstanceOf(Ast_1.SuperscriptNode);
            expect(doc.children[1].type).toBe(Token_1.TokenType.SUPERSCRIPT);
            expect(doc.children[1].text).toBe('2');
        });
        it('should parse subscript', () => {
            const doc = parse('x~n', new Token_1.Token(Token_1.TokenType.MATH, 'x~'), new Token_1.Token(Token_1.TokenType.TEXT, 'n'), new Token_1.Token(Token_1.TokenType.MATH, '$'));
            expect(doc.children[1]).toBeInstanceOf(Ast_1.SubscriptNode);
            expect(doc.children[1].type).toBe(Token_1.TokenType.SUBSCRIPT);
            expect(doc.children[1].text).toBe('n');
        });
        it('should parse complex math expressions', () => {
            const doc = parse('$f(x) = x^2 + y~1$', new Token_1.Token(Token_1.TokenType.MATH, '$'), new Token_1.Token(Token_1.TokenType.TEXT, 'f(x) = x^2 + y~1'), new Token_1.Token(Token_1.TokenType.MATH, '$'));
            expect(doc.children[0]).toBeInstanceOf(Ast_1.MathNode);
            expect(doc.children[0].children).toHaveLength(5); // Text, superscript, text, subscript, text
        });
    });
});
