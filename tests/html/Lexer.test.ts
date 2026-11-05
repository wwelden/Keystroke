import { Lexer, isLetter, isDigit } from '../../src/html/Lexer';
import { TokenType } from '../../src/html/Token';

describe('html Lexer', () => {
  it('initializes state on construction', () => {
    const input = '<h1>Test</h1>';
    const l = new Lexer(input);

    expect(l['input']).toBe(input);
    expect(l['position']).toBe(0);
    expect(l['readPosition']).toBe(1);
  });

  describe('nextToken', () => {
    it.each([
      ['<h1>', TokenType.H1],
      ['<p>', TokenType.P],
      ['<strong>', TokenType.STRONG],
      ['<em>', TokenType.EM],
    ])('lexes opening tag %s', (input, type) => {
      const l = new Lexer(input);
      const tok = l.nextToken();
      expect(tok.type).toBe(type);
      expect(tok.literal).toBe(input);
      expect(l.nextToken().type).toBe(TokenType.EOF);
    });

    it.each([
      ['</h1>', TokenType.H1],
      ['</p>', TokenType.P],
    ])('lexes closing tag %s', (input, type) => {
      const l = new Lexer(input);
      expect(l.nextToken().type).toBe(type);
      expect(l.nextToken().type).toBe(TokenType.EOF);
    });

    it('lexes self-closing tags', () => {
      const l = new Lexer('<br/>');
      expect(l.nextToken().type).toBe(TokenType.BR);
    });

    it('keeps attributes in the tag literal', () => {
      const l = new Lexer('<a href="https://example.com" class="link">Link</a>');
      const tok = l.nextToken();
      expect(tok.type).toBe(TokenType.A);
      expect(tok.literal).toBe('<a href="https://example.com" class="link">');
    });

    it('lexes text one word at a time', () => {
      const l = new Lexer('Hello World');
      const tok = l.nextToken();
      expect(tok.type).toBe(TokenType.TEXT);
      expect(tok.literal).toBe('Hello');
    });

    it('lexes a sequence of tags and text', () => {
      const l = new Lexer('<h1>Title</h1><p>Content</p>');
      const expected = [
        TokenType.H1,   // <h1>
        TokenType.TEXT, // Title
        TokenType.H1,   // </h1>
        TokenType.P,    // <p>
        TokenType.TEXT, // Content
        TokenType.P,    // </p>
        TokenType.EOF,
      ];
      for (const type of expected) {
        expect(l.nextToken().type).toBe(type);
      }
    });
  });

  describe('getTokenTypeFromTag', () => {
    const l = new Lexer('');

    it.each([
      ['h1', TokenType.H1],
      ['h2', TokenType.H2],
      ['h3', TokenType.H3],
      ['h4', TokenType.H4],
      ['h5', TokenType.H5],
      ['h6', TokenType.H6],
      ['p', TokenType.P],
      ['div', TokenType.DIV],
      ['span', TokenType.SPAN],
      ['strong', TokenType.STRONG],
      ['b', TokenType.B],
      ['em', TokenType.EM],
      ['i', TokenType.I],
      ['u', TokenType.U],
      ['s', TokenType.S],
      ['sup', TokenType.SUP],
      ['sub', TokenType.SUB],
      ['ul', TokenType.UL],
      ['ol', TokenType.OL],
      ['li', TokenType.LI],
      ['a', TokenType.A],
      ['img', TokenType.IMG],
      ['code', TokenType.CODE],
      ['pre', TokenType.PRE],
      ['table', TokenType.TABLE],
      ['tr', TokenType.TR],
      ['td', TokenType.TD],
      ['th', TokenType.TH],
      ['thead', TokenType.THEAD],
      ['tbody', TokenType.TBODY],
      ['blockquote', TokenType.BLOCKQUOTE],
      ['hr', TokenType.HR],
      ['br', TokenType.BR],
      ['unknown', TokenType.TEXT],
      ['constructor', TokenType.TEXT],
    ])('maps %s to %s', (tag, expected) => {
      expect(l.getTokenTypeFromTag(tag)).toBe(expected);
    });

    it.each([
      ['H1', TokenType.H1],
      ['STRONG', TokenType.STRONG],
      ['Em', TokenType.EM],
      ['TABLE', TokenType.TABLE],
    ])('is case-insensitive for %s', (tag, expected) => {
      expect(l.getTokenTypeFromTag(tag)).toBe(expected);
    });
  });

  describe('readTextContent', () => {
    it.each([
      ['Hello World<', 'Hello World'],
      ['Test content<p>', 'Test content'],
      ['', ''],
      ['   Trimmed   <', 'Trimmed'],
    ])('reads %j as %j', (input, expected) => {
      expect(new Lexer(input).readTextContent()).toBe(expected);
    });

    it.each([
      ['Hello &amp; World<', 'Hello & World'],
      ['&lt;tag&gt;<', '<tag>'],
      ['&quot;quoted&quot;<', '"quoted"'],
      ['&nbsp;space<', 'space'],
    ])('decodes entities in %j', (input, expected) => {
      expect(new Lexer(input).readTextContent()).toBe(expected);
    });
  });

  it.each([
    ['&amp;', '&'],
    ['&lt;', '<'],
    ['&gt;', '>'],
    ['&quot;', '"'],
    ['&apos;', "'"],
    ['&nbsp;', ' '],
    ['&unknown;', '&unknown;'],
  ])('decodeHTMLEntity(%s)', (entity, expected) => {
    expect(new Lexer('').decodeHTMLEntity(entity)).toBe(expected);
  });

  it.each([
    ['a', true],
    ['z', true],
    ['A', true],
    ['Z', true],
    ['_', true],
    ['1', false],
    ['@', false],
    [' ', false],
  ])('isLetter(%j) is %s', (ch, expected) => {
    expect(isLetter(ch)).toBe(expected);
  });

  it.each([
    ['0', true],
    ['9', true],
    ['5', true],
    ['a', false],
    [' ', false],
    ['@', false],
  ])('isDigit(%j) is %s', (ch, expected) => {
    expect(isDigit(ch)).toBe(expected);
  });

  it.each([
    ['"hello world"', '"', 'hello world'],
    ["'single quotes'", "'", 'single quotes'],
    ['"unclosed', '"', 'unclosed'],
  ])('readString(%j)', (input, delimiter, expected) => {
    expect(new Lexer(input)['readString'](delimiter)).toBe(expected);
  });

  it('peekChar does not advance', () => {
    const l = new Lexer('abc');
    expect(l['peekChar']()).toBe('b');
    expect(l['ch']).toBe('a');
  });

  it('skipWhitespace skips spaces, tabs, newlines and carriage returns', () => {
    const l = new Lexer('   \t\n\rtext');
    l['skipWhitespace']();
    expect(l['ch']).toBe('t');
  });
});
