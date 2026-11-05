import {
    LaTeXNode,
    DocumentNode,
    SectionNode,
    TextNode,
    CommandNode,
    EnvironmentNode,
    ItemNode,
    TableRowNode,
    TableCellNode,
    MathNode,
    CommentNode,
    htmlEscape,
    extractLanguage,
} from '../../src/latex/Ast';
import { TokenType } from '../../src/latex/Token';

describe('latex AST', () => {
    it('DocumentNode constructor', () => {
        const doc = new DocumentNode([new TextNode('Test')]);
        expect(doc.type).toBe(TokenType.EOF);
        expect(doc.children).toHaveLength(1);
        expect(doc.documentClass).toBe('article');
        expect(doc.packages).toEqual([]);
    });

    it('DocumentNode renderHTML produces a full document', () => {
        const doc = new DocumentNode([new SectionNode(1, 'Title'), new TextNode('Content')]);
        const result = doc.renderHTML();
        for (const part of [
            '<!DOCTYPE html>',
            '<html>',
            '<head>',
            '<meta charset="UTF-8">',
            '<title>LaTeX Document</title>',
            '<style>',
            '<body>',
            '</body>',
            '</html>',
        ]) {
            expect(result).toContain(part);
        }
    });

    it('SectionNode constructor maps levels to token types', () => {
        const cases: Array<[number, TokenType]> = [
            [1, TokenType.SECTION],
            [2, TokenType.SUBSECTION],
            [3, TokenType.SUBSUBSECTION],
            [4, TokenType.PARAGRAPH],
            [5, TokenType.SUBPARAGRAPH],
        ];
        for (const [level, expected] of cases) {
            const section = new SectionNode(level, 'Test Title');
            expect(section.type).toBe(expected);
            expect(section.level).toBe(level);
            expect(section.title).toBe('Test Title');
        }
    });

    it.each([
        [1, '<h1>Test Title</h1>'],
        [2, '<h2>Test Title</h2>'],
        [3, '<h3>Test Title</h3>'],
        [4, '<h4>Test Title</h4>'],
        [5, '<h5>Test Title</h5>'],
        [6, '<h6>Test Title</h6>'],
        [7, '<h6>Test Title</h6>'], // capped at h6
    ])('SectionNode level %i renders %s', (level, expected) => {
        expect(new SectionNode(level, 'Test Title').renderHTML()).toBe(expected + '\n');
    });

    it('TextNode constructor', () => {
        const text = new TextNode('Hello World');
        expect(text.type).toBe(TokenType.TEXT);
        expect(text.text).toBe('Hello World');
    });

    it.each([
        ['Hello World', 'Hello World'],
        ['Text with & ampersand', 'Text with &amp; ampersand'],
        ['Text with < less than', 'Text with &lt; less than'],
        ['Text with > greater than', 'Text with &gt; greater than'],
        ['Text with " quote', 'Text with &quot; quote'],
        ["Text with ' apostrophe", 'Text with &#39; apostrophe'],
    ])('TextNode renders %j escaped', (input, expected) => {
        expect(new TextNode(input).renderHTML()).toBe(expected);
    });

    it.each([
        [TokenType.TEXTBF, 'textbf', 'bold text', ''],
        [TokenType.HREF, 'href', 'link text', 'https://example.com'],
        [TokenType.TEXTIT, 'textit', 'italic text', ''],
    ])('CommandNode constructor (%s)', (type, command, value, options) => {
        const node = new CommandNode(type, command, value, options);
        expect(node.type).toBe(type);
        expect(node.command).toBe(command);
        expect(node.value).toBe(value);
        expect(node.options).toBe(options);
    });

    it.each([
        [TokenType.TEXTBF, 'bold', '<strong>bold</strong>'],
        [TokenType.TEXTIT, 'italic', '<em>italic</em>'],
        [TokenType.UNDERLINE, 'underlined', '<u>underlined</u>'],
        [TokenType.SOUT, 'strikethrough', '<s>strikethrough</s>'],
        [TokenType.TEXTSUPERSCRIPT, 'super', '<sup>super</sup>'],
        [TokenType.TEXTSUBSCRIPT, 'sub', '<sub>sub</sub>'],
        [TokenType.TEXTTT, 'code', '<code>code</code>'],
        [TokenType.LINEBREAK, '', '<br>\n'],
        [TokenType.HRULE, '', '<hr>\n'],
    ])('CommandNode %s renders', (type, value, expected) => {
        expect(new CommandNode(type, '', value, '').renderHTML()).toBe(expected);
    });

    it('CommandNode renders href', () => {
        const node = new CommandNode(TokenType.HREF, 'href', 'Link Text', 'https://example.com');
        expect(node.renderHTML()).toBe('<a href="https://example.com">Link Text</a>');
    });

    it.each([
        [TokenType.ITEMIZE, 'itemize', ''],
        [TokenType.ENUMERATE, 'enumerate', ''],
        [TokenType.LSTLISTING, 'lstlisting', 'language=go'],
        [TokenType.QUOTE, 'quote', ''],
    ])('EnvironmentNode constructor (%s)', (type, environment, options) => {
        const node = new EnvironmentNode(type, environment, options);
        expect(node.type).toBe(type);
        expect(node.environment).toBe(environment);
        expect(node.options).toBe(options);
    });

    it.each([
        ['itemize', '<ul>\n</ul>\n'],
        ['enumerate', '<ol>\n</ol>\n'],
        ['quote', '<blockquote>\n</blockquote>\n'],
        ['tabular', '<table>\n</table>\n'],
        ['custom', '<div class="custom">\n</div>\n'],
    ])('EnvironmentNode %s renders', (environment, expected) => {
        expect(new EnvironmentNode(TokenType.BEGIN, environment, '').renderHTML()).toBe(expected);
    });

    it('EnvironmentNode renders lstlisting with and without language', () => {
        const withLang = new EnvironmentNode(TokenType.LSTLISTING, 'lstlisting', 'language=go');
        withLang.children = [new TextNode('func main() {}')];
        expect(withLang.renderHTML()).toBe('<pre><code class="language-go">func main() {}</code></pre>\n');

        const noLang = new EnvironmentNode(TokenType.LSTLISTING, 'lstlisting', '');
        noLang.children = [new TextNode('code')];
        expect(noLang.renderHTML()).toBe('<pre><code>code</code></pre>\n');
    });

    it('ItemNode constructor', () => {
        expect(new ItemNode().type).toBe(TokenType.ITEM);
    });

    it('ItemNode renders', () => {
        const item = new ItemNode();
        item.children = [new TextNode('List item')];
        expect(item.renderHTML()).toBe('<li>List item</li>\n');
    });

    it('TableRowNode constructor', () => {
        const row = new TableRowNode();
        expect(row.type).toBe(TokenType.AMPERSAND);
        expect(row.cells).toHaveLength(0);
    });

    it('TableRowNode renders its cells', () => {
        const row = new TableRowNode();
        const cell1 = new TableCellNode(false);
        cell1.children = [new TextNode('Cell 1')];
        const cell2 = new TableCellNode(false);
        cell2.children = [new TextNode('Cell 2')];
        row.cells = [cell1, cell2];
        expect(row.renderHTML()).toBe('<tr><td>Cell 1</td><td>Cell 2</td></tr>\n');
    });

    it('TableCellNode constructor', () => {
        const td = new TableCellNode(false);
        expect(td.type).toBe(TokenType.AMPERSAND);
        expect(td.isHeader).toBe(false);

        const th = new TableCellNode(true);
        expect(th.type).toBe(TokenType.AMPERSAND);
        expect(th.isHeader).toBe(true);
    });

    it('TableCellNode renders td and th', () => {
        const td = new TableCellNode(false);
        td.children = [new TextNode('Regular cell')];
        expect(td.renderHTML()).toBe('<td>Regular cell</td>');

        const th = new TableCellNode(true);
        th.children = [new TextNode('Header cell')];
        expect(th.renderHTML()).toBe('<th>Header cell</th>');
    });

    it('MathNode constructor', () => {
        const inline = new MathNode('E = mc^2', false);
        expect(inline.type).toBe(TokenType.MATH_INLINE);
        expect(inline.isDisplay).toBe(false);

        const display = new MathNode('\\sum_{i=1}^{n} i', true);
        expect(display.type).toBe(TokenType.MATH_DISPLAY);
        expect(display.isDisplay).toBe(true);
    });

    it('MathNode renders inline and display', () => {
        expect(new MathNode('E = mc^2', false).renderHTML())
            .toBe('<span class="math-inline"><code>E = mc^2</code></span>');
        expect(new MathNode('\\sum_{i=1}^{n} i', true).renderHTML())
            .toBe('<div class="math-display"><code>\\sum_{i=1}^{n} i</code></div>\n');
    });

    it('CommentNode constructor', () => {
        const comment = new CommentNode('% This is a comment');
        expect(comment.type).toBe(TokenType.COMMENT);
        expect(comment.comment).toBe('% This is a comment');
    });

    it('CommentNode renders as an HTML comment', () => {
        expect(new CommentNode('% This is a comment').renderHTML()).toBe('<!-- % This is a comment -->\n');
    });

    it.each([
        ['normal text', 'normal text'],
        ['text & symbols', 'text &amp; symbols'],
        ['<tag>', '&lt;tag&gt;'],
        ['"quoted"', '&quot;quoted&quot;'],
        ["'apostrophe'", '&#39;apostrophe&#39;'],
        ['mixed & <symbols> "quotes"', 'mixed &amp; &lt;symbols&gt; &quot;quotes&quot;'],
    ])('htmlEscape(%j)', (input, expected) => {
        expect(htmlEscape(input)).toBe(expected);
    });

    it.each([
        ['language=go', 'go'],
        ['language=python', 'python'],
        ['language=javascript', 'javascript'],
        ['other=value,language=java', 'java'],
        ['language=cpp,other=value', 'cpp'],
        ['no language here', ''],
        ['', ''],
    ])('extractLanguage(%j)', (options, expected) => {
        expect(extractLanguage(options)).toBe(expected);
    });

    it('LaTeXNode base methods return content', () => {
        const node = new LaTeXNode(TokenType.TEXT, 'test content');
        expect(node.tokenLiteral()).toBe('test content');
        expect(node.toString()).toBe('test content');
        expect(node.renderHTML()).toBe('test content');
    });

    it('LaTeXNode renderChildrenHTML concatenates children', () => {
        const node = new LaTeXNode(TokenType.TEXT, '', [new TextNode('Hello '), new TextNode('World')]);
        expect(node['renderChildrenHTML']()).toBe('Hello World');
    });
});
