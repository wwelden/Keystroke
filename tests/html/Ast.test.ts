import {
  HTMLNode,
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
  TableNode,
  TableRowNode,
  TableCellNode,
  BreakNode,
  HorizontalRuleNode,
} from '../../src/html/Ast';
import { TokenType } from '../../src/html/Token';

describe('html AST', () => {
  describe('DocumentNode', () => {
    it('is constructed with DOCUMENT type and children', () => {
      const doc = new DocumentNode([new TextNode('Test')]);
      expect(doc.type).toBe(TokenType.DOCUMENT);
      expect(doc.children).toHaveLength(1);
    });

    it('renders a full LaTeX document', () => {
      const doc = new DocumentNode([new HeaderNode(1, 'Title', {}), new TextNode('Content')]);
      const result = doc.renderLaTeX();

      for (const part of [
        '\\documentclass{article}',
        '\\usepackage[utf8]{inputenc}',
        '\\usepackage{ulem}',
        '\\usepackage{hyperref}',
        '\\usepackage{listings}',
        '\\usepackage{booktabs}',
        '\\usepackage{array}',
        '\\begin{document}',
        '\\end{document}',
      ]) {
        expect(result).toContain(part);
      }
    });
  });

  describe('HeaderNode', () => {
    it.each([
      [1, TokenType.H1],
      [2, TokenType.H2],
      [3, TokenType.H3],
      [4, TokenType.H4],
      [5, TokenType.H5],
      [6, TokenType.H6],
    ])('level %d has type %s', (level, expected) => {
      const header = new HeaderNode(level, 'Test', {});
      expect(header.type).toBe(expected);
      expect(header.level).toBe(level);
    });

    it.each([
      [1, '\\section{'],
      [2, '\\subsection{'],
      [3, '\\subsubsection{'],
      [4, '\\paragraph{'],
      [5, '\\subparagraph{'],
      [6, '\\subparagraph{'],
    ])('level %d renders %s', (level, expected) => {
      const header = new HeaderNode(level, 'Test', {});
      header.children = [new TextNode('Test Title')];
      expect(header.renderLaTeX()).toContain(expected);
    });
  });

  describe('ParagraphNode', () => {
    it('has P type and tag name', () => {
      const paragraph = new ParagraphNode('Test content', {});
      expect(paragraph.type).toBe(TokenType.P);
      expect(paragraph.tagName).toBe('p');
    });

    it('renders children and omits empty paragraphs', () => {
      const paragraph = new ParagraphNode('', {});
      paragraph.children = [new TextNode('Test content')];
      expect(paragraph.renderLaTeX()).toContain('Test content');

      expect(new ParagraphNode('', {}).renderLaTeX()).toBe('');
    });
  });

  describe('TextNode', () => {
    it('stores its text', () => {
      const text = new TextNode('Hello World');
      expect(text.type).toBe(TokenType.TEXT);
      expect(text.text).toBe('Hello World');
    });

    it.each([
      ['Hello World', 'Hello World'],
      ['Text with & ampersand', 'Text with \\& ampersand'],
      ['Text with $ dollar', 'Text with \\$ dollar'],
      ['Text with % percent', 'Text with \\% percent'],
      ['Text with # hash', 'Text with \\# hash'],
      ['Text with ^ caret', 'Text with \\textasciicircum  caret'],
      ['Text with _ underscore', 'Text with \\_ underscore'],
      ['Text with ~ tilde', 'Text with \\textasciitilde  tilde'],
      ['Text with { brace', 'Text with \\{ brace'],
      ['Text with } brace', 'Text with \\} brace'],
      ['Text with \\ backslash', 'Text with \\textbackslash  backslash'],
    ])('escapes %j', (input, expected) => {
      expect(new TextNode(input).renderLaTeX()).toBe(expected);
    });
  });

  describe('FormattingNode', () => {
    it.each([
      ['strong', TokenType.STRONG],
      ['b', TokenType.STRONG],
      ['em', TokenType.EM],
      ['i', TokenType.EM],
      ['u', TokenType.U],
      ['s', TokenType.S],
      ['sup', TokenType.SUP],
      ['sub', TokenType.SUB],
      ['unknown', TokenType.SPAN],
    ])('format %s has type %s', (formatType, expected) => {
      const formatting = new FormattingNode(formatType, '', {});
      expect(formatting.type).toBe(expected);
      expect(formatting.formatType).toBe(formatType);
    });

    it.each([
      ['strong', '\\textbf{'],
      ['b', '\\textbf{'],
      ['em', '\\textit{'],
      ['i', '\\textit{'],
      ['u', '\\underline{'],
      ['s', '\\sout{'],
      ['sup', '\\textsuperscript{'],
      ['sub', '\\textsubscript{'],
    ])('format %s renders %s', (formatType, expected) => {
      const formatting = new FormattingNode(formatType, '', {});
      formatting.children = [new TextNode('test')];
      expect(formatting.renderLaTeX()).toContain(expected);
    });
  });

  describe('ListNode', () => {
    it('constructs ordered and unordered lists', () => {
      const ul = new ListNode(false, {});
      expect(ul.type).toBe(TokenType.UL);
      expect(ul.ordered).toBe(false);

      const ol = new ListNode(true, {});
      expect(ol.type).toBe(TokenType.OL);
      expect(ol.ordered).toBe(true);
    });

    it('renders itemize and enumerate environments', () => {
      const ul = new ListNode(false, {});
      ul.children = [new ListItemNode('Item 1', {})];
      let result = ul.renderLaTeX();
      expect(result).toContain('\\begin{itemize}');
      expect(result).toContain('\\end{itemize}');

      const ol = new ListNode(true, {});
      ol.children = [new ListItemNode('Item 1', {})];
      result = ol.renderLaTeX();
      expect(result).toContain('\\begin{enumerate}');
      expect(result).toContain('\\end{enumerate}');
    });
  });

  describe('ListItemNode', () => {
    it('has LI type and tag name', () => {
      const item = new ListItemNode('Test item', {});
      expect(item.type).toBe(TokenType.LI);
      expect(item.tagName).toBe('li');
    });

    it('renders as \\item', () => {
      const item = new ListItemNode('', {});
      item.children = [new TextNode('Test item')];
      const result = item.renderLaTeX();
      expect(result.startsWith('\\item ')).toBe(true);
      expect(result).toContain('Test item');
    });
  });

  describe('LinkNode', () => {
    it('stores url and text', () => {
      const link = new LinkNode('https://example.com', 'Example', {});
      expect(link.type).toBe(TokenType.A);
      expect(link.url).toBe('https://example.com');
      expect(link.text).toBe('Example');
    });

    it('renders \\href from children, falling back to text', () => {
      const link = new LinkNode('https://example.com', 'Example', {});
      link.children = [new TextNode('Example Link')];
      expect(link.renderLaTeX()).toBe('\\href{https://example.com}{Example Link}');

      const linkNoChildren = new LinkNode('https://test.com', 'Test', {});
      expect(linkNoChildren.renderLaTeX()).toBe('\\href{https://test.com}{Test}');
    });
  });

  describe('CodeNode', () => {
    it('stores language', () => {
      const code = new CodeNode('test code', 'go', {});
      expect(code.type).toBe(TokenType.CODE);
      expect(code.language).toBe('go');
    });

    it('renders \\texttt', () => {
      const code = new CodeNode('', '', {});
      code.children = [new TextNode('test code')];
      const result = code.renderLaTeX();
      expect(result).toContain('\\texttt{');
      expect(result).toContain('test code');
    });
  });

  describe('PreNode', () => {
    it('stores language', () => {
      const pre = new PreNode('code block', 'python', {});
      expect(pre.type).toBe(TokenType.PRE);
      expect(pre.language).toBe('python');
    });

    it('renders lstlisting with and without language', () => {
      const pre = new PreNode('', 'go', {});
      pre.children = [new TextNode('func main() {}')];
      let result = pre.renderLaTeX();
      expect(result).toContain('\\begin{lstlisting}[language=go]');
      expect(result).toContain('\\end{lstlisting}');

      const preNoLang = new PreNode('', '', {});
      preNoLang.children = [new TextNode('code')];
      result = preNoLang.renderLaTeX();
      expect(result).toContain('\\begin{lstlisting}');
      expect(result).not.toContain('[language=');
    });
  });

  describe('BlockquoteNode', () => {
    it('has BLOCKQUOTE type', () => {
      expect(new BlockquoteNode('Quote text', {}).type).toBe(TokenType.BLOCKQUOTE);
    });

    it('renders a quote environment', () => {
      const blockquote = new BlockquoteNode('', {});
      blockquote.children = [new TextNode('This is a quote')];
      const result = blockquote.renderLaTeX();
      expect(result).toContain('\\begin{quote}');
      expect(result).toContain('\\end{quote}');
      expect(result).toContain('This is a quote');
    });
  });

  describe('BreakNode', () => {
    it('has BR type and tag name', () => {
      const br = new BreakNode();
      expect(br.type).toBe(TokenType.BR);
      expect(br.tagName).toBe('br');
    });

    it('renders a line break', () => {
      expect(new BreakNode().renderLaTeX()).toBe('\\\\\n');
    });
  });

  describe('HorizontalRuleNode', () => {
    it('has HR type', () => {
      expect(new HorizontalRuleNode({}).type).toBe(TokenType.HR);
    });

    it('renders \\hrule', () => {
      expect(new HorizontalRuleNode({}).renderLaTeX()).toBe('\\hrule\n');
    });
  });

  describe('TableNode', () => {
    it('starts with no rows', () => {
      const table = new TableNode({});
      expect(table.type).toBe(TokenType.TABLE);
      expect(table.rows).toHaveLength(0);
    });

    it('renders nothing when empty and a tabular otherwise', () => {
      expect(new TableNode({}).renderLaTeX()).toBe('');

      const table = new TableNode({});
      const row = new TableRowNode({});
      row.cells = [new TableCellNode('', false, {}), new TableCellNode('', false, {})];
      table.rows = [row];

      const result = table.renderLaTeX();
      expect(result).toContain('\\begin{tabular}{ll}');
      expect(result).toContain('\\toprule');
      expect(result).toContain('\\bottomrule');
    });
  });

  describe('TableRowNode', () => {
    it('starts with no cells', () => {
      const row = new TableRowNode({});
      expect(row.type).toBe(TokenType.TR);
      expect(row.cells).toHaveLength(0);
    });

    it('joins cells with &', () => {
      const row = new TableRowNode({});
      const cell1 = new TableCellNode('', false, {});
      cell1.children = [new TextNode('Cell 1')];
      const cell2 = new TableCellNode('', false, {});
      cell2.children = [new TextNode('Cell 2')];
      row.cells = [cell1, cell2];

      const result = row.renderLaTeX();
      expect(result).toContain('Cell 1 & Cell 2');
      expect(result).toContain('\\\\');
    });
  });

  describe('TableCellNode', () => {
    it('distinguishes header and regular cells', () => {
      const td = new TableCellNode('content', false, {});
      expect(td.type).toBe(TokenType.TD);
      expect(td.isHeader).toBe(false);

      const th = new TableCellNode('header', true, {});
      expect(th.type).toBe(TokenType.TH);
      expect(th.isHeader).toBe(true);
    });

    it('renders header cells in bold', () => {
      const td = new TableCellNode('', false, {});
      td.children = [new TextNode('Regular cell')];
      expect(td.renderLaTeX()).toBe('Regular cell');

      const th = new TableCellNode('', true, {});
      th.children = [new TextNode('Header cell')];
      expect(th.renderLaTeX()).toBe('\\textbf{Header cell}');
    });
  });

  describe('HTMLNode', () => {
    it('tokenLiteral returns content', () => {
      expect(new HTMLNode({ content: 'test content' }).tokenLiteral()).toBe('test content');
    });

    it('toString returns content', () => {
      expect(new HTMLNode({ content: 'test string' }).toString()).toBe('test string');
    });

    it('renderChildrenLaTeX concatenates children', () => {
      const node = new HTMLNode({ children: [new TextNode('Hello '), new TextNode('World')] });
      expect(node['renderChildrenLaTeX']()).toBe('Hello World');
    });
  });
});
