import { Lexer } from '../src/Lexer';
import { Parser } from '../src/Parser';
import { TokenType, Token } from '../src/Token';
import {
    DocumentNode,
    Header1Node,
    BoldNode,
    ItalicNode,
    ListNode,
    ChecklistNode,
    ChecklistCheckedNode,
    BlockquoteNode,
    HorizontalRuleNode,
    LinkNode,
    ParagraphNode,
    MathNode,
    SuperscriptNode,
    SubscriptNode,
} from '../src/Ast';

describe('Parser', () => {
    function parse(input: string, currentToken: Token, peekToken: Token, peekNextToken: Token): DocumentNode {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer, currentToken, peekToken, peekNextToken);
        return parser.parse();
    }

    describe('Headers', () => {
        it('should parse header1', () => {
            const doc = parse('# Hello World', new Token(TokenType.HEADER1, '#'), new Token(TokenType.TEXT, 'Hello'), new Token(TokenType.TEXT, 'World'));
            expect(doc.children[0]).toBeInstanceOf(Header1Node);
            expect(doc.children[0].type).toBe(TokenType.HEADER1);
            expect(doc.children[0].children[1].value).toBe('Hello');
        });
    });

    describe('Text Formatting', () => {
        it('should parse bold text', () => {
            const doc = parse('**bold text**', new Token(TokenType.BOLD, '**'), new Token(TokenType.TEXT, 'bold'), new Token(TokenType.TEXT, 'text'));
            expect(doc.children[0]).toBeInstanceOf(BoldNode);
            expect(doc.children[0].type).toBe(TokenType.BOLD);
            expect(doc.children[0].children[0].value).toBe('bold');
            expect(doc.children[0].children[0].type).toBe(TokenType.TEXT);
            expect(doc.children[0].children[1].value).toBe('text');
        });

        it('should parse italic text', () => {
            const doc = parse('_italic text_', new Token(TokenType.ITALIC, '_'), new Token(TokenType.TEXT, 'italic'), new Token(TokenType.TEXT, 'text'));
            expect(doc.children[0]).toBeInstanceOf(ItalicNode);
            expect(doc.children[0].type).toBe(TokenType.ITALIC);
            expect(doc.children[0].children[0].value).toBe('italic');
            expect(doc.children[0].children[0].type).toBe(TokenType.TEXT);
            expect(doc.children[0].children[1].value).toBe('text');
        });
    });

    describe('Lists', () => {
        it('should parse unordered list', () => {
            const input = `
            * Item 1
            * Item 2
            `;
            const doc = parse(input, new Token(TokenType.UNORDERED_LIST, '*'), new Token(TokenType.TEXT, 'Item 1'), new Token(TokenType.NEWLINE, '\n'));
            expect(doc.children[0]).toBeInstanceOf(ListNode);
            expect(doc.children[0].type).toBe(TokenType.UNORDERED_LIST);
        });

        it('should parse checklist items', () => {
            const input = `
            - [ ] Todo
            - [x] Done
            `;
            const doc = parse(input, new Token(TokenType.CHECKLIST, '- [ ]'), new Token(TokenType.TEXT, 'Todo'), new Token(TokenType.NEWLINE, '\n'));
            expect(doc.children[0]).toBeInstanceOf(ChecklistNode);
            // expect(doc.children[0].children[0].value).toBe('Todo');
            expect(doc.children[1]).toBeInstanceOf(ChecklistCheckedNode);
            // expect(doc.children[3].children[0].value).toBe('Done');
        });
    });

    describe('Links', () => {
        it('should parse links', () => {
            const doc = parse('[Example](https://example.com)', new Token(TokenType.LINK_TEXT_START, '['), new Token(TokenType.TEXT, 'Example'), new Token(TokenType.LINK_TEXT_END, ']'));
            expect(doc.children[0]).toBeInstanceOf(LinkNode);
            expect((doc.children[0] as LinkNode).text).toBe('Example');
            expect((doc.children[0] as LinkNode).url).toBe('https://example.com');
        });
    });

    describe('Blockquotes', () => {
        it('should parse blockquotes', () => {
            const doc = parse('> This is a quote\n\n', new Token(TokenType.BLOCKQUOTE, '>'), new Token(TokenType.TEXT, 'This is a quote'), new Token(TokenType.NEWLINE, '\n'));
            expect(doc.children[0]).toBeInstanceOf(BlockquoteNode);
            expect(doc.children[0].type).toBe(TokenType.BLOCKQUOTE);
        });
    });

    describe('Horizontal Rules', () => {
        it('should parse horizontal rules', () => {
            const doc = parse('---', new Token(TokenType.HORIZONTAL_RULE, '---'), new Token(TokenType.NEWLINE, '\n'), new Token(TokenType.NEWLINE, '\n'));
            expect(doc.children[0]).toBeInstanceOf(HorizontalRuleNode);
            expect(doc.children[0].type).toBe(TokenType.HORIZONTAL_RULE);
        });
    });

    describe('Mixed Content', () => {
        it('should parse mixed markdown content', () => {
            const input = `# Header
            **Bold text**
            > Blockquote
            - [ ] Todo item
            [Link](https://example.com)`;

            const doc = parse(input, new Token(TokenType.HEADER1, '#'), new Token(TokenType.TEXT, 'Header'), new Token(TokenType.NEWLINE, '\n'));
            expect(doc.children[0]).toBeInstanceOf(Header1Node);
            expect(doc.children[2]).toBeInstanceOf(BoldNode);
            expect(doc.children[4]).toBeInstanceOf(BlockquoteNode);
            expect(doc.children[6]).toBeInstanceOf(ChecklistNode);
            expect(doc.children[8]).toBeInstanceOf(LinkNode);
        });
    });

    describe('Math', () => {
        it('should parse math expressions', () => {
            const doc = parse('$1+2=3$', new Token(TokenType.MATH, '$'), new Token(TokenType.TEXT, '1+2=3'), new Token(TokenType.MATH, '$'));
            expect(doc.children[0]).toBeInstanceOf(MathNode);
            expect(doc.children[0].type).toBe(TokenType.MATH);
            expect((doc.children[0] as MathNode).text).toBe('1+2=3');
        });

        it('should parse superscript', () => {
            const doc = parse('x^2', new Token(TokenType.MATH, 'x^'), new Token(TokenType.TEXT, '2'), new Token(TokenType.MATH, '$'));
            expect(doc.children[1]).toBeInstanceOf(SuperscriptNode);
            expect(doc.children[1].type).toBe(TokenType.SUPERSCRIPT);
            expect((doc.children[1] as SuperscriptNode).text).toBe('2');
        });

        it('should parse subscript', () => {
            const doc = parse('x~n', new Token(TokenType.MATH, 'x~'), new Token(TokenType.TEXT, 'n'), new Token(TokenType.MATH, '$'));
            expect(doc.children[1]).toBeInstanceOf(SubscriptNode);
            expect(doc.children[1].type).toBe(TokenType.SUBSCRIPT);
            expect((doc.children[1] as SubscriptNode).text).toBe('n');
        });

        it('should parse complex math expressions', () => {
            const doc = parse('$f(x) = x^2 + y~1$', new Token(TokenType.MATH, '$'), new Token(TokenType.TEXT, 'f(x) = x^2 + y~1'), new Token(TokenType.MATH, '$'));
            expect(doc.children[0]).toBeInstanceOf(MathNode);
            expect(doc.children[0].children).toHaveLength(5); // Text, superscript, text, subscript, text
        });
    });


    });

