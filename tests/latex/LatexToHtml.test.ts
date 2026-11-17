import {
    latexToHtml,
    latexToHtmlBodyOnly,
    latexToHtmlWithOptions,
    latexToHtmlWithMathJax,
    parseLatex,
    Converter,
    CommandNode,
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
    EnvironmentNode,
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

// Not part of the Go suite. Exact body output and parse errors for a spread of
// inputs. These started as output captured from the Go implementation
// (keystroke/latek); cases where Go was wrong (dropped inter-word spaces, every
// \item after the first rendered outside <li>, \textbf[opt]{x} losing its
// argument, lstlisting losing content) now expect the correct output (#25).
describe('body output', () => {
    const cases: Array<[string, string, string[]]> = [
        ["", "", []],
        ["Hello World", "Hello World", []],
        ["\\section{Introduction}", "<h1>Introduction</h1>", []],
        ["\\section{Hello World} text after", "<h1>Hello World</h1>\ntext after", []],
        ["\\section{First}\\subsection{Second}", "<h1>First</h1>\n<h2>Second</h2>", []],
        ["\\textbf{bold} and \\textit{italic}", "<strong>bold</strong> and <em>italic</em>", []],
        ["\\textbf[opt]{bold} after", "<strong>bold</strong> after", []],
        ["\\textbf{a \\textit{b} c}", "<strong>a <em>b</em> c</strong>", []], // deviation: Go leaves nested commands literal (#35)
        ["\\begin{itemize}\\item First\\item Second\\end{itemize}", "<ul>\n<li>First</li>\n<li>Second</li>\n</ul>", []],
        ["\\begin{enumerate}\n\\item One two\n\\item Three\n\\end{enumerate} after", "<ol>\n<li>One two</li>\n<li>Three</li>\n</ol>\nafter", []],
        ["\\begin{itemize}\\item A \\begin{enumerate}\\item B\\end{enumerate}\\item C\\end{itemize}", "<ul>\n<li>A<ol>\n<li>B</li>\n</ol>\n</li>\n<li>C</li>\n</ul>", []],
        ["\\begin{quote}Quoted text\\end{quote}", "<blockquote>\nQuoted text</blockquote>", []],
        ["\\begin{lstlisting}[language=go]\nfunc main() {}\n\\end{lstlisting}", "<pre><code class=\"language-go\">func main() {}</code></pre>", []],
        ["\\begin{lstlisting}\ncode here\n\\end{lstlisting}", "<pre><code>code here</code></pre>", []],
        ["\\begin{tabular}{ll}Cell1 & Cell2 \\\\ Cell3 & Cell4 \\\\\\end{tabular}", "<table>\n<tr><td>{ll}Cell1</td><td>Cell2</td></tr>\n<tr><td>Cell3</td><td>Cell4</td></tr>\n</table>", []],
        ["\\begin{tabular}{|c|c|}\\toprule A & B \\\\ \\midrule 1 & 2 \\\\ \\bottomrule\\end{tabular}", "<table>\n<tr><td>{|c|c|}\\toprule A</td><td>B</td></tr>\n<tr><td>\\midrule 1</td><td>2</td></tr>\n<tr><td>\\bottomrule</td></tr>\n</table>", []],
        ["\\begin{custom}inside\\end{custom}", "<div class=\"custom\">\ninside</div>", []],
        ["\\begin{foo\"bar}x\\end{foo\"bar}", "<div class=\"foo\"bar\">\nx</div>", []],
        ["\\href{https://example.com}{Link text}", "<a href=\"https://example.com\">Link text</a>", []],
        ["\\href{https://a.com?x=1&y=2}{A & B}", "<a href=\"https://a.com?x=1&amp;y=2\">A &amp; B</a>", []],
        ["Line one \\\\ line two", "Line one<br>\nline two", []],
        ["\\hrule", "<hr>", []],
        ["$E = mc^2$", "<span class=\"math-inline\"><code>E = mc^2</code></span>", []],
        ["$$\\sum_{i=1}^{n} i$$", "<div class=\"math-display\"><code>\\sum_{i=1}^{n} i</code></div>", []],
        ["$E = mc^2$ and $$\\sum_{i=1}^{n} i$$", "<span class=\"math-inline\"><code>E = mc^2</code></span> and<div class=\"math-display\"><code>\\sum_{i=1}^{n} i</code></div>", []],
        ["$unterminated", "<span class=\"math-inline\"><code>unterminated</code></span>", []],
        ["% This is a comment\nText", "<!-- % This is a comment -->\nText", []],
        ["\\documentclass[12pt]{article}\n\\usepackage{amsmath}\nBody", "Body", []],
        ["\\section{Valid} \\invalidcommand{test}", "<h1>Valid</h1>\n\\invalidcommand{test}", []],
        ["Special <chars> & \"quotes\" 'apos'", "Special &lt;chars&gt; &amp; &quot;quotes&quot; &#39;apos&#39;", []],
        ["a_b^c & d ] [ }", "a_b^c &amp; d ] [ }", []],
        ["\\section", "<h1></h1>", ["expected next token to be LBRACE, got EOF instead"]],
        ["\\section{unclosed", "<h1>unclosed</h1>", []],
        ["\\paragraph{P}\\subparagraph{S}\\subsubsection{SS}", "<h4>P</h4>\n<h5>S</h5>\n<h3>SS</h3>", []],
        ["\\underline{u}\\sout{s}\\textsuperscript{sp}\\textsubscript{sb}\\texttt{tt}", "<u>u</u><s>s</s><sup>sp</sup><sub>sb</sub><code>tt</code>", []],
        ["\\begin{itemize}\n\\item First item\n\\item Second item with \\texttt{code}\n\\end{itemize}", "<ul>\n<li>First item</li>\n<li>Second item with <code>code</code></li>\n</ul>", []],
        ["\n\t\t\\section{Introduction}\n\n\t\tThis document demonstrates the \\textbf{LaTeX to HTML} converter.\n\n\t\t\\subsection{Features}\n\n\t\tThe converter supports:\n\n\t\t\\begin{itemize}\n\t\t\\item Text formatting like \\textit{italic} and \\textbf{bold}\n\t\t\\item Mathematical expressions: $E = mc^2$\n\t\t\\item Code blocks: \\texttt{func main()}\n\t\t\\item Links: \\href{https://golang.org}{Go Language}\n\t\t\\end{itemize}\n\n\t\t\\subsection{Mathematics}\n\n\t\tDisplay math:\n\t\t$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$\n\n\t\tInline math: $\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$\n\t", "<h1>Introduction</h1>\nThis document demonstrates the <strong>LaTeX to HTML</strong> converter.<h2>Features</h2>\nThe converter supports:<ul>\n<li>Text formatting like <em>italic</em> and <strong>bold</strong></li>\n<li>Mathematical expressions: <span class=\"math-inline\"><code>E = mc^2</code></span></li>\n<li>Code blocks: <code>func main()</code></li>\n<li>Links: <a href=\"https://golang.org\">Go Language</a></li>\n</ul>\n<h2>Mathematics</h2>\nDisplay math:<div class=\"math-display\"><code>\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}</code></div>\nInline math: <span class=\"math-inline\"><code>\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}</code></span>", []],
        ["\\begin{itemize}\\item x", "<ul>\n<li>x</li>\n</ul>", []],
        ["\\end{itemize} stray", "\\end{itemize} stray", []],
        ["\\begin x", "x", ["expected next token to be LBRACE, got TEXT instead"]],
        ["\\begin{quote}\\section{In}\\textbf{b}\\end{quote}", "<blockquote>\n<h1>In</h1>\n<strong>b</strong></blockquote>", []],
        ["\\begin{tabular}{l}\\textbf{H} & $x$ \\\\\\end{tabular}", "<table>\n<tr><td>{l}<strong>H</strong></td><td><span class=\"math-inline\"><code>x</code></span></td></tr>\n</table>", []],
        ["{group} [opt]", "{group} [opt]", []],
        ["\\foo\\bar baz", "\\foo\\bar baz", []],
        ["\\textit{nested {braces} here}", "<em>nested {braces} here</em>", []],
        ["\\href{u}", "<a href=\"u\"></a>", ["expected next token to be LBRACE, got EOF instead"]],
        ["\\begin{itemize}\\item a\\end{enumerate}\\item b\\end{itemize}", "<ul>\n<li>a</li>\n<li>b</li>\n</ul>", []],
        ["\u0001ctrl\u007f", "\u0001ctrl\u007f", []],
        ["\r\nwin\r\nlines", "win lines", []],
        ["\\begin{itemize}\\item one\\end{itemize}\n\\section{After}", "<ul>\n<li>one</li>\n</ul>\n<h1>After</h1>", []],
    ];

    it.each(cases)('%j', (input, expectedBody, expectedErrors) => {
        expect(latexToHtmlBodyOnly(input)).toBe(expectedBody);
        expect(parseLatex(input).errors).toEqual(expectedErrors);
    });

    // Intentional deviation: Go re-encodes each non-ASCII byte that starts a
    // token as a Latin-1 rune ("élan" -> "Ã©lan"); the port preserves it.
    it.each([
        ['café élan naïve', 'café élan naïve'],
        ['\\textbf{élan}', '<strong>élan</strong>'],
        ['x 😀 y', 'x 😀 y'],
    ])('non-ASCII %j keeps characters intact', (input, expectedBody) => {
        expect(latexToHtmlBodyOnly(input)).toBe(expectedBody);
    });
});

// Regression tests for https://github.com/wwelden/Keystroke/issues/25.
describe('LaTeX to HTML content loss (#25)', () => {
    it('keeps spaces between words in body text', () => {
        expect(latexToHtmlBodyOnly('Hello world')).toBe('Hello world');
        expect(latexToHtmlBodyOnly('\\textbf{a} b c')).toBe('<strong>a</strong> b c');
        expect(latexToHtmlBodyOnly('one\ntwo')).toBe('one two');
    });

    it('keeps whitespace just inside an argument\'s braces', () => {
        expect(latexToHtmlBodyOnly('\\textbf{one }two')).toBe('<strong>one</strong> two');
        expect(latexToHtmlBodyOnly('one\\textbf{ two}')).toBe('one <strong>two</strong>');
        expect(latexToHtmlBodyOnly('a\\textit{ b }c')).toBe('a <em>b</em> c');
        expect(latexToHtmlBodyOnly('\\href{u}{ link }x')).toBe('<a href="u">link</a> x');
        expect(latexToHtmlBodyOnly('\\section{ Title } x')).toBe('<h1>Title</h1>\nx');
    });

    it('escapes the lstlisting language in the class attribute', () => {
        expect(latexToHtmlBodyOnly('\\begin{lstlisting}[language="><script>x]\ny\n\\end{lstlisting}'))
            .toBe('<pre><code class="language-&quot;&gt;&lt;script&gt;x">y</code></pre>');
    });

    it('uses the lstlisting language when written with spaces around =', () => {
        expect(latexToHtmlBodyOnly('\\begin{lstlisting}[language = go]\nx\n\\end{lstlisting}'))
            .toBe('<pre><code class="language-go">x</code></pre>');
    });

    it('does not add spaces where the source had none', () => {
        expect(latexToHtmlBodyOnly('\\textbf{a}b')).toBe('<strong>a</strong>b');
        expect(latexToHtmlBodyOnly('  padded  ')).toBe('padded');
    });

    it('keeps the argument of a command with options', () => {
        const { document, errors } = parseLatex('\\textbf[opt]{bold} after');
        expect(errors).toEqual([]);
        expect(latexToHtmlBodyOnly('\\textbf[opt]{bold} after')).toBe('<strong>bold</strong> after');
        expect(document.children).toHaveLength(3);
    });

    it('keeps lstlisting content after options', () => {
        expect(latexToHtmlBodyOnly('\\begin{lstlisting}[language=go]\nfmt.Println(x)\n\\end{lstlisting}'))
            .toBe('<pre><code class="language-go">fmt.Println(x)</code></pre>');
    });

    it('renders lstlisting verbatim, escaped, with line breaks and indentation', () => {
        const input = '\\begin{lstlisting}[language=go]\nif x < 1 {\n    return $a & b$ % not a comment\n}\n\\end{lstlisting} after';
        expect(latexToHtmlBodyOnly(input)).toBe(
            '<pre><code class="language-go">if x &lt; 1 {\n    return $a &amp; b$ % not a comment\n}</code></pre>\nafter',
        );
    });

    it('renders every \\item inside its own <li>', () => {
        expect(latexToHtmlBodyOnly('\\begin{itemize}\n\\item One two\n\\item Three\n\\end{itemize}'))
            .toBe('<ul>\n<li>One two</li>\n<li>Three</li>\n</ul>');
        expect(latexToHtmlBodyOnly('\\begin{enumerate}\\item a\\item b\\item c\\end{enumerate}'))
            .toBe('<ol>\n<li>a</li>\n<li>b</li>\n<li>c</li>\n</ol>');
    });

    it('closes a list before content that follows it', () => {
        expect(latexToHtmlBodyOnly('\\begin{itemize}\\item one\\end{itemize}\n\\section{After}'))
            .toBe('<ul>\n<li>one</li>\n</ul>\n<h1>After</h1>');
    });

    it('does not emit an empty row after a final \\\\ and newline', () => {
        expect(latexToHtmlBodyOnly('\\begin{tabular}{c}\na \\\\\nb \\\\\n\\end{tabular}'))
            .toBe('<table>\n<tr><td>{c} a</td></tr>\n<tr><td>b</td></tr>\n</table>');
    });

    it('keeps spaces inside optional arguments', () => {
        const { document } = parseLatex('\\begin{lstlisting}[language=Python, caption=Hello World]\nx\n\\end{lstlisting}');
        expect((document.children[0] as EnvironmentNode).options).toBe('language=Python, caption=Hello World');
    });

    it('keeps the \\end of a table whose last row has no \\\\', () => {
        expect(latexToHtmlBodyOnly('\\begin{tabular}{l}A & B\\end{tabular} x'))
            .toBe('<table>\n<tr><td>{l}A</td><td>B</td></tr>\n</table>\nx');
    });
});

// Issue #35: formatting commands parse their brace content into child nodes,
// so nested commands render instead of appearing as literal text.
describe('nested formatting commands', () => {
    it.each([
        [String.raw`\textbf{bold \textit{inner}}`, '<strong>bold <em>inner</em></strong>'],
        [String.raw`\textit{\textbf{x}}`, '<em><strong>x</strong></em>'],
        [String.raw`\underline{a \sout{b \textsuperscript{c \textsubscript{d}}} e}`, '<u>a <s>b <sup>c <sub>d</sub></sup></s> e</u>'],
        [String.raw`\textbf{see \texttt{code}}`, '<strong>see <code>code</code></strong>'],
        [String.raw`\textbf{a {\textit{b}} c}`, '<strong>a {<em>b</em>} c</strong>'],
        [String.raw`\textbf{go \href{https://x.io/?a=1&b=2}{\textit{here}} now}`, '<strong>go <a href="https://x.io/?a=1&amp;b=2"><em>here</em></a> now</strong>'],
        [String.raw`\href{https://e.com}{A \textbf{B}}`, '<a href="https://e.com">A <strong>B</strong></a>'],
        // Optional argument before the mandatory brace
        [String.raw`\textbf{\textit[opt]{b}}`, '<strong><em>b</em></strong>'],
        [String.raw`\textbf{a \textit[o] {b} c}`, '<strong>a <em>b</em> c</strong>'],
        // Spaces just inside a nested command's braces separate it from its siblings
        [String.raw`\textbf{a\textit{ b }c}`, '<strong>a <em>b</em> c</strong>'],
        [String.raw`\textbf{a \textit{ b } c}`, '<strong>a <em>b</em> c</strong>'],
        [String.raw`\textbf{\textit{x}\textit{ y }\textit{z}}`, '<strong><em>x</em> <em>y</em> <em>z</em></strong>'],
        [String.raw`\textbf{\textit{ b }}`, '<strong><em>b</em></strong>'],
        [String.raw`\textbf{a\href{u}{ t }b}`, '<strong>a <a href="u">t</a> b</strong>'],
    ])('%s', (input, expected) => {
        expect(latexToHtmlBodyOnly(input)).toBe(expected);
        expect(parseLatex(input).errors).toEqual([]);
    });

    it.each([
        // Plain text and whitespace inside the braces
        [String.raw`\textbf{bold text}`, '<strong>bold text</strong>'],
        [String.raw`\textbf{  padded  words  }`, '<strong>padded words</strong>'],
        [String.raw`\textbf{}`, '<strong></strong>'],
        [String.raw`\textbf{<b> & "q"}`, '<strong>&lt;b&gt; &amp; &quot;q&quot;</strong>'],
        ['\\textbf{a\nb}', '<strong>a\nb</strong>'],
        // \texttt content stays literal
        [String.raw`\texttt{\textbf{x}}`, '<code>\\textbf{x}</code>'],
        [String.raw`\textbf{a \texttt{\textit{y}} b}`, '<strong>a <code>\\textit{y}</code> b</strong>'],
        // Unsupported commands, or supported ones without a brace argument, stay literal
        [String.raw`\textbf{a \foo{b} c}`, '<strong>a \\foo{b} c</strong>'],
        [String.raw`\textbf{a \textit b}`, '<strong>a \\textit b</strong>'],
        [String.raw`\textbf{\textit[o]}`, '<strong>\\textit[o]</strong>'],
        [String.raw`\textbf{\textit[o}`, '<strong>\\textit[o</strong>'],
        [String.raw`\textbf{\href[o]{u}{t}}`, '<strong>\\href[o]{u}{t}</strong>'],
        // Spaces outside the inner braces are unchanged
        [String.raw`\textbf{a\textit{b}c}`, '<strong>a<em>b</em>c</strong>'],
        [String.raw`\textbf{$x$}`, '<strong>$x$</strong>'],
    ])('%s keeps text, whitespace and literals', (input, expected) => {
        expect(latexToHtmlBodyOnly(input)).toBe(expected);
    });

    it('keeps the source text in CommandNode.value', () => {
        const doc = parseLatex(String.raw`\textbf{a \textit{b} \href{u}{c}}`).document;
        expect((doc.children[0] as CommandNode).value).toBe(String.raw`a \textit{b} \href{u}{c}`);
        const withOptions = parseLatex(String.raw`\textbf{\textit[o]{b}}`).document;
        expect((withOptions.children[0] as CommandNode).value).toBe(String.raw`\textit[o]{b}`);
    });

    it('stops at an unclosed group without consuming past EOF', () => {
        expect(latexToHtmlBodyOnly(String.raw`\textbf{a \textit{b`)).toBe('<strong>a <em>b</em></strong>');
    });
});


describe('LaTeX link destination schemes', () => {
    it.each(['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,test', 'vbscript:msgbox(1)', 'java\tscript:alert(1)'])('renders an unsafe link as plain content: %s', url => {
        expect(latexToHtmlBodyOnly('\\textbf{\\href{' + url + '}{click}}')).toBe('<strong>click</strong>');
        expect(latexToHtmlBodyOnly('\\href{' + url + '}{click}')).toBe('click');
    });

    it.each(['https://example.com', 'http://example.com', 'mailto:a@example.com', 'tel:123', '/docs', '#section'])('keeps supported link destinations: %s', url => {
        expect(latexToHtmlBodyOnly('\\textbf{\\href{' + url + '}{click}}')).toBe('<strong><a href="' + url + '">click</a></strong>');
    });
});
