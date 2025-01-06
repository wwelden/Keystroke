import { Lexer } from '../src/Lexer';
import { Token, TokenType } from '../src/Token';

describe('Lexer', () => {
  // Helper function to verify token matches expected type and literal
  function expectToken(actual: Token, expected: { type: TokenType; literal: string }) {
    expect(actual.type).toBe(expected.type);
    expect(actual.literal).toBe(expected.literal);
  }

  // Helper function to verify sequence of tokens
  function expectTokens(lexer: Lexer, expectedTokens: Array<{ type: TokenType; literal: string }>) {
    expectedTokens.forEach(expected => {
      const token = lexer.nextToken();
      expectToken(token, expected);
    });
  }

  describe('constructor', () => {
    it('should initialize with empty input', () => {
      const lexer = new Lexer('');
      expect(lexer).toBeDefined();
    });

    it('should initialize with non-empty input', () => {
      const lexer = new Lexer('Hello');
      expect(lexer).toBeDefined();
    });
  });

  describe('nextToken', () => {
    it('should tokenize headers', () => {
      const input = '# Header1\n## Header2\n### Header3\n#### Header4\n##### Header5\n###### Header6';
      const lexer = new Lexer(input);

      expectTokens(lexer, [
        { type: TokenType.HEADER1, literal: '#' },
        { type: TokenType.TEXT, literal: 'Header1' },
        { type: TokenType.NEWLINE, literal: '\n' },
        { type: TokenType.HEADER2, literal: '##' },
        { type: TokenType.TEXT, literal: 'Header2' },
        { type: TokenType.NEWLINE, literal: '\n' },
        { type: TokenType.HEADER3, literal: '###' },
        { type: TokenType.TEXT, literal: 'Header3' },
        { type: TokenType.NEWLINE, literal: '\n' },
        { type: TokenType.HEADER4, literal: '####' },
        { type: TokenType.TEXT, literal: 'Header4' },
        { type: TokenType.NEWLINE, literal: '\n' },
        { type: TokenType.HEADER5, literal: '#####' },
        { type: TokenType.TEXT, literal: 'Header5' },
        { type: TokenType.NEWLINE, literal: '\n' },
        { type: TokenType.HEADER6, literal: '######' },
        { type: TokenType.TEXT, literal: 'Header6' },
        { type: TokenType.EOF, literal: '' }
      ]);
    });

    it('should tokenize text formatting', () => {
      const input = '**bold** _italic_ ~~strikethrough~~ `code`';
      const lexer = new Lexer(input);

      expectTokens(lexer, [
        { type: TokenType.BOLD, literal: '**' },
        { type: TokenType.TEXT, literal: 'bold' },
        { type: TokenType.BOLD, literal: '**' },
        { type: TokenType.TEXT, literal: ' ' },
        { type: TokenType.ITALIC, literal: '_' },
        { type: TokenType.TEXT, literal: 'italic' },
        { type: TokenType.ITALIC, literal: '_' },
        { type: TokenType.TEXT, literal: ' ' },
        { type: TokenType.STRIKETHROUGH, literal: '~~' },
        { type: TokenType.TEXT, literal: 'strikethrough' },
        { type: TokenType.STRIKETHROUGH, literal: '~~' },
        { type: TokenType.TEXT, literal: ' ' },
        { type: TokenType.INLINE_CODE, literal: '`' },
        { type: TokenType.TEXT, literal: 'code' },
        { type: TokenType.INLINE_CODE, literal: '`' },
        { type: TokenType.EOF, literal: '' }
      ]);
    });

    it('should tokenize lists', () => {
      const input = '* Item 1\n- Item 2\n- [ ] Todo\n- [x] Done';
      const lexer = new Lexer(input);

      expectTokens(lexer, [
        { type: TokenType.UNORDERED_LIST, literal: '*' },
        { type: TokenType.TEXT, literal: 'Item' },
        { type: TokenType.TEXT, literal: '1' },
        { type: TokenType.NEWLINE, literal: '\n' },
        { type: TokenType.LIST_ITEM, literal: '-' },
        { type: TokenType.TEXT, literal: 'Item' },
        { type: TokenType.TEXT, literal: '2' },
        { type: TokenType.NEWLINE, literal: '\n' },
        { type: TokenType.CHECKLIST, literal: '- [ ]' },
        { type: TokenType.TEXT, literal: 'Todo' },
        { type: TokenType.NEWLINE, literal: '\n' },
        { type: TokenType.CHECKLIST_CHECKED, literal: '- [x]' },
        { type: TokenType.TEXT, literal: 'Done' },
        { type: TokenType.EOF, literal: '' }
      ]);
    });

    it('should tokenize links', () => {
      const input = '[Link text](https://example.com)';
      const lexer = new Lexer(input);

      expectTokens(lexer, [
        { type: TokenType.LINK_TEXT_START, literal: '[' },
        { type: TokenType.TEXT, literal: 'Link' },
        { type: TokenType.TEXT, literal: 'text' },
        { type: TokenType.LINK_TEXT_END, literal: ']' },
        { type: TokenType.LINK_URL_START, literal: '(' },
        { type: TokenType.TEXT, literal: 'https://example.com' },
        { type: TokenType.LINK_URL_END, literal: ')' },
        { type: TokenType.EOF, literal: '' }
      ]);
    });

    it('should tokenize blockquotes and horizontal rules', () => {
      const input = '> Blockquote\n---';
      const lexer = new Lexer(input);

      expectTokens(lexer, [
        { type: TokenType.BLOCKQUOTE, literal: '>' },
        { type: TokenType.TEXT, literal: 'Blockquote' },
        { type: TokenType.NEWLINE, literal: '\n' },
        { type: TokenType.HORIZONTAL_RULE, literal: '---' },
        { type: TokenType.EOF, literal: '' }
      ]);
    });
  });

  describe('readText', () => {
    it('should handle mixed text content', () => {
      const input = 'Hello, World! 123';
      const lexer = new Lexer(input);

      expectToken(lexer.nextToken(), { type: TokenType.TEXT, literal: 'Hello,' });
    });
  });

  describe('skipWhitespace', () => {
    it('should skip various whitespace characters', () => {
      const input = '   \t\n\r  text';
      const lexer = new Lexer(input);

      expectToken(lexer.nextToken(), { type: TokenType.TEXT, literal: 'text' });
    });
  });
});