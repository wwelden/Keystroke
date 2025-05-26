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

        it('should render checklist items', () => {
            const uncheckedToken = new Token(TokenType.CHECKLIST, '- [ ]');
            const checkedToken = new Token(TokenType.CHECKLIST_CHECKED, '- [x]');

            const unchecked = new ChecklistNode(uncheckedToken, 'Todo');
            const checked = new ChecklistCheckedNode(checkedToken, 'Done');

            expect(renderer.render(unchecked)).toBe('<li><input type="checkbox">Todo</li>\n');
            expect(renderer.render(checked)).toBe('<li><input type="checkbox" checked>Done</li>\n');
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

            expect(renderer.render(italic)).toBe('<i>Italic text</i>\n');
        });
    });

    describe('Links', () => {
        it('should render links', () => {
            const token = new Token(TokenType.LINK_TEXT_START, '[');
            const link = new LinkNode(token, 'Example', 'https://example.com');

            expect(renderer.render(link)).toBe('<a href="https://example.com">Example</a>\n');
        });
    });

    describe('Code', () => {
        it('should render inline code', () => {
            const token = new Token(TokenType.INLINE_CODE, '`');
            const code = new InlineCodeNode(token, 'console.log()');
            code.children.push(new TextNode(new Token(TokenType.TEXT, 'console.log()'), 'console.log()'));

            expect(renderer.render(code)).toBe('<code>console.log()</code>\n');
        });
    });

    describe('Math', () => {
        it('should render math expressions', () => {
            const token = new Token(TokenType.MATH, '$');
            const math = new MathNode(token, '1+2=3');
            math.children.push(new TextNode(new Token(TokenType.TEXT, '1+2=3'), '1+2=3'));

            expect(renderer.render(math)).toBe('<span class="math">1+2=3</span>\n');
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
