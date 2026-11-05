import {
    latexToHtml,
    latexToHtmlBodyOnly,
    latexToHtmlWithOptions,
    latexToHtmlWithMathJax,
    parseLatex,
    Converter,
    sectionToH1,
    subsectionToH2,
    subsubsectionToH3,
    textbfToStrong,
    textitToEm,
    textttToCode,
    hrefToLink,
    defaultOptions,
    minimalOptions,
    academicOptions,
} from '../../src/latex';

describe('latex public API', () => {
    it('latexToHtml produces a full document', () => {
        const result = latexToHtml('\\section{Test Title}');
        expect(result).toContain('<!DOCTYPE html>');
        expect(result).toContain('<h1>');
    });

    it('latexToHtmlBodyOnly omits the wrapper', () => {
        const result = latexToHtmlBodyOnly('\\section{Test Title}');
        expect(result).not.toContain('<!DOCTYPE html>');
        expect(result).toContain('<h1>');
    });

    it('converts text formatting', () => {
        const result = latexToHtmlBodyOnly('\\textbf{bold} and \\textit{italic}');
        expect(result).toContain('<strong>bold</strong>');
        expect(result).toContain('<em>italic</em>');
    });

    it('converts lists', () => {
        const result = latexToHtmlBodyOnly('\\begin{itemize}\\item First\\item Second\\end{itemize}');
        expect(result).toContain('<ul>');
        expect(result).toContain('<li>');
    });

    it('converts math', () => {
        const result = latexToHtmlBodyOnly('$E = mc^2$ and $$\\sum_{i=1}^{n} i$$');
        expect(result).toContain('math-inline');
        expect(result).toContain('math-display');
    });

    it('converts links', () => {
        const result = latexToHtmlBodyOnly('\\href{https://example.com}{Link text}');
        expect(result).toContain('<a href="https://example.com">');
        expect(result).toContain('Link text');
    });

    it('latexToHtmlWithOptions applies options', () => {
        const options = defaultOptions();
        options.title = 'Custom Title';
        options.language = 'fr';
        const result = latexToHtmlWithOptions('\\section{Test}', options);
        expect(result).toContain('<title>Custom Title</title>');
        expect(result).toContain('lang="fr"');
    });

    it('latexToHtml(input, options) matches latexToHtmlWithOptions', () => {
        const options = academicOptions('Paper');
        expect(latexToHtml('\\section{Test}', options)).toBe(latexToHtmlWithOptions('\\section{Test}', options));
    });

    it('latexToHtmlWithMathJax includes MathJax', () => {
        const result = latexToHtmlWithMathJax('$E = mc^2$');
        for (const part of ['MathJax', '<script', 'inlineMath', 'displayMath']) {
            expect(result).toContain(part);
        }
    });

    describe('Converter', () => {
        it('constructs with a renderer', () => {
            const converter = new Converter();
            expect(converter).toBeDefined();
            expect(converter['renderer']).toBeDefined();
        });

        it('convert', () => {
            const result = new Converter().convert('\\section{Test}');
            expect(result).toContain('<!DOCTYPE html>');
            expect(result).toContain('<h1>Test</h1>');
        });

        it('convertBodyOnly', () => {
            const result = new Converter().convertBodyOnly('\\textbf{bold text}');
            expect(result).not.toContain('<!DOCTYPE html>');
            expect(result).toContain('<strong>bold text</strong>');
        });

        it('convertWithOptions', () => {
            const result = new Converter().convertWithOptions('\\section{Test}', minimalOptions());
            expect(result).not.toContain('<!DOCTYPE html>');
            expect(result).toContain('<h1>Test</h1>');
        });

        it('convertWithMathJax', () => {
            const result = new Converter().convertWithMathJax('$$\\sum_{i=1}^{n} i$$');
            expect(result).toContain('MathJax');
            expect(result).toContain('math-display');
        });

        it('convertToAST', () => {
            const doc = new Converter().convertToAST('\\section{Test} Content');
            expect(doc).toBeDefined();
            expect(doc.children.length).toBeGreaterThan(0);
        });

        it('renderAST', () => {
            const converter = new Converter();
            const result = converter.renderAST(converter.convertToAST('\\section{Test}'));
            expect(result).toContain('<!DOCTYPE html>');
            expect(result).toContain('<h1>Test</h1>');
        });
    });

    it('parseLatex returns document and errors', () => {
        const { document, errors } = parseLatex('\\section{Valid} \\invalidcommand{test}');
        expect(document).toBeDefined();
        expect(Array.isArray(errors)).toBe(true);
    });

    it.each([
        [sectionToH1, 'Test Title', '<h1>Test Title</h1>'],
        [subsectionToH2, 'Test Subtitle', '<h2>Test Subtitle</h2>'],
        [subsubsectionToH3, 'Test Subsubtitle', '<h3>Test Subsubtitle</h3>'],
        [textbfToStrong, 'Bold Text', '<strong>Bold Text</strong>'],
        [textitToEm, 'Italic Text', '<em>Italic Text</em>'],
        [textttToCode, 'code text', '<code>code text</code>'],
    ])('quick helper %p(%j)', (fn, input, expected) => {
        expect(fn(input)).toBe(expected);
    });

    it('hrefToLink', () => {
        expect(hrefToLink('https://example.com', 'Example')).toBe('<a href="https://example.com">Example</a>');
    });

    // Faithful to Go: the quick helpers trim/collapse newlines but do NOT escape
    // HTML (Go's latek.htmlEscape delegates to Renderer.CleanOutput).
    it('quick helpers do not HTML-escape (Go behavior)', () => {
        expect(textbfToStrong('  <b>&\n\n\n</b>  ')).toBe('<strong><b>&\n\n</b></strong>');
    });

    it('defaultOptions', () => {
        const options = defaultOptions();
        expect(options.includeDoctype).toBe(true);
        expect(options.includeStyle).toBe(true);
        expect(options.title).toBe('LaTeX Document');
        expect(options.language).toBe('en');
        expect(options.bodyOnly).toBe(false);
    });

    it('defaultOptions returns a fresh object each call', () => {
        const a = defaultOptions();
        a.title = 'changed';
        expect(defaultOptions().title).toBe('LaTeX Document');
    });

    it('minimalOptions', () => {
        const options = minimalOptions();
        expect(options.includeDoctype).toBe(false);
        expect(options.includeStyle).toBe(false);
        expect(options.bodyOnly).toBe(true);
    });

    it('academicOptions', () => {
        const options = academicOptions('Research Paper');
        expect(options.includeDoctype).toBe(true);
        expect(options.includeStyle).toBe(true);
        expect(options.title).toBe('Research Paper');
        expect(options.language).toBe('en');
        expect(options.customCSS).toContain('theorem');
        expect(options.customCSS).toContain('proof');
    });

    it('converts a complex document', () => {
        const input = `
		\\section{Introduction}

		This document demonstrates the \\textbf{LaTeX to HTML} converter.

		\\subsection{Features}

		The converter supports:

		\\begin{itemize}
		\\item Text formatting like \\textit{italic} and \\textbf{bold}
		\\item Mathematical expressions: $E = mc^2$
		\\item Code blocks: \\texttt{func main()}
		\\item Links: \\href{https://golang.org}{Go Language}
		\\end{itemize}

		\\subsection{Mathematics}

		Display math:
		$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$

		Inline math: $\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$
	`;
        const result = latexToHtml(input);
        expect(result).toContain('<!DOCTYPE html>');
        expect(result).toContain('<h1>Introduction</h1>');
        expect(result).toContain('<h2>Features</h2>');
        expect(result).toContain('<strong>LaTeX to HTML</strong>');
        expect(result).toContain('<em>italic</em>');
        expect(result).toContain('<ul>');
        expect(result).toContain('<li>');
        expect(result).toContain('<code>func main()</code>');
        expect(result).toContain('<a href="https://golang.org">Go Language</a>');
        expect(result).toContain('math-inline');
        expect(result).toContain('math-display');
    });
});

