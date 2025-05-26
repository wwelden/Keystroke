"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Token_1 = require("../src/Token");
const Ast_1 = require("../src/Ast");
describe('AST Nodes', () => {
    // Test Header Nodes
    describe('Header Nodes', () => {
        it('should create Header1Node correctly', () => {
            const token = new Token_1.Token(Token_1.TokenType.HEADER1, '#');
            const node = new Ast_1.Header1Node(token);
            expect(node.type).toBe(Token_1.TokenType.HEADER1);
            expect(node.value).toBe('#');
            expect(node.level).toBe(1);
            expect(node.children).toEqual([]);
        });
        it('should create Header2Node through Header6Node correctly', () => {
            const headers = [
                { TokenType: Token_1.TokenType.HEADER2, symbol: '##', level: 2, NodeClass: Ast_1.Header2Node },
                { TokenType: Token_1.TokenType.HEADER3, symbol: '###', level: 3, NodeClass: Ast_1.Header3Node },
                { TokenType: Token_1.TokenType.HEADER4, symbol: '####', level: 4, NodeClass: Ast_1.Header4Node },
                { TokenType: Token_1.TokenType.HEADER5, symbol: '#####', level: 5, NodeClass: Ast_1.Header5Node },
                { TokenType: Token_1.TokenType.HEADER6, symbol: '######', level: 6, NodeClass: Ast_1.Header6Node },
            ];
            headers.forEach(({ TokenType: type, symbol, level, NodeClass }) => {
                const token = new Token_1.Token(type, symbol);
                const node = new NodeClass(token);
                expect(node.type).toBe(type);
                expect(node.value).toBe(symbol);
                expect(node.level).toBe(level);
                expect(node.children).toEqual([]);
            });
        });
    });
    // Test Math Nodes
    describe('Math Nodes', () => {
        it('should create MathNode correctly', () => {
            const token = new Token_1.Token(Token_1.TokenType.MATH, '$');
            const node = new Ast_1.MathNode(token, '1+2=3');
            expect(node.type).toBe(Token_1.TokenType.MATH);
            expect(node.value).toBe('$');
            expect(node.text).toBe('1+2=3');
            expect(node.children).toEqual([]);
        });
        it('should create SuperscriptNode correctly', () => {
            const token = new Token_1.Token(Token_1.TokenType.SUPERSCRIPT, '^');
            const node = new Ast_1.SuperscriptNode(token, '2');
            expect(node.type).toBe(Token_1.TokenType.SUPERSCRIPT);
            expect(node.value).toBe('^');
            expect(node.text).toBe('2');
            expect(node.children).toEqual([]);
        });
        it('should create SubscriptNode correctly', () => {
            const token = new Token_1.Token(Token_1.TokenType.SUBSCRIPT, '~');
            const node = new Ast_1.SubscriptNode(token, '2');
            expect(node.type).toBe(Token_1.TokenType.SUBSCRIPT);
            expect(node.value).toBe('~');
            expect(node.text).toBe('2');
            expect(node.children).toEqual([]);
        });
        it('should handle math nodes with superscript', () => {
            const mathToken = new Token_1.Token(Token_1.TokenType.MATH, '$');
            const superToken = new Token_1.Token(Token_1.TokenType.SUPERSCRIPT, '^');
            const mathNode = new Ast_1.MathNode(mathToken, '1+2=3');
            const superNode = new Ast_1.SuperscriptNode(superToken, '2');
            mathNode.children.push(superNode);
            expect(mathNode.type).toBe(Token_1.TokenType.MATH);
            expect(mathNode.children[0].type).toBe(Token_1.TokenType.SUPERSCRIPT);
            expect(mathNode.children[0].text).toBe('2');
        });
        it('should handle math nodes with subscript', () => {
            const mathToken = new Token_1.Token(Token_1.TokenType.MATH, '$');
            const subToken = new Token_1.Token(Token_1.TokenType.SUBSCRIPT, '~');
            const mathNode = new Ast_1.MathNode(mathToken, '1+2=3');
            const subNode = new Ast_1.SubscriptNode(subToken, '2');
            mathNode.children.push(subNode);
            expect(mathNode.type).toBe(Token_1.TokenType.MATH);
            expect(mathNode.children[0].type).toBe(Token_1.TokenType.SUBSCRIPT);
            expect(mathNode.children[0].text).toBe('2');
        });
    });
    // Test Paragraph Node
    describe('ParagraphNode', () => {
        it('should create ParagraphNode correctly', () => {
            const token = new Token_1.Token(Token_1.TokenType.TEXT, 'Sample text');
            const node = new Ast_1.ParagraphNode(token, 'Sample text');
            expect(node.type).toBe(Token_1.TokenType.TEXT);
            expect(node.value).toBe('Sample text');
            expect(node.text).toBe('Sample text');
        });
    });
    // Test List Nodes
    describe('List Nodes', () => {
        it('should create ListNode correctly', () => {
            const token = new Token_1.Token(Token_1.TokenType.UNORDERED_LIST, '*');
            const node = new Ast_1.ListNode(token, true);
            expect(node.type).toBe(Token_1.TokenType.UNORDERED_LIST);
            expect(node.value).toBe('*');
            expect(node.ordered).toBe(true);
            expect(node.children).toEqual([]);
        });
        it('should create ListItemNode correctly', () => {
            const token = new Token_1.Token(Token_1.TokenType.LIST_ITEM, '-');
            const node = new Ast_1.ListItemNode(token, 'List item text');
            expect(node.type).toBe(Token_1.TokenType.LIST_ITEM);
            expect(node.value).toBe('-');
            expect(node.text).toBe('List item text');
        });
        it('should create ChecklistNode correctly', () => {
            const token = new Token_1.Token(Token_1.TokenType.CHECKLIST, '- [ ]');
            const node = new Ast_1.ChecklistNode(token, 'Todo item');
            expect(node.type).toBe(Token_1.TokenType.CHECKLIST);
            expect(node.value).toBe('- [ ]');
            expect(node.text).toBe('Todo item');
        });
        it('should create ChecklistCheckedNode correctly', () => {
            const token = new Token_1.Token(Token_1.TokenType.CHECKLIST_CHECKED, '- [x]');
            const node = new Ast_1.ChecklistCheckedNode(token, 'Done item');
            expect(node.type).toBe(Token_1.TokenType.CHECKLIST_CHECKED);
            expect(node.value).toBe('- [x]');
            expect(node.text).toBe('Done item');
        });
    });
    // Test Link Nodes
    describe('Link Nodes', () => {
        it('should create LinkNode correctly', () => {
            const token = new Token_1.Token(Token_1.TokenType.LEFT_BRACKET, '[');
            const node = new Ast_1.LinkNode(token, 'Link text', 'https://example.com');
            expect(node.type).toBe(Token_1.TokenType.LINK);
            expect(node.value).toBe('[');
            expect(node.text).toBe('Link text');
            expect(node.url).toBe('https://example.com');
        });
        it('should create link URL nodes correctly', () => {
            const token = new Token_1.Token(Token_1.TokenType.LEFT_PARENTHESIS, '(');
            const node = new Ast_1.LinkNode(token, 'Link text', 'https://example.com');
            expect(node.type).toBe(Token_1.TokenType.LINK);
            expect(node.text).toBe('Link text');
            expect(node.url).toBe('https://example.com');
        });
    });
    // Test Text Formatting Nodes
    describe('Text Formatting Nodes', () => {
        it('should create formatting nodes correctly', () => {
            const nodes = [
                { TokenType: Token_1.TokenType.BOLD, symbol: '**', NodeClass: Ast_1.BoldNode },
                { TokenType: Token_1.TokenType.ITALIC, symbol: '_', NodeClass: Ast_1.ItalicNode },
                { TokenType: Token_1.TokenType.STRIKETHROUGH, symbol: '~~', NodeClass: Ast_1.StrikethroughNode }
            ];
            nodes.forEach(({ TokenType: type, symbol, NodeClass }) => {
                const token = new Token_1.Token(type, symbol);
                const node = new NodeClass(token, 'Formatted text');
                expect(node.type).toBe(type);
                expect(node.value).toBe(symbol);
                expect(node.text).toBe('Formatted text');
            });
        });
    });
    // Test Code Nodes
    describe('Code Nodes', () => {
        it('should create InlineCodeNode correctly', () => {
            const token = new Token_1.Token(Token_1.TokenType.INLINE_CODE, '`');
            const node = new Ast_1.InlineCodeNode(token, 'console.log()');
            expect(node.type).toBe(Token_1.TokenType.INLINE_CODE);
            expect(node.value).toBe('`');
            expect(node.code).toBe('console.log()');
        });
        it('should create CodeBlockNode correctly', () => {
            const token = new Token_1.Token(Token_1.TokenType.CODE_BLOCK, '```');
            const node = new Ast_1.CodeBlockNode(token, 'const x = 42;', 'javascript');
            expect(node.type).toBe(Token_1.TokenType.CODE_BLOCK);
            expect(node.value).toBe('```');
            expect(node.code).toBe('const x = 42;');
            expect(node.language).toBe('javascript');
        });
    });
    // Test Other Nodes
    describe('Other Nodes', () => {
        it('should create BlockquoteNode correctly', () => {
            const token = new Token_1.Token(Token_1.TokenType.BLOCKQUOTE, '>');
            const node = new Ast_1.BlockquoteNode(token, 'Quote text');
            expect(node.type).toBe(Token_1.TokenType.BLOCKQUOTE);
            expect(node.value).toBe('>');
            expect(node.text).toBe('Quote text');
        });
        it('should create HorizontalRuleNode correctly', () => {
            const token = new Token_1.Token(Token_1.TokenType.HORIZONTAL_RULE, '---');
            const node = new Ast_1.HorizontalRuleNode(token);
            expect(node.type).toBe(Token_1.TokenType.HORIZONTAL_RULE);
            expect(node.value).toBe('---');
        });
        it('should create utility nodes correctly', () => {
            const nodes = [
                { TokenType: Token_1.TokenType.ILLEGAL, NodeClass: Ast_1.IllegalNode },
                { TokenType: Token_1.TokenType.EOF, NodeClass: Ast_1.EOFNode },
                { TokenType: Token_1.TokenType.NEWLINE, NodeClass: Ast_1.NewlineNode }
            ];
            nodes.forEach(({ TokenType: type, NodeClass }) => {
                const token = new Token_1.Token(type, type === Token_1.TokenType.NEWLINE ? '\n' : '');
                const node = new NodeClass(token);
                expect(node.type).toBe(type);
                expect(node.value).toBe(type === Token_1.TokenType.NEWLINE ? '\n' : '');
            });
        });
    });
});
