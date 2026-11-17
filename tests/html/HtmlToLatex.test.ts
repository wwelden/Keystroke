import {
  htmlToLatex,
  htmlToLatexBodyOnly,
  htmlToLatexWithOptions,
  parseHtml,
  Converter,
  DocumentNode,
  h1ToSection,
  h2ToSubsection,
  h3ToSubsubsection,
  boldToTextbf,
  italicToTextit,
  codeToTexttt,
  linkToHref,
} from '../../src/html';

describe('htmlToLatex', () => {
  it('converts a header', () => {
    expect(htmlToLatexBodyOnly('<h1>Test Title</h1>')).toContain('\\section{');
  });

  it('converts a paragraph', () => {
    const result = htmlToLatexBodyOnly('<p>This is a test paragraph.</p>');
    expect(result).toContain('This');
    expect(result).toContain('test');
    expect(result).toContain('paragraph');
  });

  it('converts bold text', () => {
    expect(htmlToLatexBodyOnly('<strong>Bold text</strong>')).toContain('\\textbf{');
  });

  it('converts italic text', () => {
    expect(htmlToLatexBodyOnly('<em>Italic text</em>')).toContain('\\textit{');
  });

  it('converts inline code', () => {
    expect(htmlToLatexBodyOnly('<code>code snippet</code>')).toContain('\\texttt{');
  });

  it('converts a link', () => {
    expect(htmlToLatexBodyOnly('<a href="https://example.com">Link text</a>')).toContain('\\href{');
    expect(htmlToLatexBodyOnly("<a href='https://example.com'>Link</a>")).toContain('\\href{https://example.com}{Link}');
  });

  it.each(["don't edit", 'a 5" screen'])('ends a comment with a quote at the first > (%s)', comment => {
    expect(htmlToLatexBodyOnly(`<!-- ${comment} --><h1>Title</h1>`)).toContain('\\section{Title}');
  });

  it.each(["'", '"'])('keeps a link after a quoted > attribute (%s)', quote => {
    expect(htmlToLatexBodyOnly(`<a title=${quote}1 > 0${quote} href=${quote}https://example.com${quote}>Link</a>`))
      .toBe('\\href{https://example.com}{Link}');
  });

  it('converts a list', () => {
    const result = htmlToLatexBodyOnly('<ul><li>Item 1</li><li>Item 2</li></ul>');
    expect(result).toContain('\\begin{itemize}');
    expect(result).toContain('\\item');
  });

  it('converts a complex document', () => {
    const result = htmlToLatex(`
		<h1>Title</h1>
		<p>This is a <strong>bold</strong> and <em>italic</em> text.</p>
		<ul>
			<li>First item</li>
			<li>Second item</li>
		</ul>
		<p>Visit <a href="https://example.com">our site</a>.</p>
	`);

    expect(result).toContain('\\documentclass{');
    expect(result).toContain('\\begin{document}');
    expect(result).toContain('\\end{document}');
    expect(result).toContain('\\section{');
    expect(result).toContain('\\textbf{');
    expect(result).toContain('\\textit{');
  });

  it('uses render options when they are passed', () => {
    const input = '<h1>Title</h1>';
    const options = { includeDocumentClass: true, documentClass: 'report' };
    expect(htmlToLatex(input, options)).toBe(htmlToLatexWithOptions(input, options));
    expect(htmlToLatex(input, options)).toContain('\\documentclass{report}');
  });

  it.each([
    [h1ToSection, 'Test', '\\section{Test}'],
    [h2ToSubsection, 'Test', '\\subsection{Test}'],
    [h3ToSubsubsection, 'Test', '\\subsubsection{Test}'],
    [boldToTextbf, 'Bold', '\\textbf{Bold}'],
    [italicToTextit, 'Italic', '\\textit{Italic}'],
    [codeToTexttt, 'code', '\\texttt{code}'],
  ])('quick conversion %#', (fn, input, expected) => {
    expect(fn(input)).toBe(expected);
  });

  it('linkToHref', () => {
    expect(linkToHref('https://example.com', 'Example')).toBe('\\href{https://example.com}{Example}');
  });

  it('Converter converts body only', () => {
    const converter = new Converter();
    const result = converter.convertBodyOnly('<h1>Test</h1><p>Content</p>');
    expect(result).toContain('\\section{');
    expect(result).toContain('Content');
  });

  it('Converter round-trips through the AST', () => {
    const converter = new Converter();
    const input = '<h1>Test</h1><p>Content</p>';
    expect(converter.renderAST(converter.convertToAST(input))).toBe(converter.convert(input));
  });

  it('parseHtml returns a document even for malformed input', () => {
    const { document, errors } = parseHtml('<h1>Unclosed tag');
    expect(document).toBeInstanceOf(DocumentNode);
    expect(Array.isArray(errors)).toBe(true);
  });
});

