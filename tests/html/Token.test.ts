import { Token, TokenType, newToken, newTokenWithAttributes } from '../../src/html/Token';

describe('html Token', () => {
  describe('newToken', () => {
    it.each([
      [TokenType.H1, '<h1>'],
      [TokenType.P, '<p>'],
      [TokenType.STRONG, '<strong>'],
      [TokenType.TEXT, 'Hello World'],
    ])('creates %s token with literal %s', (type, literal) => {
      const result = newToken(type, literal);
      expect(result).toBeInstanceOf(Token);
      expect(result.type).toBe(type);
      expect(result.literal).toBe(literal);
      expect(result.attributes).toEqual({});
    });
  });

  it('newTokenWithAttributes keeps attributes', () => {
    const token = newTokenWithAttributes(TokenType.A, '<a>', {
      href: 'https://example.com',
      class: 'link',
    });

    expect(token.type).toBe(TokenType.A);
    expect(token.literal).toBe('<a>');
    expect(token.attributes['href']).toBe('https://example.com');
    expect(token.attributes['class']).toBe('link');
  });

  it('defines every token type as a non-empty string', () => {
    const tokenTypes = [
      // HTML Tags
      TokenType.H1, TokenType.H2, TokenType.H3, TokenType.H4, TokenType.H5, TokenType.H6,
      TokenType.P, TokenType.DIV, TokenType.SPAN,
      // Text formatting
      TokenType.B, TokenType.STRONG, TokenType.I, TokenType.EM, TokenType.U, TokenType.S,
      TokenType.SUP, TokenType.SUB,
      // Lists
      TokenType.UL, TokenType.OL, TokenType.LI,
      // Links and images
      TokenType.A, TokenType.IMG,
      // Code
      TokenType.CODE, TokenType.PRE,
      // Tables
      TokenType.TABLE, TokenType.TR, TokenType.TD, TokenType.TH, TokenType.THEAD, TokenType.TBODY,
      // Block elements
      TokenType.BLOCKQUOTE, TokenType.HR, TokenType.BR,
      // Special characters and content
      TokenType.TEXT, TokenType.CONTENT,
      // Structural
      TokenType.TAG_OPEN, TokenType.TAG_CLOSE, TokenType.TAG_SELF_CLOSE,
      TokenType.ATTRIBUTE, TokenType.ATTR_NAME, TokenType.ATTR_VALUE,
      // Whitespace
      TokenType.SPACE, TokenType.TAB, TokenType.NEWLINE,
      // Special tokens
      TokenType.EOF, TokenType.ILLEGAL, TokenType.DOCUMENT,
      // Symbols
      TokenType.LT, TokenType.GT, TokenType.SLASH, TokenType.EQUALS, TokenType.QUOTE, TokenType.SINGLE_QUOTE,
    ];

    for (const tokenType of tokenTypes) {
      expect(typeof tokenType).toBe('string');
      expect(tokenType).not.toBe('');
    }
  });

  it.each([
    [TokenType.H1, 'H1'],
    [TokenType.P, 'P'],
    [TokenType.STRONG, 'STRONG'],
    [TokenType.EM, 'EM'],
    [TokenType.UL, 'UL'],
    [TokenType.OL, 'OL'],
    [TokenType.LI, 'LI'],
    [TokenType.A, 'A'],
    [TokenType.CODE, 'CODE'],
    [TokenType.TABLE, 'TABLE'],
    [TokenType.EOF, 'EOF'],
    [TokenType.TEXT, 'TEXT'],
  ])('token type %s has string value %s', (tokenType, expected) => {
    expect(String(tokenType)).toBe(expected);
  });

  it('initializes an attributes map that can be written to', () => {
    const token = newToken(TokenType.DIV, '<div>');
    token.attributes['id'] = 'test';
    token.attributes['class'] = 'container';

    expect(token.attributes['id']).toBe('test');
    expect(token.attributes['class']).toBe('container');
  });
});
