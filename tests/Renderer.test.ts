import { Lexer } from '../src/Lexer';
import { Parser } from '../src/Parser';
import { Renderer } from '../src/Renderer';
import { Token, TokenType } from '../src/Token';
import {
    DocumentNode,
    Header1Node,
    ParagraphNode,
    ListNode,
    ListItemNode,
    ChecklistNode,
    ChecklistCheckedNode,
    BlockquoteNode,
    HorizontalRuleNode,
    LinkNode,
    BoldNode,
    ItalicNode,
    StrikethroughNode,
    InlineCodeNode,
    CodeBlockNode,
    TextNode,
    NewlineNode,
    SpaceNode,
    MathNode,
    SuperscriptNode,
    SubscriptNode
} from '../src/Ast';

describe('Renderer', () => {
    let renderer: Renderer;

    beforeEach(() => {
        renderer = new Renderer();
    });

    describe('Headers', () => {
        it('should render header1', () => {
            const token = new Token(TokenType.HEADER1, '#');
            const header = new Header1Node(token);
            header.children.push(new TextNode(new Token(TokenType.TEXT, 'Hello'), 'Hello'));

            expect(renderer.render(header)).toBe('<h1>Hello</h1>\n');
        });
    });

    describe('Lists', () => {
        it('should render unordered list', () => {
            const token = new Token(TokenType.UNORDERED_LIST, '*');
            const list = new ListNode(token, false);
            const item = new ListItemNode(new Token(TokenType.LIST_ITEM, '-'), 'Item 1');
            list.children.push(item);

            expect(renderer.render(list)).toBe('<ul><li>Item 1</li>\n</ul>\n');
        });

        it('should render checklist items wrapped in a label for accessibility', () => {
            const uncheckedToken = new Token(TokenType.CHECKLIST, '- [ ]');
            const checkedToken = new Token(TokenType.CHECKLIST_CHECKED, '- [x]');

            const unchecked = new ChecklistNode(uncheckedToken, 'Todo');
            const checked = new ChecklistCheckedNode(checkedToken, 'Done');

            expect(renderer.render(unchecked)).toBe('<li><label><input type="checkbox">Todo</label></li>\n');
            expect(renderer.render(checked)).toBe('<li><label><input type="checkbox" checked>Done</label></li>\n');
        });

        it('should render empty checklist items wrapped in a label with a fallback accessible name', () => {
            const uncheckedToken = new Token(TokenType.CHECKLIST, '- [ ]');
            const unchecked = new ChecklistNode(uncheckedToken, '');

            const checkedToken = new Token(TokenType.CHECKLIST_CHECKED, '- [x]');
            const checked = new ChecklistCheckedNode(checkedToken, '');

            expect(renderer.render(unchecked)).toBe('<li><label><input type="checkbox" aria-label="Task"></label></li>\n');
            expect(renderer.render(checked)).toBe('<li><label><input type="checkbox" checked aria-label="Task"></label></li>\n');
        });

        it('should render empty-bold checklist items with a fallback accessible name', () => {
            const uncheckedToken = new Token(TokenType.CHECKLIST, '- [ ]');
            const unchecked = new ChecklistNode(uncheckedToken, '');
            unchecked.children = [new BoldNode(new Token(TokenType.BOLD, '**'), '')];

            const checkedToken = new Token(TokenType.CHECKLIST_CHECKED, '- [x]');
            const checked = new ChecklistCheckedNode(checkedToken, '');
            checked.children = [new BoldNode(new Token(TokenType.BOLD, '**'), '')];

            expect(renderer.render(unchecked)).toBe('<li><label><input type="checkbox" aria-label="Task"><b></b></label></li>\n');
            expect(renderer.render(checked)).toBe('<li><label><input type="checkbox" checked aria-label="Task"><b></b></label></li>\n');
        });
    });

    describe('Text Formatting', () => {
        it('should render bold text', () => {
            const token = new Token(TokenType.BOLD, '**');
            const bold = new BoldNode(token, 'Bold text');
            bold.children.push(new TextNode(new Token(TokenType.TEXT, 'Bold text'), 'Bold text'));

            expect(renderer.render(bold)).toBe('<b>Bold text</b>');
        });

        it('should render italic text', () => {
            const token = new Token(TokenType.ITALIC, '_');
            const italic = new ItalicNode(token, 'Italic text');
            italic.children.push(new TextNode(new Token(TokenType.TEXT, 'Italic text'), 'Italic text'));

            expect(renderer.render(italic)).toBe('<i>Italic text</i>');
        });
    });

    describe('Links', () => {
        it('should render links', () => {
            const token = new Token(TokenType.LINK_TEXT_START, '[');
            const link = new LinkNode(token, 'Example', 'https://example.com');

            expect(renderer.render(link)).toBe('<a href="https://example.com">Example</a>');
        });
    });

    describe('Code', () => {
        it('should render inline code', () => {
            const token = new Token(TokenType.INLINE_CODE, '`');
            const code = new InlineCodeNode(token, 'console.log()');
            code.children.push(new TextNode(new Token(TokenType.TEXT, 'console.log()'), 'console.log()'));

            expect(renderer.render(code)).toBe('<code>console.log()</code>');
        });

        it('should render a code block with a language, escaped', () => {
            const block = new CodeBlockNode(new Token(TokenType.CODE_BLOCK, ''), 'a < b && c > d\n', 'js');
            expect(renderer.render(block)).toBe(
                '<pre><code class="language-js">a &lt; b &amp;&amp; c &gt; d\n</code></pre>\n'
            );
        });

        it('should render a code block without a language', () => {
            const block = new CodeBlockNode(new Token(TokenType.CODE_BLOCK, ''), 'x\n');
            expect(renderer.render(block)).toBe('<pre><code>x\n</code></pre>\n');
        });

        describe('end to end', () => {
            const compile = (md: string) => renderer.render(new Parser(new Lexer(md)).parse());

            it('renders inline code', () => {
                expect(compile('Use `a_b` here')).toBe('Use <code>a_b</code> here');
            });

            it('renders the fenced block from issue #22 verbatim', () => {
                expect(compile('```\nconst a = 1;\nconst b = 2;\n```')).toBe(
                    '<pre><code>const a = 1;\nconst b = 2;\n</code></pre>\n'
                );
            });

            it('renders a fence with a language', () => {
                expect(compile('```typescript\nlet x: number = 1;\n```\n# After')).toBe(
                    '<pre><code class="language-typescript">let x: number = 1;\n</code></pre>\n<h1>After</h1>\n'
                );
            });

            it('renders an unterminated fence to the end of input', () => {
                expect(compile('```\nlet y = 2;')).toBe('<pre><code>let y = 2;\n</code></pre>\n');
            });

            it('leaves markdown inside a fence literal', () => {
                expect(compile('```\n# not a header\n**not bold** _x_ [a](b) <tag>\n```')).toBe(
                    '<pre><code># not a header\n**not bold** _x_ [a](b) &lt;tag&gt;\n</code></pre>\n'
                );
            });
        });
    });

    describe('Math', () => {
        it('should render math expressions', () => {
            const token = new Token(TokenType.MATH, '$');
            const math = new MathNode(token, '1+2=3');
            math.children.push(new TextNode(new Token(TokenType.TEXT, '1+2=3'), '1+2=3'));

            expect(renderer.render(math)).toBe('<span class="math">1+2=3</span>');
        });

        it('should render superscript', () => {
            const token = new Token(TokenType.SUPERSCRIPT, '^');
            const sup = new SuperscriptNode(token, '2');
            sup.children.push(new TextNode(new Token(TokenType.TEXT, '2'), '2'));

            expect(renderer.render(sup)).toBe('<sup>2</sup>');
        });

        it('should render subscript', () => {
            const token = new Token(TokenType.SUBSCRIPT, '~');
            const sub = new SubscriptNode(token, '2');
            sub.children.push(new TextNode(new Token(TokenType.TEXT, '2'), '2'));

            expect(renderer.render(sub)).toBe('<sub>2</sub>');
        });

        it('falls back to children when math, superscript and subscript have no text', () => {
            const math = new MathNode(new Token(TokenType.MATH, '$'), '');
            math.children.push(new TextNode(new Token(TokenType.TEXT, 'x'), 'x'));
            const sup = new SuperscriptNode(new Token(TokenType.SUPERSCRIPT, '^'), '');
            sup.children.push(new TextNode(new Token(TokenType.TEXT, 'a'), 'a'));
            const sub = new SubscriptNode(new Token(TokenType.SUBSCRIPT, '~'), '');
            sub.children.push(new TextNode(new Token(TokenType.TEXT, 'b'), 'b'));

            expect(renderer.render(math)).toBe('<span class="math">x</span>');
            expect(renderer.render(sup)).toBe('<sup>a</sup>');
            expect(renderer.render(sub)).toBe('<sub>b</sub>');
        });

        it('renders parsed math with superscript and subscript end to end', () => {
            const compile = (md: string) => renderer.render(new Parser(new Lexer(md)).parse());
            expect(compile('$x^2^ + y~i~$ and H~2~O')).toBe(
                '<span class="math">x<sup>2</sup> + y<sub>i</sub></span> and H<sub>2</sub>O'
            );
        });
    });

    describe('Other Elements', () => {
        it('should render blockquotes', () => {
            const token = new Token(TokenType.BLOCKQUOTE, '>');
            const quote = new BlockquoteNode(token, 'Quote text');

            expect(renderer.render(quote)).toBe('<blockquote>Quote text</blockquote>\n');
        });

        it('should render horizontal rules', () => {
            const token = new Token(TokenType.HORIZONTAL_RULE, '---');
            const rule = new HorizontalRuleNode(token);

            expect(renderer.render(rule)).toBe('<hr>\n');
        });

        it('should render newlines', () => {
            const token = new Token(TokenType.NEWLINE, '\n');
            const newline = new NewlineNode(token);

            expect(renderer.render(newline)).toBe('<br>\n');
        });

        it('should render spaces', () => {
            const token = new Token(TokenType.SPACE, ' ');
            const space = new SpaceNode(token);

            expect(renderer.render(space)).toBe(' ');
        });
    });

    describe('Document', () => {
        it('should render complete document', () => {
            const doc = new DocumentNode();
            const header = new Header1Node(new Token(TokenType.HEADER1, '#'));
            header.children.push(new TextNode(new Token(TokenType.TEXT, 'Title'), 'Title'));

            const para = new ParagraphNode(new Token(TokenType.PARAGRAPH, 'Text'), 'Text');

            doc.children.push(header);
            doc.children.push(para);
            // console.log(renderer.render(doc));
            expect(renderer.render(doc)).toBe('<h1>Title</h1>\nText');
        });
    });
});