// Regression tests for #24: conversion used to drop spaces, sibling elements and
// words after inline tags.
describe('htmlToLatexBodyOnly preserves content', () => {
  it.each([
    ['<p>Hello world</p>', 'Hello world'],
    ['<p>a <b>b</b> c d</p>', 'a \\textbf{b} c d'],
    ['<ul><li>A</li><li>B</li><li>C</li></ul>', '\\begin{itemize}\n\\item A\n\\item B\n\\item C\n\\end{itemize}'],
    [
      '<table><tr><td>1</td><td>2</td></tr><tr><td>3</td><td>4</td></tr></table>',
      '\\begin{tabular}{ll}\n\\toprule\n1 & 2 \\\\\n\\midrule\n3 & 4 \\\\\n\\bottomrule\n\\end{tabular}',
    ],
    ['<p>one\n   two\tthree</p>', 'one two three'],
    ['<p>a <span>b</span> c</p>', 'a b c'],
    ['<p>x<!-- note -->y</p>', 'xy'],
    ['<p>x<!-- a > b -->y</p>', 'xy'],
    ['<p>1 < 2 and more</p><p>next</p>', '1 < 2 and more\n\n\nnext'],
    ['<p>a&nbsp;b</p>', 'a\u00A0b'],
    ['<p>AT&T rocks</p>', 'AT\\&T rocks'],
    ['<p>AT&T &amp; B</p>', 'AT\\&T \\& B'],
    ['<p>&&amp;</p>', '\\&\\&'],
    ['<p>&lt;/p&gt; after</p>', '</p> after'],
  ])('%j -> %j', (input, expected) => {
    expect(htmlToLatexBodyOnly(input)).toBe(expected);
  });

  it('keeps whitespace inside <pre>', () => {
    expect(htmlToLatexBodyOnly('<pre>a\n  b</pre>')).toBe('\\begin{lstlisting}\na\n  b\n\\end{lstlisting}');
  });

  it('keeps escaped closing-tag text inside <pre>', () => {
    expect(htmlToLatexBodyOnly('<pre>&lt;/div&gt;\nnext line</pre>')).toBe(
      '\\begin{lstlisting}\n</div>\nnext line\n\\end{lstlisting}',
    );
  });

  it('renders a caption and stray table text above the tabular', () => {
    expect(htmlToLatexBodyOnly('<table><caption>Report</caption><tr><td>A</td></tr><tr>loose<td>B</td></tr></table>')).toBe(
      'Report\nloose\n\\begin{tabular}{l}\n\\toprule\nA \\\\\n\\midrule\nB \\\\\n\\bottomrule\n\\end{tabular}',
    );
  });

  it('keeps nested lists and the items after them', () => {
    expect(htmlToLatexBodyOnly('<ul><li>A<ul><li>a1</li><li>a2</li></ul></li><li>B</li></ul>')).toBe(
      '\\begin{itemize}\n\\item A\\begin{itemize}\n\\item a1\n\\item a2\n\\end{itemize}\n\n\\item B\n\\end{itemize}',
    );
  });

  it('reads rows through <thead> and <tbody>', () => {
    expect(
      htmlToLatexBodyOnly('<table><thead><tr><th>H</th><th>I</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>'),
    ).toBe('\\begin{tabular}{ll}\n\\toprule\n\\textbf{H} & \\textbf{I} \\\\\n\\midrule\n1 & 2 \\\\\n\\bottomrule\n\\end{tabular}');
  });

  it('sizes the tabular to its widest row', () => {
    expect(htmlToLatexBodyOnly('<table><tr><td>1</td></tr><tr><td>2</td><td>3</td></tr></table>')).toContain(
      '\\begin{tabular}{ll}',
    );
  });

  it('leaves a mismatched closing tag for the enclosing element', () => {
    expect(htmlToLatexBodyOnly('<ul><li>a<b>b</li><li>c</li></ul>')).toBe(
      '\\begin{itemize}\n\\item a\\textbf{b}\n\\item c\n\\end{itemize}',
    );
  });
});

describe('htmlToLatexBodyOnly with malformed HTML', () => {
  it('skips a stray closing tag instead of closing the enclosing elements', () => {
    expect(htmlToLatexBodyOnly('<ul><li>a</b> b</li><li>c</li></ul>')).toBe(
      '\\begin{itemize}\n\\item a b\n\\item c\n\\end{itemize}',
    );
  });

  it('puts content outside <li> into a list item', () => {
    expect(htmlToLatexBodyOnly('<ul>stray<li>a</li></ul>')).toBe(
      '\\begin{itemize}\n\\item stray\n\\item a\n\\end{itemize}',
    );
  });
});
