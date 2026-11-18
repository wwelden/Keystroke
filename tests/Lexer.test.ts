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
        { type: TokenType.SPACE, literal: ' ' },
        { type: TokenType.TEXT, literal: 'Header1' },
        { type: TokenType.NEWLINE, literal: '\n' },
        { type: TokenType.HEADER2, literal: '##' },
        { type: TokenType.SPACE, literal: ' ' },
        { type: TokenType.TEXT, literal: 'Header2' },
        { type: TokenType.NEWLINE, literal: '\n' },
        { type: TokenType.HEADER3, literal: '###' },
        { type: TokenType.SPACE, literal: ' ' },
        { type: TokenType.TEXT, literal: 'Header3' },
        { type: TokenType.NEWLINE, literal: '\n' },
        { type: TokenType.HEADER4, literal: '####' },
        { type: TokenType.SPACE, literal: ' ' },
        { type: TokenType.TEXT, literal: 'Header4' },
        { type: TokenType.NEWLINE, literal: '\n' },
        { type: TokenType.HEADER5, literal: '#####' },
        { type: TokenType.SPACE, literal: ' ' },
        { type: TokenType.TEXT, literal: 'Header5' },
        { type: TokenType.NEWLINE, literal: '\n' },
        { type: TokenType.HEADER6, literal: '######' },
        { type: TokenType.SPACE, literal: ' ' },
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
        { type: TokenType.SPACE, literal: ' ' },
        { type: TokenType.ITALIC, literal: '_' },
        { type: TokenType.TEXT, literal: 'italic' },
        { type: TokenType.ITALIC, literal: '_' },
        { type: TokenType.SPACE, literal: ' ' },
        { type: TokenType.STRIKETHROUGH, literal: '~~' },
        { type: TokenType.TEXT, literal: 'strikethrough' },
        { type: TokenType.STRIKETHROUGH, literal: '~~' },
        { type: TokenType.SPACE, literal: ' ' },
        { type: TokenType.INLINE_CODE, literal: '`' },
        { type: TokenType.TEXT, literal: 'code' },
        { type: TokenType.INLINE_CODE, literal: '`' },
        { type: TokenType.EOF, literal: '' }
      ]);
    });

    it('test tasks', () => {
      const input = '- [ ] Task 1\n - [x] Task 2\n - [ ] Task 3';
      const lexer = new Lexer(input);

      expectTokens(lexer, [
        { type: TokenType.CHECKLIST, literal: '- [ ]' },
        { type: TokenType.SPACE, literal: ' ' },
        { type: TokenType.TEXT, literal: 'Task' },
        { type: TokenType.SPACE, literal: ' ' },
        { type: TokenType.TEXT, literal: '1' },
        { type: TokenType.NEWLINE, literal: '\n' },
        { type: TokenType.SPACE, literal: ' ' },
        { type: TokenType.CHECKLIST_CHECKED, literal: '- [x]' },
        { type: TokenType.SPACE, literal: ' ' },
        { type: TokenType.TEXT, literal: 'Task' },
        { type: TokenType.SPACE, literal: ' ' },
        { type: TokenType.TEXT, literal: '2' },
        { type: TokenType.NEWLINE, literal: '\n' },
        { type: TokenType.SPACE, literal: ' ' },
        { type: TokenType.CHECKLIST, literal: '- [ ]' },
        { type: TokenType.SPACE, literal: ' ' },
        { type: TokenType.TEXT, literal: 'Task' },
        { type: TokenType.SPACE, literal: ' ' },
        { type: TokenType.TEXT, literal: '3' },
        // { type: TokenType.NEWLINE, literal: '\n' },
        { type: TokenType.EOF, literal: '' }
      ]);
    });

    it('should tokenize lists', () => {
      const input = '* Item 1\n * Item 2\n - [ ] Todo\n - [x] Done';
      const lexer = new Lexer(input);

      expectTokens(lexer, [
        { type: TokenType.UNORDERED_LIST, literal: '*' },
        { type: TokenType.SPACE, literal: ' ' },
        { type: TokenType.TEXT, literal: 'Item' },
        { type: TokenType.SPACE, literal: ' ' },
        { type: TokenType.TEXT, literal: '1' },
        { type: TokenType.NEWLINE, literal: '\n' },
        { type: TokenType.SPACE, literal: ' ' },
        { type: TokenType.UNORDERED_LIST, literal: '*' },
        { type: TokenType.SPACE, literal: ' ' },
        { type: TokenType.TEXT, literal: 'Item' },
        { type: TokenType.SPACE, literal: ' ' },
        { type: TokenType.TEXT, literal: '2' },
        { type: TokenType.NEWLINE, literal: '\n' },
        { type: TokenType.SPACE, literal: ' ' },
        { type: TokenType.CHECKLIST, literal: '- [ ]' },
        { type: TokenType.SPACE, literal: ' ' },
        { type: TokenType.TEXT, literal: 'Todo' },
        { type: TokenType.NEWLINE, literal: '\n' },
        { type: TokenType.SPACE, literal: ' ' },
        { type: TokenType.CHECKLIST_CHECKED, literal: '- [x]' },
        { type: TokenType.SPACE, literal: ' ' },
        { type: TokenType.TEXT, literal: 'Done' },
        { type: TokenType.EOF, literal: '' }
      ]);
    });

    it('should tokenize links', () => {
      const input = '[Link text](https://example.com)';
      const lexer = new Lexer(input);

      expectTokens(lexer, [
        { type: TokenType.LEFT_BRACKET, literal: '[' },
        { type: TokenType.TEXT, literal: 'Link' },
        { type: TokenType.SPACE, literal: ' ' },
        { type: TokenType.TEXT, literal: 'text' },
        { type: TokenType.RIGHT_BRACKET, literal: ']' },
        { type: TokenType.LEFT_PARENTHESIS, literal: '(' },
        { type: TokenType.TEXT, literal: 'https://example.com' },
        { type: TokenType.RIGHT_PARENTHESIS, literal: ')' },
        { type: TokenType.EOF, literal: '' }
      ]);
    });

    it('should tokenize blockquotes and horizontal rules', () => {
      const input = '> Blockquote\n---';
      const lexer = new Lexer(input);

      expectTokens(lexer, [
        { type: TokenType.BLOCKQUOTE, literal: '>' },
        { type: TokenType.SPACE, literal: ' ' },
        { type: TokenType.TEXT, literal: 'Blockquote' },
        { type: TokenType.NEWLINE, literal: '\n' },
        { type: TokenType.HORIZONTAL_RULE, literal: '---' },
        { type: TokenType.EOF, literal: '' }
      ]);
    });

    it('should tokenize math expressions', () => {
      const input = '$1+2=3 $ x ^2 y ~1';
      const lexer = new Lexer(input);

      expectTokens(lexer, [
        { type: TokenType.MATH, literal: '$' },
        { type: TokenType.TEXT, literal: '1+2=3' },
        { type: TokenType.SPACE, literal: ' ' },
        { type: TokenType.MATH, literal: '$' },
        { type: TokenType.SPACE, literal: ' ' },
        { type: TokenType.TEXT, literal: 'x' },
        { type: TokenType.SPACE, literal: ' ' },
        { type: TokenType.SUPERSCRIPT, literal: '^' },
        { type: TokenType.TEXT, literal: '2' },
        { type: TokenType.SPACE, literal: ' ' },
        { type: TokenType.TEXT, literal: 'y' },
        { type: TokenType.SPACE, literal: ' ' },
        { type: TokenType.SUBSCRIPT, literal: '~' },
        { type: TokenType.TEXT, literal: '1' },
        { type: TokenType.EOF, literal: '' }
      ]);
    });
  });

  describe('readText', () => {
    it('should handle mixed text content', () => {
      const input = 'Hello, World! 123';
      const lexer = new Lexer(input);

      expectToken(lexer.nextToken(), { type: TokenType.TEXT, literal: 'Hello,' });
      expectToken(lexer.nextToken(), { type: TokenType.SPACE, literal: ' ' });
      expectToken(lexer.nextToken(), { type: TokenType.TEXT, literal: 'World!' });
      expectToken(lexer.nextToken(), { type: TokenType.SPACE, literal: ' ' });
      expectToken(lexer.nextToken(), { type: TokenType.TEXT, literal: '123' });
    });

    // Regression for #70: a NUL in the source must not end the input.
    it('keeps text after a NUL, replacing the NUL with U+FFFD', () => {
      const lexer = new Lexer('before\0after');

      expectToken(lexer.nextToken(), { type: TokenType.TEXT, literal: 'before�after' });
      expectToken(lexer.nextToken(), { type: TokenType.EOF, literal: '' });
    });
  });

  // Regression for #21: block markers only count at the start of a line.
  describe('line-start block markers', () => {
    function types(input: string): Array<[TokenType, string]> {
      const lexer = new Lexer(input);
      const out: Array<[TokenType, string]> = [];
      for (let t = lexer.nextToken(); t.type !== TokenType.EOF; t = lexer.nextToken()) {
        out.push([t.type, t.literal]);
      }
      return out;
    }

    it.each([
      ['C# is great', '#'],
      ['a > b', '>'],
      ['well-known term', '-'],
      ['x - y', '-'],
      ['a --- b', '---'],
      ['x - [ ] y', '-'],
      ['a * b', '*'],
    ])('%j lexes the mid-line marker as TEXT', (input, marker) => {
      const tokens = types(input);
      expect(tokens).toContainEqual([TokenType.TEXT, marker]);
      const blockTypes = [
        TokenType.HEADER1, TokenType.BLOCKQUOTE, TokenType.LIST_ITEM, TokenType.UNORDERED_LIST,
        TokenType.HORIZONTAL_RULE, TokenType.CHECKLIST, TokenType.CHECKLIST_CHECKED,
      ];
      expect(tokens.filter(([type]) => blockTypes.includes(type))).toEqual([]);
    });

    it('keeps the x of a mid-line `- [x]` as text', () => {
      const tokens = types('a - [x] b');
      expect(tokens).toContainEqual([TokenType.TEXT, 'x']);
      expect(tokens.map(([type]) => type)).not.toContain(TokenType.ILLEGAL);
    });

    it('lexes a rule of more than three dashes as one token', () => {
      expect(types('-----')).toEqual([[TokenType.HORIZONTAL_RULE, '---']]);
    });

    it('needs a space or end of line after # for a header', () => {
      expect(types('#tag')[0]).toEqual([TokenType.TEXT, '#']);
      expect(types('####### x')[0]).toEqual([TokenType.TEXT, '#######']);
      expect(types('#')[0]).toEqual([TokenType.HEADER1, '#']);
      expect(types('## x')[0]).toEqual([TokenType.HEADER2, '##']);
    });

    it('recognizes markers after indentation and after a newline', () => {
      expect(types('  # H')).toContainEqual([TokenType.HEADER1, '#']);
      expect(types('\t> q')).toContainEqual([TokenType.BLOCKQUOTE, '>']);
      expect(types('a\n- b').map(([type]) => type)).toContain(TokenType.LIST_ITEM);
      expect(types('a\n* b')).toContainEqual([TokenType.UNORDERED_LIST, '*']);
      expect(types('a\n---')).toContainEqual([TokenType.HORIZONTAL_RULE, '---']);
      expect(types('a\n- [x] b')).toContainEqual([TokenType.CHECKLIST_CHECKED, '- [x]']);
    });

    it('lexes list markers for #23', () => {
      expect(types('1. a')[0]).toEqual([TokenType.ORDERED_LIST, '1.']);
      expect(types('a\n12. b')).toContainEqual([TokenType.ORDERED_LIST, '12.']);
      expect(types('1.5')[0]).toEqual([TokenType.TEXT, '1.5']);
      expect(types('a 1. b').map(([type]) => type)).not.toContain(TokenType.ORDERED_LIST);
      // `-` needs a following space (or end of line) to be a list marker.
      expect(types('-5')[0]).toEqual([TokenType.TEXT, '-']);
      expect(types('-- x')[0]).toEqual([TokenType.TEXT, '--']);
      expect(types('-')[0]).toEqual([TokenType.LIST_ITEM, '-']);
      expect(types('- [x](u)')[0]).toEqual([TokenType.LIST_ITEM, '-']);
      expect(types('- [x]\tz')[0]).toEqual([TokenType.CHECKLIST_CHECKED, '- [x]']);
      // A `[` that isn't a checkbox stays a token for the link parser.
      expect(types('- [a](b)').slice(0, 3)).toEqual([
        [TokenType.LIST_ITEM, '-'], [TokenType.SPACE, ' '], [TokenType.LEFT_BRACKET, '['],
      ]);
    });

    it('keeps inline emphasis working mid-line', () => {
      expect(types('a *i* **b** ~~s~~').map(([type]) => type)).toEqual([
        TokenType.TEXT, TokenType.SPACE,
        TokenType.ITALIC, TokenType.TEXT, TokenType.ITALIC, TokenType.SPACE,
        TokenType.BOLD, TokenType.TEXT, TokenType.BOLD, TokenType.SPACE,
        TokenType.STRIKETHROUGH, TokenType.TEXT, TokenType.STRIKETHROUGH,
      ]);
      // The closing `*` before a space is emphasis, not a list marker.
      expect(types('*a* b')[2]).toEqual([TokenType.ITALIC, '*']);
    });
  });

  describe('fenced code blocks', () => {
    function tokens(input: string): Token[] {
      const lexer = new Lexer(input);
      const out: Token[] = [];
      for (let t = lexer.nextToken(); t.type !== TokenType.EOF; t = lexer.nextToken()) {
        out.push(t);
      }
      return out;
    }

    it('reads a fence at line start as one CODE_BLOCK with raw content', () => {
      const out = tokens('```\nconst a = 1;\nconst b = 2;\n```');
      expect(out).toHaveLength(1);
      expect(out[0].type).toBe(TokenType.CODE_BLOCK);
      expect(out[0].literal).toBe('const a = 1;\nconst b = 2;\n');
      expect(out[0].language).toBeUndefined();
    });

    it('captures the language and keeps markdown characters literal', () => {
      const [block, ...rest] = tokens('```ts extra\n# *a* _b_ `c`\n```\nafter');
      expect(block.type).toBe(TokenType.CODE_BLOCK);
      expect(block.language).toBe('ts');
      expect(block.literal).toBe('# *a* _b_ `c`\n');
      // The closing fence's newline is consumed; lexing resumes at line start.
      expect(rest.map(t => [t.type, t.literal])).toEqual([[TokenType.TEXT, 'after']]);
    });

    it('runs an unterminated fence to EOF', () => {
      const out = tokens('```\ncode\nmore');
      expect(out).toHaveLength(1);
      expect(out[0].literal).toBe('code\nmore\n');
    });

    it('closes only on a fence at least as long as the opener', () => {
      const out = tokens('````\n```\n````');
      expect(out).toHaveLength(1);
      expect(out[0].literal).toBe('```\n');
    });

    it('strips the opener indent from content lines', () => {
      const out = tokens('  ```\n    a\n b\n  ```');
      expect(out.map(t => t.type)).toEqual([TokenType.SPACE, TokenType.SPACE, TokenType.CODE_BLOCK]);
      expect(out[2].literal).toBe('  a\nb\n');
    });

    it('does not open a fence indented 4 or more spaces', () => {
      expect(tokens('    ```\nx').some(t => t.type === TokenType.CODE_BLOCK)).toBe(false);
    });

    it('treats backticks mid-line as inline code', () => {
      expect(tokens('a ```b```').map(t => t.type)).toEqual([
        TokenType.TEXT, TokenType.SPACE, TokenType.INLINE_CODE, TokenType.TEXT, TokenType.INLINE_CODE,
      ]);
    });
  });
});
