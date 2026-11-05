import { Renderer, RenderOptions, getDefaultCSS } from '../../src/latex/Renderer';
import {
    DocumentNode,
    SectionNode,
    TextNode,
    CommandNode,
    EnvironmentNode,
    ItemNode,
    MathNode,
    htmlEscape,
} from '../../src/latex/Ast';
import { TokenType } from '../../src/latex/Token';

function contentDoc(): DocumentNode {
    return new DocumentNode([new TextNode('Content')]);
}

describe('latex Renderer', () => {
    let r: Renderer;
    beforeEach(() => {
        r = new Renderer();
    });

    it('constructs', () => {
        expect(r).toBeDefined();
    });

    it('renders a TextNode', () => {
        expect(r.render(new TextNode('Hello World'))).toBe('Hello World');
    });

    it.each([
        [1, '<h1>Test</h1>'],
        [2, '<h2>Test</h2>'],
        [3, '<h3>Test</h3>'],
        [4, '<h4>Test</h4>'],
        [5, '<h5>Test</h5>'],
        [6, '<h6>Test</h6>'],
    ])('renders SectionNode level %i', (level, expected) => {
        expect(r.render(new SectionNode(level, 'Test'))).toContain(expected);
    });

    it.each([
        [TokenType.TEXTBF, 'bold', '<strong>bold</strong>'],
        [TokenType.TEXTIT, 'italic', '<em>italic</em>'],
        [TokenType.UNDERLINE, 'underlined', '<u>underlined</u>'],
        [TokenType.SOUT, 'strikethrough', '<s>strikethrough</s>'],
        [TokenType.TEXTSUPERSCRIPT, 'super', '<sup>super</sup>'],
        [TokenType.TEXTSUBSCRIPT, 'sub', '<sub>sub</sub>'],
        [TokenType.TEXTTT, 'code', '<code>code</code>'],
    ])('renders CommandNode %s', (type, value, expected) => {
        expect(r.render(new CommandNode(type, '', value, ''))).toBe(expected);
    });

    it.each([
        [TokenType.ITEMIZE, 'itemize', '<ul>'],
        [TokenType.ENUMERATE, 'enumerate', '<ol>'],
        [TokenType.QUOTE, 'quote', '<blockquote>'],
        [TokenType.TABULAR, 'tabular', '<table>'],
    ])('renders EnvironmentNode %s', (type, environment, expected) => {
        expect(r.render(new EnvironmentNode(type, environment, ''))).toContain(expected);
    });

    it('renders MathNode', () => {
        expect(r.render(new MathNode('E = mc^2', false))).toContain('math-inline');
        expect(r.render(new MathNode('\\sum_{i=1}^{n} i', true))).toContain('math-display');
    });

    it('renders null/undefined node as empty string', () => {
        expect(r.render(null)).toBe('');
        expect(r.render(undefined)).toBe('');
    });

    it('renderToString', () => {
        expect(r.renderToString(new TextNode('Test'))).toBe('Test');
    });

    it('renderDocument produces a full document', () => {
        const doc = new DocumentNode([new SectionNode(1, 'Title'), new TextNode('Content')]);
        const result = r.renderDocument(doc);
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

    it('renderDocument(null) is empty', () => {
        expect(r.renderDocument(null)).toBe('');
    });

    it('renderBodyOnly omits the wrapper', () => {
        const doc = new DocumentNode([new SectionNode(1, 'Title'), new TextNode('Content')]);
        const result = r.renderBodyOnly(doc);
        expect(result).not.toContain('<!DOCTYPE html>');
        expect(result).not.toContain('<html>');
        expect(result).toContain('Title');
        expect(result).toContain('Content');
    });

    it('renderBodyOnly(null) is empty', () => {
        expect(r.renderBodyOnly(null)).toBe('');
    });

    it('renderWithOptions applies options', () => {
        const result = r.renderWithOptions(contentDoc(), {
            includeDoctype: true,
            includeStyle: true,
            title: 'Custom Title',
            language: 'en',
            customCSS: 'body { color: red; }',
        });
        expect(result).toContain('<!DOCTYPE html>');
        expect(result).toContain('<title>Custom Title</title>');
        expect(result).toContain('lang="en"');
        expect(result).toContain('body { color: red; }');
    });

    it('renderWithOptions bodyOnly', () => {
        const result = r.renderWithOptions(contentDoc(), { bodyOnly: true });
        expect(result).not.toContain('<!DOCTYPE html>');
        expect(result).toContain('Content');
    });

    it('renderWithOptions without doctype or style', () => {
        const result = r.renderWithOptions(contentDoc(), { includeDoctype: false, includeStyle: false });
        expect(result).not.toContain('<!DOCTYPE html>');
        expect(result).not.toContain('<style>');
    });

    it('renderWithOptions uses default title when empty', () => {
        const result = r.renderWithOptions(contentDoc(), { includeDoctype: true, title: '' });
        expect(result).toContain('<title>LaTeX Document</title>');
    });

    it('renderWithOptions(null) is empty', () => {
        expect(r.renderWithOptions(null, {})).toBe('');
    });

    it('renderWithMathJax injects the MathJax config', () => {
        const result = r.renderWithMathJax(contentDoc());
        // polyfill.io was taken over and serves malware; it must never be emitted.
        expect(result).not.toContain('polyfill.io');
        for (const part of [
            '<script id="MathJax-script"',
            'MathJax = {',
            "inlineMath: [['$', '$']",
            "displayMath: [['$$', '$$']",
        ]) {
            expect(result).toContain(part);
        }
        // Regression guard for String.replace "$$" substitution: the config must
        // keep the doubled dollar signs and the doubled backslashes from Go.
        expect(result).toContain(String.raw`inlineMath: [['$', '$'], ['\\(', '\\)']],`);
        expect(result).toContain(String.raw`displayMath: [['$$', '$$'], ['\\[', '\\]']]`);
        expect(result.split('</head>')).toHaveLength(2);
    });

    it.each([
        ['Hello\n\n\nWorld', 'Hello\n\nWorld'],
        ['  \n  Text  \n  ', 'Text'],
        ['Normal text', 'Normal text'],
        ['', ''],
        ['\n\n\n', ''],
    ])('cleanOutput(%j)', (input, expected) => {
        expect(r.cleanOutput(input)).toBe(expected);
    });

    it('getDefaultCSS contains the expected rules', () => {
        const css = getDefaultCSS();
        for (const element of [
            'body {',
            'h1, h2, h3, h4, h5, h6 {',
            'strong {',
            'em {',
            'code {',
            'pre {',
            'table {',
            'th, td {',
            '.math-display {',
            '.math-inline {',
        ]) {
            expect(css).toContain(element);
        }
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

    it('RenderOptions has the expected fields', () => {
        const options: RenderOptions = {
            includeDoctype: true,
            includeStyle: true,
            customCSS: 'test',
            title: 'Test Title',
            language: 'en',
            bodyOnly: false,
        };
        expect(options.includeDoctype).toBe(true);
        expect(options.includeStyle).toBe(true);
        expect(options.customCSS).toBe('test');
        expect(options.title).toBe('Test Title');
        expect(options.language).toBe('en');
        expect(options.bodyOnly).toBe(false);
    });

    it('renders a complex document', () => {
        const list = new EnvironmentNode(TokenType.ITEMIZE, 'itemize', '');
        const item1 = new ItemNode();
        item1.children = [new TextNode('First item')];
        list.children = [item1];

        const doc = new DocumentNode([
            new SectionNode(1, 'Introduction'),
            new CommandNode(TokenType.TEXTBF, 'textbf', 'important', ''),
            list,
            new MathNode('E = mc^2', false),
        ]);
        const result = r.renderDocument(doc);

        expect(result).toContain('<h1>Introduction</h1>');
        expect(result).toContain('<strong>important</strong>');
        expect(result).toContain('<ul>');
        expect(result).toContain('<li>First item</li>');
        expect(result).toContain('math-inline');
    });

    it('includes the viewport meta tag', () => {
        expect(r.renderWithOptions(contentDoc(), { includeDoctype: true })).toContain('viewport');
    });
});
