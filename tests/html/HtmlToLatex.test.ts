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
