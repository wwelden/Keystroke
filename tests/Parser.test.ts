import { Lexer } from '../src/Lexer';
import { Parser } from '../src/Parser';
import { TokenType } from '../src/Token';
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
    MathNode,
    SuperscriptNode,
    SubscriptNode,
    CodeBlockNode,
    InlineCodeNode,
    TextNode,
} from '../src/Ast';

describe('Parser', () => {
    function parse(input: string): DocumentNode {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        return parser.parse();
    }

    describe('Headers', () => {
        it('should parse header1', () => {
            const doc = parse('# Hello World');
            expect(doc.children.length).toBeGreaterThan(0);
            expect(doc.children[0]).toBeInstanceOf(Header1Node);
            expect(doc.children[0].type).toBe(TokenType.HEADER1);
        });
    });

    describe('Text Formatting', () => {
        it('should parse bold text', () => {
            const doc = parse('**bold text**');
            expect(doc.children.length).toBeGreaterThan(0);
            expect(doc.children[0]).toBeInstanceOf(BoldNode);
            expect(doc.children[0].type).toBe(TokenType.BOLD);
        });

        it('should parse italic text', () => {
            const doc = parse('_italic text_');
            expect(doc.children.length).toBeGreaterThan(0);
            expect(doc.children[0]).toBeInstanceOf(ItalicNode);
            expect(doc.children[0].type).toBe(TokenType.ITALIC);
        });
    });

    describe('Lists', () => {
        it('should parse unordered list', () => {
            const input = '* Item 1\n* Item 2';
            const doc = parse(input);
            expect(doc.children.length).toBeGreaterThan(0);
            // Check that we have list-related nodes
            const hasListNodes = doc.children.some(child =>
                child.type === TokenType.UNORDERED_LIST ||
                child.type === TokenType.LIST_ITEM
            );
            expect(hasListNodes).toBe(true);
        });

        it('should parse checklist items into one list', () => {
            const doc = parse('- [ ] Todo\n- [x] Done');
            expect(doc.children).toHaveLength(1);
            const list = doc.children[0] as ListNode;
            expect(list).toBeInstanceOf(ListNode);
            expect(list.ordered).toBe(false);
            expect(list.items).toHaveLength(2);
            expect(list.items[0]).toBeInstanceOf(ChecklistNode);
            expect(list.items[1]).toBeInstanceOf(ChecklistCheckedNode);
        });

        it('should parse an ordered list', () => {
            const doc = parse('1. a\n2. b');
            expect(doc.children).toHaveLength(1);
            const list = doc.children[0] as ListNode;
            expect(list.type).toBe(TokenType.ORDERED_LIST);
            expect(list.ordered).toBe(true);
            expect(list.items).toHaveLength(2);
        });
    });

    describe('Links', () => {
        it('should parse links', () => {
            const doc = parse('[Example](https://example.com)');
            expect(doc.children.length).toBeGreaterThan(0);
            // Check that we have link-related nodes
            const hasLinkNodes = doc.children.some(child =>
                child.type === TokenType.LINK ||
                child instanceof LinkNode
            );
            expect(hasLinkNodes).toBe(true);
        });

        it('should keep balanced parentheses in the link destination', () => {
            const doc = parse('[x](https://example.com/a(b))');
            expect(doc.children).toHaveLength(1);
            const link = doc.children[0] as LinkNode;
            expect(link).toBeInstanceOf(LinkNode);
            expect(link.url).toBe('https://example.com/a(b)');
        });

        it('should end the destination at the first unbalanced )', () => {
            const doc = parse('[x](a)b)');
            expect((doc.children[0] as LinkNode).url).toBe('a');
            expect(doc.children.slice(1).map(child => child.value).join('')).toBe('b)');
        });

        it('should stop an unclosed destination at the end of the line', () => {
            const doc = parse('[x](a(b\nnext');
            expect((doc.children[0] as LinkNode).url).toBe('a(b');
            expect(doc.children.some(child => child.value === 'next')).toBe(true);
        });
    });

    describe('Blockquotes', () => {
        it('should parse blockquotes', () => {
            const doc = parse('> This is a quote');
            expect(doc.children.length).toBeGreaterThan(0);
            expect(doc.children[0]).toBeInstanceOf(BlockquoteNode);
            expect(doc.children[0].type).toBe(TokenType.BLOCKQUOTE);
        });
    });

    describe('Horizontal Rules', () => {
        it('should parse horizontal rules', () => {
            const doc = parse('---');
            expect(doc.children.length).toBeGreaterThan(0);
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

            const doc = parse(input);
            expect(doc.children.length).toBeGreaterThan(0);

            // Check that we have various types of nodes
            const nodeTypes = doc.children.map(child => child.type);
            expect(nodeTypes).toContain(TokenType.HEADER1);
            expect(nodeTypes).toContain(TokenType.BOLD);
            expect(nodeTypes).toContain(TokenType.BLOCKQUOTE);
        });
    });

    describe('Math', () => {
        it('should parse math expressions', () => {
            const doc = parse('$1+2=3$');
            expect(doc.children.length).toBeGreaterThan(0);
            // Check that we have math-related nodes
            const hasMathNodes = doc.children.some(child =>
                child.type === TokenType.MATH ||
                child instanceof MathNode
            );
            expect(hasMathNodes).toBe(true);
        });

                it('should parse superscript', () => {
            const doc = parse('$x^2$');
            expect(doc.children.length).toBeGreaterThan(0);
            // Check that we have superscript nodes inside math nodes
            const hasSuperscriptNodes = doc.children.some(child =>
                child instanceof MathNode && child.children.some(grandchild =>
                    grandchild.type === TokenType.SUPERSCRIPT ||
                    grandchild instanceof SuperscriptNode
                )
            );
            expect(hasSuperscriptNodes).toBe(true);
        });

                it('should parse subscript', () => {
            const doc = parse('$x~n$');
            expect(doc.children.length).toBeGreaterThan(0);
            // Check that we have subscript nodes inside math nodes
            const hasSubscriptNodes = doc.children.some(child =>
                child instanceof MathNode && child.children.some(grandchild =>
                    grandchild.type === TokenType.SUBSCRIPT ||
                    grandchild instanceof SubscriptNode
                )
            );
            expect(hasSubscriptNodes).toBe(true);
        });

        it('should parse complex math expressions', () => {
            const doc = parse('$f(x) = x^2 + y~1$');
            expect(doc.children.length).toBeGreaterThan(0);
            // Check that we have math-related nodes
            const hasMathNodes = doc.children.some(child =>
                child.type === TokenType.MATH ||
                child instanceof MathNode
            );
            expect(hasMathNodes).toBe(true);
        });
    });

    // Regression for #20: parse() advanced again after inline sub-parsers had
    // already moved past their closing token, dropping the next token.
    describe('Tokens after inline constructs', () => {
        const cases: Array<[string, string, string]> = [
            ['bold', '**bold**,', ','],
            ['italic (*)', '*it*.', '.'],
            ['italic (_)', '_it_!', '!'],
            ['strikethrough', '~~gone~~;', ';'],
            ['link', '[link](http://x.com).', '.'],
            ['inline code', '`code`:', ':'],
            ['math', '$x$?', '?'],
        ];

        it.each(cases)('keeps the token right after %s', (_name, input, after) => {
            const doc = parse(input);
            expect(doc.children).toHaveLength(2);
            expect(doc.children[1].type).toBe(TokenType.TEXT);
            expect(doc.children[1].value).toBe(after);
        });

        it('keeps the token right after a horizontal rule', () => {
            const doc = parse('**b**\n---tail');
            expect(doc.children.map(c => c.type)).toEqual([
                TokenType.BOLD, TokenType.NEWLINE, TokenType.HORIZONTAL_RULE, TokenType.TEXT,
            ]);
            expect(doc.children[3].value).toBe('tail');
        });

        it('keeps the newline after a horizontal rule', () => {
            const doc = parse('---\nafter');
            expect(doc.children.map(c => c.type)).toEqual([
                TokenType.HORIZONTAL_RULE, TokenType.NEWLINE, TokenType.TEXT,
            ]);
            expect(doc.children[2].value).toBe('after');
        });

        it('keeps the newline after unclosed inline code', () => {
            const doc = parse('`code\nnext');
            expect(doc.children.map(c => c.type)).toEqual([
                TokenType.INLINE_CODE, TokenType.NEWLINE, TokenType.TEXT,
            ]);
        });

        it('keeps the token right after superscript', () => {
            const doc = parse('x^2 a');
            expect(doc.children.map(c => c.type)).toEqual([
                TokenType.TEXT, TokenType.SUPERSCRIPT, TokenType.SPACE, TokenType.TEXT,
            ]);
            expect(doc.children[3].value).toBe('a');
        });

        it('consumes the closing marker of paired subscript', () => {
            const doc = parse('H~2~O');
            expect(doc.children.map(c => c.type)).toEqual([
                TokenType.TEXT, TokenType.SUBSCRIPT, TokenType.TEXT,
            ]);
            expect((doc.children[1] as SubscriptNode).text).toBe('2');
            expect(doc.children[2].value).toBe('O');
        });

        it('consumes the closing marker of paired superscript', () => {
            const doc = parse('x^2^ y');
            expect(doc.children.map(c => c.type)).toEqual([
                TokenType.TEXT, TokenType.SUPERSCRIPT, TokenType.SPACE, TokenType.TEXT,
            ]);
            expect((doc.children[1] as SuperscriptNode).text).toBe('2');
        });

        it('keeps the token right after subscript', () => {
            const doc = parse('y~1 a');
            expect(doc.children.map(c => c.type)).toEqual([
                TokenType.TEXT, TokenType.SUBSCRIPT, TokenType.SPACE, TokenType.TEXT,
            ]);
            expect(doc.children[3].value).toBe('a');
        });
    });

    describe('Code', () => {
        function parseWithErrors(input: string): [DocumentNode, string[]] {
            const parser = new Parser(new Lexer(input));
            const doc = parser.parse();
            return [doc, parser.getErrors()];
        }

        it('parses inline code without errors', () => {
            const [doc, errors] = parseWithErrors('Use `a_b` here');
            expect(errors).toEqual([]);
            expect(doc.children.map(c => c.type)).toEqual([
                TokenType.TEXT, TokenType.SPACE, TokenType.INLINE_CODE, TokenType.SPACE, TokenType.TEXT,
            ]);
        });

        it('parses a fenced code block into a CodeBlockNode', () => {
            const [doc, errors] = parseWithErrors('```python\nprint(1)\n```\nafter');
            expect(errors).toEqual([]);
            expect(doc.children.map(c => c.type)).toEqual([TokenType.CODE_BLOCK, TokenType.TEXT]);
            const block = doc.children[0] as CodeBlockNode;
            expect(block).toBeInstanceOf(CodeBlockNode);
            expect(block.code).toBe('print(1)\n');
            expect(block.language).toBe('python');
        });

        it('terminates on an unterminated fence', () => {
            const [doc] = parseWithErrors('```\nnever closed');
            expect(doc.children.map(c => c.type)).toEqual([TokenType.CODE_BLOCK]);
            expect((doc.children[0] as CodeBlockNode).code).toBe('never closed\n');
        });
    });

    describe('Inline content in containers', () => {
        it('should parse literal parentheses as text nodes', () => {
            const doc = parse('hello (world)');
            const values = doc.children.map(child => child.value);
            expect(doc.children.every(child => child instanceof TextNode || child.type === TokenType.SPACE)).toBe(true);
            expect(values.join('')).toBe('hello (world)');
        });

        it('should keep inline code, link and math nodes inside containers', () => {
            const header = parse('# Title `code`').children[0];
            expect(header).toBeInstanceOf(Header1Node);
            expect(header.children.some(child => child instanceof InlineCodeNode)).toBe(true);

            const bold = parse('**a `b` c**').children[0];
            expect(bold).toBeInstanceOf(BoldNode);
            expect(bold.children.some(child => child instanceof InlineCodeNode)).toBe(true);

            const quote = parse('> [link](url)').children[0];
            expect(quote).toBeInstanceOf(BlockquoteNode);
            const link = quote.children.find(child => child instanceof LinkNode) as LinkNode;
            expect(link).toBeDefined();
            expect(link.text).toBe('link');
            expect(link.url).toBe('url');

            const headerLink = parse('# [x](https://e.com/a(b)) after').children[0]
                .children.find(child => child instanceof LinkNode) as LinkNode;
            expect(headerLink.url).toBe('https://e.com/a(b)');

            const list = parse('- [ ] solve $x^2$').children[0] as ListNode;
            expect(list).toBeInstanceOf(ListNode);
            const checklist = list.items[0];
            expect(checklist).toBeInstanceOf(ChecklistNode);
            expect(checklist.children.some(child => child instanceof MathNode)).toBe(true);
        });
    });

    describe('Errors', () => {
        function errorsFor(input: string): string[] {
            const parser = new Parser(new Lexer(input));
            parser.parse();
            return parser.getErrors();
        }

        it('reports no errors for a horizontal rule', () => {
            expect(errorsFor('---\nafter rule')).toEqual([]);
        });

        it('reports no errors for a representative valid document', () => {
            const doc = [
                '# Title',
                '## Subtitle',
                '',
                'Some **bold**, _italic_ and ~~struck~~ text with a [link](https://example.com).',
                'Use `inline_code` here and math $x^2 + y_1$ inline.',
                '',
                '```ts',
                'const a = 1;',
                '```',
                '',
                '- one',
                '- two',
                '',
                '1. first',
                '2. second',
                '',
                '- [ ] todo',
                '- [x] done',
                '',
                '> quoted',
                '',
                '---',
                'after rule',
            ].join('\n');
            expect(errorsFor(doc)).toEqual([]);
        });

        it('still reports genuinely unmatched bold', () => {
            expect(errorsFor('**never closed')).toEqual(['Unmatched ** for bold text']);
        });
    });
});