// Not part of the Go suite. Exact body output and parse errors captured from
// the Go implementation (keystroke/latek) for a spread of inputs, so the port
// stays byte-for-byte compatible. Several of these encode Go bugs on purpose,
// e.g. dropped inter-word spaces ("Hello World" -> "HelloWorld"), the second
// \item rendered outside <li>, \textbf[opt]{x} losing its argument, and
// lstlisting dropping its first word.
describe('Go parity (body output)', () => {
    const cases: Array<[string, string, string[]]> = [
        ["", "", []],
        ["Hello World", "HelloWorld", []],
        ["\\section{Introduction}", "<h1>Introduction</h1>", []],
        ["\\section{Hello World} text after", "<h1>Hello World</h1>\ntextafter", []],
        ["\\section{First}\\subsection{Second}", "<h1>First</h1>\n<h2>Second</h2>", []],
        ["\\textbf{bold} and \\textit{italic}", "<strong>bold</strong>and<em>italic</em>", []],
        ["\\textbf[opt]{bold} after", "<strong></strong>}after", ["expected next token to be LBRACE, got RBRACE instead"]],
        ["\\textbf{a \\textit{b} c}", "<strong>a\\textit{b}c</strong>", []],
        ["\\begin{itemize}\\item First\\item Second\\end{itemize}", "<ul>\n<li>First</li>\nSecond</ul>", []],
        ["\\begin{enumerate}\n\\item One two\n\\item Three\n\\end{enumerate} after", "<ol>\n<li>Onetwo</li>\nThree</ol>\nafter", []],
        ["\\begin{itemize}\\item A \\begin{enumerate}\\item B\\end{enumerate}\\item C\\end{itemize}", "<ul>\n<li>A<ol>\n<li>B</li>\n{enumerate}<li>C</li>\n{itemize}</ol>\n</li>\n</ul>", []],
        ["\\begin{quote}Quoted text\\end{quote}", "<blockquote>\nQuotedtext</blockquote>", []],
        ["\\begin{lstlisting}[language=go]\nfunc main() {}\n\\end{lstlisting}", "<pre><code class=\"language-go\">main(){}</code></pre>", []],
        ["\\begin{lstlisting}\ncode here\n\\end{lstlisting}", "<pre><code>codehere</code></pre>", []],
        ["\\begin{tabular}{ll}Cell1 & Cell2 \\\\ Cell3 & Cell4 \\\\\\end{tabular}", "<table>\n<tr><td>{ll}Cell1</td><td>Cell2</td></tr>\n<tr><td>Cell3</td><td>Cell4</td></tr>\n</table>", []],
        ["\\begin{tabular}{|c|c|}\\toprule A & B \\\\ \\midrule 1 & 2 \\\\ \\bottomrule\\end{tabular}", "<table>\n<tr><td>{|c|c|}\\topruleA</td><td>B</td></tr>\n<tr><td>\\midrule1</td><td>2</td></tr>\n<tr><td>\\bottomrule</td></tr>\n<tr><td>{tabular}</td></tr>\n</table>", []],
        ["\\begin{custom}inside\\end{custom}", "<div class=\"custom\">\ninside</div>", []],
        ["\\begin{foo\"bar}x\\end{foo\"bar}", "<div class=\"foo\"bar\">\nx</div>", []],
        ["\\href{https://example.com}{Link text}", "<a href=\"https://example.com\">Link text</a>", []],
        ["\\href{https://a.com?x=1&y=2}{A & B}", "<a href=\"https://a.com?x=1&amp;y=2\">A&amp;B</a>", []],
        ["Line one \\\\ line two", "Lineone<br>\nlinetwo", []],
        ["\\hrule", "<hr>", []],
        ["$E = mc^2$", "<span class=\"math-inline\"><code>E=mc^2</code></span>", []],
        ["$$\\sum_{i=1}^{n} i$$", "<div class=\"math-display\"><code>\\sum_{i=1}^{n}i</code></div>", []],
        ["$E = mc^2$ and $$\\sum_{i=1}^{n} i$$", "<span class=\"math-inline\"><code>E=mc^2</code></span>and<div class=\"math-display\"><code>\\sum_{i=1}^{n}i</code></div>", []],
        ["$unterminated", "<span class=\"math-inline\"><code>unterminated</code></span>", []],
        ["% This is a comment\nText", "<!-- % This is a comment -->\nText", []],
        ["\\documentclass[12pt]{article}\n\\usepackage{amsmath}\nBody", "Body", []],
        ["\\section{Valid} \\invalidcommand{test}", "<h1>Valid</h1>\n\\invalidcommand{test}", []],
        ["Special <chars> & \"quotes\" 'apos'", "Special&lt;chars&gt;&amp;&quot;quotes&quot;&#39;apos&#39;", []],
        ["a_b^c & d ] [ }", "a_b^c&amp;d][}", []],
        ["\\section", "<h1></h1>", ["expected next token to be LBRACE, got EOF instead"]],
        ["\\section{unclosed", "<h1>unclosed</h1>", []],
        ["\\paragraph{P}\\subparagraph{S}\\subsubsection{SS}", "<h4>P</h4>\n<h5>S</h5>\n<h3>SS</h3>", []],
        ["\\underline{u}\\sout{s}\\textsuperscript{sp}\\textsubscript{sb}\\texttt{tt}", "<u>u</u><s>s</s><sup>sp</sup><sub>sb</sub><code>tt</code>", []],
        ["\\begin{itemize}\n\\item First item\n\\item Second item with \\texttt{code}\n\\end{itemize}", "<ul>\n<li>Firstitem</li>\nSeconditemwith<code>code</code></ul>", []],
        ["\n\t\t\\section{Introduction}\n\n\t\tThis document demonstrates the \\textbf{LaTeX to HTML} converter.\n\n\t\t\\subsection{Features}\n\n\t\tThe converter supports:\n\n\t\t\\begin{itemize}\n\t\t\\item Text formatting like \\textit{italic} and \\textbf{bold}\n\t\t\\item Mathematical expressions: $E = mc^2$\n\t\t\\item Code blocks: \\texttt{func main()}\n\t\t\\item Links: \\href{https://golang.org}{Go Language}\n\t\t\\end{itemize}\n\n\t\t\\subsection{Mathematics}\n\n\t\tDisplay math:\n\t\t$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$\n\n\t\tInline math: $\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$\n\t", "<h1>Introduction</h1>\nThisdocumentdemonstratesthe<strong>LaTeX to HTML</strong>converter.<h2>Features</h2>\nTheconvertersupports:<ul>\n<li>Textformattinglike<em>italic</em>and<strong>bold</strong></li>\nMathematicalexpressions:<span class=\"math-inline\"><code>E=mc^2</code></span><li>Codeblocks:<code>func main()</code></li>\nLinks:<a href=\"https://golang.org\">Go Language</a></ul>\n<h2>Mathematics</h2>\nDisplaymath:<div class=\"math-display\"><code>\\int_{-\\infty}^{\\infty}e^{-x^2}dx=\\sqrt{\\pi}</code></div>\nInlinemath:<span class=\"math-inline\"><code>\\sum_{i=1}^{n}i=\\frac{n(n+1)}{2}</code></span>", []],
        ["\\begin{itemize}\\item x", "<ul>\n<li>x</li>\n</ul>", []],
        ["\\end{itemize} stray", "\\end{itemize}stray", []],
        ["\\begin x", "x", ["expected next token to be LBRACE, got TEXT instead"]],
        ["\\begin{quote}\\section{In}\\textbf{b}\\end{quote}", "<blockquote>\n<h1>In</h1>\n<strong>b</strong></blockquote>", []],
        ["\\begin{tabular}{l}\\textbf{H} & $x$ \\\\\\end{tabular}", "<table>\n<tr><td>{l}<strong>H</strong></td><td><span class=\"math-inline\"><code>x</code></span></td></tr>\n</table>", []],
        ["{group} [opt]", "{group}[opt]", []],
        ["\\foo\\bar baz", "\\foo\\barbaz", []],
        ["\\textit{nested {braces} here}", "<em>nested{braces}here</em>", []],
        ["\\href{u}", "<a href=\"u\"></a>", ["expected next token to be LBRACE, got EOF instead"]],
        ["\\begin{itemize}\\item a\\end{enumerate}\\item b\\end{itemize}", "<ul>\n<li>a</li>\n{enumerate}<li>b</li>\n{itemize}</ul>", []],
        ["\u0001ctrl\u007f", "\u0001ctrl\u007f", []],
        ["\r\nwin\r\nlines", "winlines", []],
        ["\\begin{itemize}\\item one\\end{itemize}\n\\section{After}", "<ul>\n<li>one</li>\n{itemize}<h1>After</h1>\n</ul>", []],
    ];

    it.each(cases)('%j', (input, expectedBody, expectedErrors) => {
        expect(latexToHtmlBodyOnly(input)).toBe(expectedBody);
        expect(parseLatex(input).errors).toEqual(expectedErrors);
    });

    // Intentional deviation: Go re-encodes each non-ASCII byte that starts a
    // token as a Latin-1 rune ("élan" -> "Ã©lan"); the port preserves it.
    it.each([
        ['café élan naïve', 'caféélannaïve'],
        ['\\textbf{élan}', '<strong>élan</strong>'],
        ['x 😀 y', 'x😀y'],
    ])('non-ASCII %j keeps characters intact', (input, expectedBody) => {
        expect(latexToHtmlBodyOnly(input)).toBe(expectedBody);
    });
});
