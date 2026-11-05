import { Renderer, RenderOptions } from '../../src/html/Renderer';
import {
  DocumentNode,
  HeaderNode,
  ParagraphNode,
  TextNode,
  FormattingNode,
  ListNode,
  ListItemNode,
  LinkNode,
  CodeNode,
  PreNode,
  BlockquoteNode,
  BreakNode,
  HorizontalRuleNode,
  TableNode,
  TableRowNode,
  TableCellNode,
} from '../../src/html/Ast';

function headerWith(level: number, text: string): HeaderNode {
  const header = new HeaderNode(level, '', {});
  header.children = [new TextNode(text)];
  return header;
}

describe('html Renderer', () => {
  const r = new Renderer();

  it('can be constructed', () => {
    expect(new Renderer()).toBeDefined();
  });

  it('renders a TextNode', () => {
    expect(r.render(new TextNode('Hello World'))).toBe('Hello World');
  });

  it.each([
    [1, '\\section{Test}'],
    [2, '\\subsection{Test}'],
    [3, '\\subsubsection{Test}'],
    [4, '\\paragraph{Test}'],
    [5, '\\subparagraph{Test}'],
    [6, '\\subparagraph{Test}'],
  ])('renders a level %d HeaderNode', (level, expected) => {
    expect(r.render(headerWith(level, 'Test'))).toBe(expected);
  });

  it('renders a ParagraphNode', () => {
    const paragraph = new ParagraphNode('', {});
    paragraph.children = [new TextNode('Test paragraph')];
    expect(r.render(paragraph)).toContain('Test paragraph');
  });

  it.each([
    ['strong', '\\textbf{Test}'],
    ['b', '\\textbf{Test}'],
    ['em', '\\textit{Test}'],
    ['i', '\\textit{Test}'],
    ['u', '\\underline{Test}'],
    ['s', '\\sout{Test}'],
    ['sup', '\\textsuperscript{Test}'],
    ['sub', '\\textsubscript{Test}'],
  ])('renders a %s FormattingNode', (formatType, expected) => {
    const formatting = new FormattingNode(formatType, '', {});
    formatting.children = [new TextNode('Test')];
    expect(r.render(formatting)).toBe(expected);
  });

  it('renders a ListNode', () => {
    const ul = new ListNode(false, {});
    const item1 = new ListItemNode('', {});
    item1.children = [new TextNode('Item 1')];
    ul.children = [item1];

    let result = r.render(ul);
    expect(result).toContain('\\begin{itemize}');
    expect(result).toContain('\\item Item 1');
    expect(result).toContain('\\end{itemize}');

    const ol = new ListNode(true, {});
    const item2 = new ListItemNode('', {});
    item2.children = [new TextNode('Item 2')];
    ol.children = [item2];

    result = r.render(ol);
    expect(result).toContain('\\begin{enumerate}');
    expect(result).toContain('\\end{enumerate}');
  });

  it('renders a LinkNode', () => {
    const link = new LinkNode('https://example.com', 'Example', {});
    link.children = [new TextNode('Example Link')];
    expect(r.render(link)).toBe('\\href{https://example.com}{Example Link}');
  });

  it('renders a CodeNode', () => {
    const code = new CodeNode('', '', {});
    code.children = [new TextNode('test code')];
    expect(r.render(code)).toBe('\\texttt{test code}');
  });

  it('renders a PreNode', () => {
    const pre = new PreNode('', 'go', {});
    pre.children = [new TextNode('func main() {}')];

    const result = r.render(pre);
    expect(result).toContain('\\begin{lstlisting}[language=go]');
    expect(result).toContain('func main() \\{\\}');
    expect(result).toContain('\\end{lstlisting}');
  });

  it('renders a BlockquoteNode', () => {
    const blockquote = new BlockquoteNode('', {});
    blockquote.children = [new TextNode('This is a quote')];

    const result = r.render(blockquote);
    expect(result).toContain('\\begin{quote}');
    expect(result).toContain('This is a quote');
    expect(result).toContain('\\end{quote}');
  });

  it('renders a BreakNode', () => {
    expect(r.render(new BreakNode())).toBe('\\\\\n');
  });

  it('renders a HorizontalRuleNode', () => {
    expect(r.render(new HorizontalRuleNode({}))).toBe('\\hrule\n');
  });

  it('renders a TableNode', () => {
    const table = new TableNode({});
    const row = new TableRowNode({});
    const cell1 = new TableCellNode('', false, {});
    cell1.children = [new TextNode('Cell 1')];
    const cell2 = new TableCellNode('', false, {});
    cell2.children = [new TextNode('Cell 2')];
    row.cells = [cell1, cell2];
    table.rows = [row];

    const result = r.render(table);
    expect(result).toContain('\\begin{tabular}{ll}');
    expect(result).toContain('Cell 1 & Cell 2');
    expect(result).toContain('\\end{tabular}');
  });

  it('renders null/undefined as an empty string', () => {
    expect(r.render(null)).toBe('');
    expect(r.render(undefined)).toBe('');
  });

  it('renderToString delegates to render', () => {
    expect(r.renderToString(new TextNode('Test'))).toBe('Test');
  });

  it('renders a full document', () => {
    const doc = new DocumentNode([headerWith(1, 'Title'), new TextNode('Content')]);
    const result = r.renderDocument(doc);

    for (const part of [
      '\\documentclass{article}',
      '\\usepackage[utf8]{inputenc}',
      '\\usepackage{ulem}',
      '\\usepackage{hyperref}',
      '\\usepackage{listings}',
      '\\usepackage{booktabs}',
      '\\usepackage{array}',
      '\\usepackage{graphicx}',
      '\\begin{document}',
      '\\section{Title}',
      'Content',
      '\\end{document}',
    ]) {
      expect(result).toContain(part);
    }
  });

  it('renderDocument(null) is empty', () => {
    expect(r.renderDocument(null)).toBe('');
  });

  it('renders with a custom preamble', () => {
    const doc = new DocumentNode([new TextNode('Content')]);
    const result = r.renderWithCustomPreamble(doc, '\\documentclass{report}\n\\usepackage{custom}');

    expect(result).toContain('\\documentclass{report}');
    expect(result).toContain('\\usepackage{custom}');
    expect(result).toContain('\\begin{document}');
    expect(result).toContain('Content');
  });

  it('falls back to the default preamble when the custom one is empty', () => {
    const doc = new DocumentNode([new TextNode('Content')]);
    const result = r.renderWithCustomPreamble(doc, '');

    expect(result).toContain('\\documentclass{article}');
    expect(result).toContain('\\usepackage[utf8]{inputenc}');
  });

  it('renders the body only', () => {
    const doc = new DocumentNode([headerWith(1, 'Title'), new TextNode('Content')]);
    const result = r.renderBodyOnly(doc);

    expect(result).not.toContain('\\documentclass');
    expect(result).not.toContain('\\usepackage');
    expect(result).not.toContain('\\begin{document}');
    expect(result).toContain('\\section{Title}');
    expect(result).toContain('Content');
  });

  it('renderBodyOnly(null) is empty', () => {
    expect(r.renderBodyOnly(null)).toBe('');
  });

  it('renders with options', () => {
    const doc = new DocumentNode([new TextNode('Content')]);
    const result = r.renderWithOptions(doc, {
      includeDocumentClass: true,
      includePackages: true,
      documentClass: 'report',
      customPackages: ['amsmath', 'amssymb'],
    });

    expect(result).toContain('\\documentclass{report}');
    expect(result).toContain('\\usepackage{amsmath}');
    expect(result).toContain('\\usepackage{amssymb}');
    expect(result).toContain('\\begin{document}');
    expect(result).toContain('\\end{document}');
  });

  it('defaults the document class to article', () => {
    const doc = new DocumentNode([new TextNode('Content')]);
    const result = r.renderWithOptions(doc, { includeDocumentClass: true, documentClass: '' });
    expect(result).toContain('\\documentclass{article}');
  });

  it('omits the preamble when options disable it', () => {
    const doc = new DocumentNode([new TextNode('Content')]);
    const result = r.renderWithOptions(doc, { includeDocumentClass: false, includePackages: false });

    expect(result).not.toContain('\\documentclass');
    expect(result).not.toContain('\\usepackage');
    expect(result).not.toContain('\\begin{document}');
  });

  it('renderWithOptions(null) is empty', () => {
    expect(r.renderWithOptions(null, {})).toBe('');
  });

  it.each([
    ['Hello\n\n\nWorld', 'Hello\n\nWorld'],
    ['  \n  Text  \n  ', 'Text'],
    ['Normal text', 'Normal text'],
    ['', ''],
    ['\n\n\n', ''],
  ])('cleanOutput(%j) is %j', (input, expected) => {
    expect(r.cleanOutput(input)).toBe(expected);
  });

  it('RenderOptions has the expected fields', () => {
    const options: RenderOptions = {
      includeDocumentClass: true,
      includePackages: true,
      customPackages: ['test'],
      documentClass: 'article',
    };

    expect(options.includeDocumentClass).toBe(true);
    expect(options.includePackages).toBe(true);
    expect(options.customPackages).toHaveLength(1);
    expect(options.documentClass).toBe('article');
  });

  it('renders a complex document', () => {
    const header = headerWith(1, 'Introduction');

    const paragraph = new ParagraphNode('', {});
    const boldText = new FormattingNode('strong', '', {});
    boldText.children = [new TextNode('important')];
    paragraph.children = [new TextNode('This is '), boldText, new TextNode(' text.')];

    const list = new ListNode(false, {});
    const item1 = new ListItemNode('', {});
    item1.children = [new TextNode('First item')];
    list.children = [item1];

    const result = r.renderDocument(new DocumentNode([header, paragraph, list]));

    expect(result).toContain('\\section{Introduction}');
    expect(result).toContain('\\textbf{important}');
    expect(result).toContain('\\begin{itemize}');
    expect(result).toContain('\\item First item');
  });
});
