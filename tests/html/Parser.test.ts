import { Lexer } from '../../src/html/Lexer';
import { Parser } from '../../src/html/Parser';
import { Token, TokenType } from '../../src/html/Token';
import {
  Node,
  HeaderNode,
  ParagraphNode,
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
  TextNode,
} from '../../src/html/Ast';

function parse(input: string) {
  const p = new Parser(new Lexer(input));
  return { p, doc: p.parseDocument() };
}

function find<T>(nodes: Node[], ctor: abstract new (...args: never[]) => T): T | undefined {
  return nodes.find(n => n instanceof ctor) as T | undefined;
}

describe('html Parser', () => {
  it('is constructed with a lexer and no errors', () => {
    const p = new Parser(new Lexer('<h1>Test</h1>'));
    expect(p['lexer']).toBeDefined();
    expect(p['errors']).toHaveLength(0);
  });

  it('parses an empty document', () => {
    const { doc } = parse('');
    expect(doc).toBeDefined();
    expect(doc.children).toHaveLength(0);
  });

  it('parses a simple header', () => {
    const { doc } = parse('<h1>Title</h1>');
    expect(doc.children).toHaveLength(1);
    const header = doc.children[0];
    expect(header).toBeInstanceOf(HeaderNode);
    expect((header as HeaderNode).level).toBe(1);
  });

  it('parses multiple top-level tags', () => {
    const { doc } = parse('<h1>Title</h1><p>Content</p>');
    expect(doc.children.length).toBeGreaterThanOrEqual(2);
    expect(find(doc.children, HeaderNode)).toBeDefined();
    expect(find(doc.children, ParagraphNode)).toBeDefined();
  });

  it.each([
    ['<h1>Title</h1>', 1],
    ['<h2>Title</h2>', 2],
    ['<h3>Title</h3>', 3],
    ['<h4>Title</h4>', 4],
    ['<h5>Title</h5>', 5],
    ['<h6>Title</h6>', 6],
  ])('parses header %s as level %d', (input, level) => {
    const { doc } = parse(input);
    expect(doc.children).toHaveLength(1);
    expect(doc.children[0]).toBeInstanceOf(HeaderNode);
    expect((doc.children[0] as HeaderNode).level).toBe(level);
  });

  it('parses a paragraph', () => {
    const { doc } = parse('<p>Test paragraph</p>');
    expect(doc.children).toHaveLength(1);
    expect(doc.children[0]).toBeInstanceOf(ParagraphNode);
    expect((doc.children[0] as ParagraphNode).type).toBe(TokenType.P);
  });

  it.each([
    ['<strong>Bold</strong>', 'strong'],
    ['<b>Bold</b>', 'strong'],
    ['<em>Italic</em>', 'em'],
    ['<i>Italic</i>', 'em'],
    ['<u>Underline</u>', 'u'],
    ['<s>Strike</s>', 's'],
    ['<sup>Super</sup>', 'sup'],
    ['<sub>Sub</sub>', 'sub'],
  ])('parses formatting %s as %s', (input, formatType) => {
    const { doc } = parse(input);
    expect(doc.children).toHaveLength(1);
    expect(doc.children[0]).toBeInstanceOf(FormattingNode);
    expect((doc.children[0] as FormattingNode).formatType).toBe(formatType);
  });

  it('parses an unordered list', () => {
    const { doc } = parse('<ul><li>Item 1</li><li>Item 2</li></ul>');
    const list = find(doc.children, ListNode);
    expect(list).toBeDefined();
    expect(list!.ordered).toBe(false);
    expect(list!.type).toBe(TokenType.UL);
  });

  it('parses an ordered list', () => {
    const { doc } = parse('<ol><li>Item 1</li><li>Item 2</li></ol>');
    const list = find(doc.children, ListNode);
    expect(list).toBeDefined();
    expect(list!.ordered).toBe(true);
    expect(list!.type).toBe(TokenType.OL);
  });

  it('parses a list item', () => {
    const { doc } = parse('<ul><li>Test item</li></ul>');
    const list = doc.children[0] as ListNode;
    expect(list).toBeInstanceOf(ListNode);
    expect(list.children).toHaveLength(1);
    expect(list.children[0]).toBeInstanceOf(ListItemNode);
    expect((list.children[0] as ListItemNode).type).toBe(TokenType.LI);
    expect(list.items).toHaveLength(1);
  });

  it('parses a link with href', () => {
    const { doc } = parse('<a href="https://example.com">Link text</a>');
    expect(doc.children).toHaveLength(1);
    const link = doc.children[0] as LinkNode;
    expect(link).toBeInstanceOf(LinkNode);
    expect(link.type).toBe(TokenType.A);
    expect(link.url).toBe('https://example.com');
  });

  it('parses inline code', () => {
    const { doc } = parse('<code>test code</code>');
    expect(doc.children).toHaveLength(1);
    expect(doc.children[0]).toBeInstanceOf(CodeNode);
    expect((doc.children[0] as CodeNode).type).toBe(TokenType.CODE);
  });

  it('parses preformatted text', () => {
    const { doc } = parse('<pre>code block</pre>');
    expect(doc.children).toHaveLength(1);
    expect(doc.children[0]).toBeInstanceOf(PreNode);
    expect((doc.children[0] as PreNode).type).toBe(TokenType.PRE);
  });

  it('extracts the language of preformatted text from its class', () => {
    const { doc } = parse('<pre class="language-go">func main() {}</pre>');
    expect(doc.children[0]).toBeInstanceOf(PreNode);
    expect((doc.children[0] as PreNode).language).toBe('go');
  });

  it('parses a blockquote', () => {
    const { doc } = parse('<blockquote>This is a quote</blockquote>');
    expect(doc.children).toHaveLength(1);
    expect(doc.children[0]).toBeInstanceOf(BlockquoteNode);
    expect((doc.children[0] as BlockquoteNode).type).toBe(TokenType.BLOCKQUOTE);
  });

  it('parses a line break', () => {
    const { doc } = parse('<br>');
    expect(doc.children).toHaveLength(1);
    expect(doc.children[0]).toBeInstanceOf(BreakNode);
    expect((doc.children[0] as BreakNode).type).toBe(TokenType.BR);
  });

  it('parses a horizontal rule', () => {
    const { doc } = parse('<hr>');
    expect(doc.children).toHaveLength(1);
    expect(doc.children[0]).toBeInstanceOf(HorizontalRuleNode);
    expect((doc.children[0] as HorizontalRuleNode).type).toBe(TokenType.HR);
  });

  it('parses a table', () => {
    const { doc } = parse(`<table>
		<tr>
			<th>Header 1</th>
			<th>Header 2</th>
		</tr>
		<tr>
			<td>Cell 1</td>
			<td>Cell 2</td>
		</tr>
	</table>`);
    const table = find(doc.children, TableNode);
    expect(table).toBeDefined();
    expect(table!.type).toBe(TokenType.TABLE);
  });

  it('parses a table row', () => {
    const { doc } = parse('<table><tr><td>Cell</td></tr></table>');
    const table = doc.children[0] as TableNode;
    expect(table).toBeInstanceOf(TableNode);
    expect(table.children).toHaveLength(1);
    expect(table.children[0]).toBeInstanceOf(TableRowNode);
    expect((table.children[0] as TableRowNode).type).toBe(TokenType.TR);
  });

  it('parses a table cell', () => {
    const { doc } = parse('<table><tr><td>Regular</td></tr></table>');
    const table = find(doc.children, TableNode);
    expect(table).toBeDefined();
    const row = find(table!.children, TableRowNode);
    expect(row).toBeDefined();
    expect(row!.children.length).toBeGreaterThan(0);

    const cells = row!.children.filter((c): c is TableCellNode => c instanceof TableCellNode);
    expect(cells.length).toBeGreaterThan(0);
    for (const cell of cells) {
      expect(cell.type).toBe(TokenType.TD);
    }
  });

  it('parses plain text', () => {
    const { doc } = parse('Plain text');
    const textNode = find(doc.children, TextNode);
    expect(textNode).toBeDefined();
    expect(textNode!.type).toBe(TokenType.TEXT);
    expect(textNode!.text).toContain('Plain');
  });

  it('parses nested elements', () => {
    const { doc } = parse('<p>This is <strong>bold</strong> text</p>');
    const paragraph = doc.children[0] as ParagraphNode;
    expect(paragraph).toBeInstanceOf(ParagraphNode);
    expect(paragraph.children.length).toBeGreaterThanOrEqual(2);
  });

  it.each([
    [TokenType.H1, 1],
    [TokenType.H2, 2],
    [TokenType.H3, 3],
    [TokenType.H4, 4],
    [TokenType.H5, 5],
    [TokenType.H6, 6],
    [TokenType.P, 1], // default
  ])('getHeaderLevel(%s) is %d', (type, expected) => {
    const p = new Parser(new Lexer(''));
    expect(p['getHeaderLevel'](type)).toBe(expected);
  });

  it('extracts attributes from the current tag literal', () => {
    const p = new Parser(new Lexer(''));
    p['curToken'] = new Token(TokenType.A, '<a href="https://example.com" class="link">');

    expect(p['extractAttribute']('href')).toBe('https://example.com');
    expect(p['extractAttribute']('class')).toBe('link');
    expect(p['extractAttribute']('id')).toBe('');
  });

  it.each([
    ['language-go', 'go'],
    ['language-python', 'python'],
    ['language-javascript', 'javascript'],
    ['other-class', ''],
    ['', ''],
  ])('extractLanguageFromClass(%j) is %j', (cls, expected) => {
    const p = new Parser(new Lexer(''));
    p['curToken'] = new Token(TokenType.PRE, `<pre class="${cls}">`);
    expect(p['extractLanguageFromClass']()).toBe(expected);
  });

  it.each([
    ['</h1>', true],
    ['</p>', true],
    ['<h1>', false],
    ['<p>', false],
    ['text', false],
  ])('isClosingTag(%j) is %s', (literal, expected) => {
    const p = new Parser(new Lexer(''));
    p['curToken'] = new Token(TokenType.TEXT, literal);
    expect(p['isClosingTag']()).toBe(expected);
  });

  it('curTokenIs checks the current token type', () => {
    const p = new Parser(new Lexer(''));
    p['curToken'] = new Token(TokenType.H1, '');
    expect(p['curTokenIs'](TokenType.H1)).toBe(true);
    expect(p['curTokenIs'](TokenType.P)).toBe(false);
  });

  it('peekTokenIs checks the peek token type', () => {
    const p = new Parser(new Lexer(''));
    p['peekToken'] = new Token(TokenType.P, '');
    expect(p['peekTokenIs'](TokenType.P)).toBe(true);
    expect(p['peekTokenIs'](TokenType.H1)).toBe(false);
  });

  it('records peek errors', () => {
    const p = new Parser(new Lexer(''));
    expect(p.getErrors()).toHaveLength(0);

    p['peekError'](TokenType.H1);

    const errors = p.getErrors();
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('expected next token to be');
  });

  it('parses complex HTML without errors', () => {
    const { p, doc } = parse(`
		<div>
			<h1>Main Title</h1>
			<p>This paragraph has <strong>bold</strong> and <em>italic</em> text.</p>
			<ul>
				<li>First item</li>
				<li>Second item with <a href="http://example.com">a link</a></li>
			</ul>
			<blockquote>
				<p>This is a quote with <code>inline code</code>.</p>
			</blockquote>
		</div>
	`);
    expect(p.getErrors()).toHaveLength(0);
    expect(doc.children.length).toBeGreaterThan(0);
  });
});
