"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Renderer_1 = require("../src/Renderer");
const Token_1 = require("../src/Token");
const Ast_1 = require("../src/Ast");
describe('Renderer', () => {
    let renderer;
    beforeEach(() => {
        renderer = new Renderer_1.Renderer();
    });
    describe('Headers', () => {
        it('should render header1', () => {
            const token = new Token_1.Token(Token_1.TokenType.HEADER1, '#');
            const header = new Ast_1.Header1Node(token);
            header.children.push(new Ast_1.TextNode(new Token_1.Token(Token_1.TokenType.TEXT, 'Hello'), 'Hello'));
            expect(renderer.render(header)).toBe('<h1>Hello</h1>\n');
        });
    });
    describe('Lists', () => {
        it('should render unordered list', () => {
            const token = new Token_1.Token(Token_1.TokenType.UNORDERED_LIST, '*');
            const list = new Ast_1.ListNode(token, false);
            const item = new Ast_1.ListItemNode(new Token_1.Token(Token_1.TokenType.LIST_ITEM, '-'), 'Item 1');
            list.children.push(item);
            expect(renderer.render(list)).toBe('<ul><li>Item 1</li>\n</ul>\n');
        });
        it('should render checklist items', () => {
            const uncheckedToken = new Token_1.Token(Token_1.TokenType.CHECKLIST, '- [ ]');
            const checkedToken = new Token_1.Token(Token_1.TokenType.CHECKLIST_CHECKED, '- [x]');
            const unchecked = new Ast_1.ChecklistNode(uncheckedToken, 'Todo');
            const checked = new Ast_1.ChecklistCheckedNode(checkedToken, 'Done');
            expect(renderer.render(unchecked)).toBe('<li><input type="checkbox">Todo</li>\n');
            expect(renderer.render(checked)).toBe('<li><input type="checkbox" checked>Done</li>\n');
        });
    });
    describe('Text Formatting', () => {
        it('should render bold text', () => {
            const token = new Token_1.Token(Token_1.TokenType.BOLD, '**');
            const bold = new Ast_1.BoldNode(token, 'Bold text');
            bold.children.push(new Ast_1.TextNode(new Token_1.Token(Token_1.TokenType.TEXT, 'Bold text'), 'Bold text'));
            expect(renderer.render(bold)).toBe('<b>Bold text</b>\n');
        });
        it('should render italic text', () => {
            const token = new Token_1.Token(Token_1.TokenType.ITALIC, '_');
            const italic = new Ast_1.ItalicNode(token, 'Italic text');
            italic.children.push(new Ast_1.TextNode(new Token_1.Token(Token_1.TokenType.TEXT, 'Italic text'), 'Italic text'));
            expect(renderer.render(italic)).toBe('<i>Italic text</i>\n');
        });
    });
    describe('Links', () => {
        it('should render links', () => {
            const token = new Token_1.Token(Token_1.TokenType.LINK_TEXT_START, '[');
            const link = new Ast_1.LinkNode(token, 'Example', 'https://example.com');
            expect(renderer.render(link)).toBe('<a href="https://example.com">Example</a>\n');
        });
    });
    describe('Code', () => {
        it('should render inline code', () => {
            const token = new Token_1.Token(Token_1.TokenType.INLINE_CODE, '`');
            const code = new Ast_1.InlineCodeNode(token, 'console.log()');
            code.children.push(new Ast_1.TextNode(new Token_1.Token(Token_1.TokenType.TEXT, 'console.log()'), 'console.log()'));
            expect(renderer.render(code)).toBe('<code>console.log()</code>\n');
        });
    });
    describe('Math', () => {
        it('should render math expressions', () => {
            const token = new Token_1.Token(Token_1.TokenType.MATH, '$');
            const math = new Ast_1.MathNode(token, '1+2=3');
            math.children.push(new Ast_1.TextNode(new Token_1.Token(Token_1.TokenType.TEXT, '1+2=3'), '1+2=3'));
            expect(renderer.render(math)).toBe('<span class="math">1+2=3</span>\n');
        });
        it('should render superscript', () => {
            const token = new Token_1.Token(Token_1.TokenType.SUPERSCRIPT, '^');
            const sup = new Ast_1.SuperscriptNode(token, '2');
            sup.children.push(new Ast_1.TextNode(new Token_1.Token(Token_1.TokenType.TEXT, '2'), '2'));
            expect(renderer.render(sup)).toBe('<sup>2</sup>');
        });
        it('should render subscript', () => {
            const token = new Token_1.Token(Token_1.TokenType.SUBSCRIPT, '~');
            const sub = new Ast_1.SubscriptNode(token, '2');
            sub.children.push(new Ast_1.TextNode(new Token_1.Token(Token_1.TokenType.TEXT, '2'), '2'));
            expect(renderer.render(sub)).toBe('<sub>2</sub>');
        });
    });
    describe('Other Elements', () => {
        it('should render blockquotes', () => {
            const token = new Token_1.Token(Token_1.TokenType.BLOCKQUOTE, '>');
            const quote = new Ast_1.BlockquoteNode(token, 'Quote text');
            expect(renderer.render(quote)).toBe('<blockquote>Quote text</blockquote>\n');
        });
        it('should render horizontal rules', () => {
            const token = new Token_1.Token(Token_1.TokenType.HORIZONTAL_RULE, '---');
            const rule = new Ast_1.HorizontalRuleNode(token);
            expect(renderer.render(rule)).toBe('<hr>\n');
        });
        it('should render newlines', () => {
            const token = new Token_1.Token(Token_1.TokenType.NEWLINE, '\n');
            const newline = new Ast_1.NewlineNode(token);
            expect(renderer.render(newline)).toBe('<br>\n');
        });
        it('should render spaces', () => {
            const token = new Token_1.Token(Token_1.TokenType.SPACE, ' ');
            const space = new Ast_1.SpaceNode(token);
            expect(renderer.render(space)).toBe(' ');
        });
    });
    describe('Document', () => {
        it('should render complete document', () => {
            const doc = new Ast_1.DocumentNode();
            const header = new Ast_1.Header1Node(new Token_1.Token(Token_1.TokenType.HEADER1, '#'));
            header.children.push(new Ast_1.TextNode(new Token_1.Token(Token_1.TokenType.TEXT, 'Title'), 'Title'));
            const para = new Ast_1.ParagraphNode(new Token_1.Token(Token_1.TokenType.PARAGRAPH, 'Text'), 'Text');
            doc.children.push(header);
            doc.children.push(para);
            // console.log(renderer.render(doc));
            expect(renderer.render(doc)).toBe('<h1>Title</h1>\nText');
        });
    });
});
