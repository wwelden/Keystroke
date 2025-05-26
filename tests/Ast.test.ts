import { Token, TokenType } from '../src/Token';
import {
    MarkdownNode,
    HeaderNode,
    Header1Node,
    Header2Node,
    Header3Node,
    Header4Node,
    Header5Node,
    Header6Node,
    ParagraphNode,
    ListNode,
    ListItemNode,
    ChecklistNode,
    ChecklistCheckedNode,
    BlockquoteNode,
    HorizontalRuleNode,
    LinkNode,
    TextNode,
    BoldNode,
    ItalicNode,
    StrikethroughNode,
    InlineCodeNode,
    CodeBlockNode,
    IllegalNode,
    EOFNode,
    NewlineNode,
    MathNode,
    SuperscriptNode,
    SubscriptNode
} from '../src/Ast';

describe('AST Nodes', () => {
    // Test Header Nodes
    describe('Header Nodes', () => {
        it('should create Header1Node correctly', () => {
            const token = new Token(TokenType.HEADER1, '#');
            const node = new Header1Node(token);

            expect(node.type).toBe(TokenType.HEADER1);
            expect(node.value).toBe('#');
            expect(node.level).toBe(1);
            expect(node.children).toEqual([]);
        });

        it('should create Header2Node through Header6Node correctly', () => {
            const headers = [
                { TokenType: TokenType.HEADER2, symbol: '##', level: 2, NodeClass: Header2Node },
                { TokenType: TokenType.HEADER3, symbol: '###', level: 3, NodeClass: Header3Node },
                { TokenType: TokenType.HEADER4, symbol: '####', level: 4, NodeClass: Header4Node },
                { TokenType: TokenType.HEADER5, symbol: '#####', level: 5, NodeClass: Header5Node },
                { TokenType: TokenType.HEADER6, symbol: '######', level: 6, NodeClass: Header6Node },
            ];

            headers.forEach(({ TokenType: type, symbol, level, NodeClass }) => {
                const token = new Token(type, symbol);
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
            const token = new Token(TokenType.MATH, '$');
            const node = new MathNode(token, '1+2=3');

            expect(node.type).toBe(TokenType.MATH);
            expect(node.value).toBe('$');
            expect(node.text).toBe('1+2=3');
            expect(node.children).toEqual([]);
        });

        it('should create SuperscriptNode correctly', () => {
            const token = new Token(TokenType.SUPERSCRIPT, '^');
            const node = new SuperscriptNode(token, '2');

            expect(node.type).toBe(TokenType.SUPERSCRIPT);
            expect(node.value).toBe('^');
            expect(node.text).toBe('2');
            expect(node.children).toEqual([]);
        });

        it('should create SubscriptNode correctly', () => {
            const token = new Token(TokenType.SUBSCRIPT, '~');
            const node = new SubscriptNode(token, '2');

            expect(node.type).toBe(TokenType.SUBSCRIPT);
            expect(node.value).toBe('~');
            expect(node.text).toBe('2');
            expect(node.children).toEqual([]);
        });

        it('should handle math nodes with superscript', () => {
            const mathToken = new Token(TokenType.MATH, '$');
            const superToken = new Token(TokenType.SUPERSCRIPT, '^');
            const mathNode = new MathNode(mathToken, '1+2=3');
            const superNode = new SuperscriptNode(superToken, '2');
            mathNode.children.push(superNode);

            expect(mathNode.type).toBe(TokenType.MATH);
            expect(mathNode.children[0].type).toBe(TokenType.SUPERSCRIPT);
            expect((mathNode.children[0] as SuperscriptNode).text).toBe('2');
        });

        it('should handle math nodes with subscript', () => {
            const mathToken = new Token(TokenType.MATH, '$');
            const subToken = new Token(TokenType.SUBSCRIPT, '~');
            const mathNode = new MathNode(mathToken, '1+2=3');
            const subNode = new SubscriptNode(subToken, '2');
            mathNode.children.push(subNode);

            expect(mathNode.type).toBe(TokenType.MATH);
            expect(mathNode.children[0].type).toBe(TokenType.SUBSCRIPT);
            expect((mathNode.children[0] as SubscriptNode).text).toBe('2');
        });
    });

    // Test Paragraph Node
    describe('ParagraphNode', () => {
        it('should create ParagraphNode correctly', () => {
            const token = new Token(TokenType.TEXT, 'Sample text');
            const node = new ParagraphNode(token, 'Sample text');

            expect(node.type).toBe(TokenType.TEXT);
            expect(node.value).toBe('Sample text');
            expect(node.text).toBe('Sample text');
        });
    });

    // Test List Nodes
    describe('List Nodes', () => {
        it('should create ListNode correctly', () => {
            const token = new Token(TokenType.UNORDERED_LIST, '*');
            const node = new ListNode(token, true);

            expect(node.type).toBe(TokenType.UNORDERED_LIST);
            expect(node.value).toBe('*');
            expect(node.ordered).toBe(true);
            expect(node.children).toEqual([]);
        });

        it('should create ListItemNode correctly', () => {
            const token = new Token(TokenType.LIST_ITEM, '-');
            const node = new ListItemNode(token, 'List item text');

            expect(node.type).toBe(TokenType.LIST_ITEM);
            expect(node.value).toBe('-');
            expect(node.text).toBe('List item text');
        });

        it('should create ChecklistNode correctly', () => {
            const token = new Token(TokenType.CHECKLIST, '- [ ]');
            const node = new ChecklistNode(token, 'Todo item');

            expect(node.type).toBe(TokenType.CHECKLIST);
            expect(node.value).toBe('- [ ]');
            expect(node.text).toBe('Todo item');
        });

        it('should create ChecklistCheckedNode correctly', () => {
            const token = new Token(TokenType.CHECKLIST_CHECKED, '- [x]');
            const node = new ChecklistCheckedNode(token, 'Done item');

            expect(node.type).toBe(TokenType.CHECKLIST_CHECKED);
            expect(node.value).toBe('- [x]');
            expect(node.text).toBe('Done item');
        });
    });

    // Test Link Nodes
    describe('Link Nodes', () => {
        it('should create LinkNode correctly', () => {
            const token = new Token(TokenType.LEFT_BRACKET, '[');
            const node = new LinkNode(token, 'Link text', 'https://example.com');

            expect(node.type).toBe(TokenType.LINK);
            expect(node.value).toBe('[');
            expect(node.text).toBe('Link text');
            expect(node.url).toBe('https://example.com');
        });

        it('should create link URL nodes correctly', () => {
            const token = new Token(TokenType.LEFT_PARENTHESIS, '(');
            const node = new LinkNode(token, 'Link text', 'https://example.com');

            expect(node.type).toBe(TokenType.LINK);
            expect(node.text).toBe('Link text');
            expect(node.url).toBe('https://example.com');
        });
    });

    // Test Text Formatting Nodes
    describe('Text Formatting Nodes', () => {
        it('should create formatting nodes correctly', () => {
            const nodes = [
                { TokenType: TokenType.BOLD, symbol: '**', NodeClass: BoldNode },
                { TokenType: TokenType.ITALIC, symbol: '_', NodeClass: ItalicNode },
                { TokenType: TokenType.STRIKETHROUGH, symbol: '~~', NodeClass: StrikethroughNode }
            ];

            nodes.forEach(({ TokenType: type, symbol, NodeClass }) => {
                const token = new Token(type, symbol);
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
            const token = new Token(TokenType.INLINE_CODE, '`');
            const node = new InlineCodeNode(token, 'console.log()');

            expect(node.type).toBe(TokenType.INLINE_CODE);
            expect(node.value).toBe('`');
            expect(node.code).toBe('console.log()');
        });

        it('should create CodeBlockNode correctly', () => {
            const token = new Token(TokenType.CODE_BLOCK, '```');
            const node = new CodeBlockNode(token, 'const x = 42;', 'javascript');

            expect(node.type).toBe(TokenType.CODE_BLOCK);
            expect(node.value).toBe('```');
            expect(node.code).toBe('const x = 42;');
            expect(node.language).toBe('javascript');
        });
    });

    // Test Other Nodes
    describe('Other Nodes', () => {
        it('should create BlockquoteNode correctly', () => {
            const token = new Token(TokenType.BLOCKQUOTE, '>');
            const node = new BlockquoteNode(token, 'Quote text');

            expect(node.type).toBe(TokenType.BLOCKQUOTE);
            expect(node.value).toBe('>');
            expect(node.text).toBe('Quote text');
        });

        it('should create HorizontalRuleNode correctly', () => {
            const token = new Token(TokenType.HORIZONTAL_RULE, '---');
            const node = new HorizontalRuleNode(token);

            expect(node.type).toBe(TokenType.HORIZONTAL_RULE);
            expect(node.value).toBe('---');
        });

        it('should create utility nodes correctly', () => {
            const nodes = [
                { TokenType: TokenType.ILLEGAL, NodeClass: IllegalNode },
                { TokenType: TokenType.EOF, NodeClass: EOFNode },
                { TokenType: TokenType.NEWLINE, NodeClass: NewlineNode }
            ];

            nodes.forEach(({ TokenType: type, NodeClass }) => {
                const token = new Token(type, type === TokenType.NEWLINE ? '\n' : '');
                const node = new NodeClass(token);

                expect(node.type).toBe(type);
                expect(node.value).toBe(type === TokenType.NEWLINE ? '\n' : '');
            });
        });
    });
});
