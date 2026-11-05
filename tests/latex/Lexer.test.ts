import { Lexer, isLetter, isDigit, isWhitespace, isText } from '../../src/latex/Lexer';
import { TokenType } from '../../src/latex/Token';

type Expected = { type: TokenType; literal: string };

function expectTokens(input: string, expected: Expected[], checkEmptyLiteral = true): void {
    const lexer = new Lexer(input);
    expected.forEach((exp) => {
        const tok = lexer.nextToken();
        expect(tok.type).toBe(exp.type);
        if (checkEmptyLiteral || exp.literal !== '') {
            expect(tok.literal).toBe(exp.literal);
        }
    });
}

describe('latex Lexer', () => {
    it('constructor initializes state', () => {
        const input = '\\section{Test}';
        const l = new Lexer(input);
        expect(l['input']).toBe(input);
        expect(l['position']).toBe(0);
        expect(l['readPosition']).toBe(1);
    });

    describe('nextToken basic commands', () => {
        it.each([
            ['\\section', TokenType.SECTION],
            ['\\textbf', TokenType.TEXTBF],
            ['\\begin', TokenType.BEGIN],
            ['\\end', TokenType.END],
        ])('%s', (input, type) => {
            expectTokens(input, [
                { type, literal: input },
                { type: TokenType.EOF, literal: '' },
            ], false);
        });
    });

    describe('nextToken structural tokens', () => {
        it.each([
            ['{', TokenType.LBRACE],
            ['}', TokenType.RBRACE],
            ['[', TokenType.LBRACKET],
            [']', TokenType.RBRACKET],
            ['&', TokenType.AMPERSAND],
        ])('%s', (input, type) => {
            expectTokens(input, [
                { type, literal: input },
                { type: TokenType.EOF, literal: '' },
            ]);
        });
    });

    describe('nextToken math delimiters', () => {
        it.each([
            ['$', TokenType.MATH_INLINE],
            ['$$', TokenType.MATH_DISPLAY],
        ])('%s', (input, type) => {
            expectTokens(input, [
                { type, literal: input },
                { type: TokenType.EOF, literal: '' },
            ]);
        });
    });

    it('lexes line break', () => {
        const tok = new Lexer('\\\\').nextToken();
        expect(tok.type).toBe(TokenType.LINEBREAK);
        expect(tok.literal).toBe('\\\\');
    });

    it('lexes comments', () => {
        const tok = new Lexer('% This is a comment').nextToken();
        expect(tok.type).toBe(TokenType.COMMENT);
        expect(tok.literal).toBe('% This is a comment');
    });

    it('lexes text', () => {
        const tok = new Lexer('Hello').nextToken();
        expect(tok.type).toBe(TokenType.TEXT);
        expect(tok.literal).toBe('Hello');
    });

    it('lexes complex LaTeX', () => {
        const expected = [
            TokenType.SECTION,
            TokenType.LBRACE,
            TokenType.TEXT,
            TokenType.RBRACE,
            TokenType.TEXT,
            TokenType.TEXTBF,
            TokenType.LBRACE,
            TokenType.TEXT,
            TokenType.RBRACE,
            TokenType.EOF,
        ];
        const l = new Lexer('\\section{Title} Hello \\textbf{bold}');
        expect(expected.map(() => l.nextToken().type)).toEqual(expected);
    });

    it('getCommandType maps command names', () => {
        const l = new Lexer('');
        const cases: Array<[string, TokenType]> = [
            ['section', TokenType.SECTION],
            ['subsection', TokenType.SUBSECTION],
            ['subsubsection', TokenType.SUBSUBSECTION],
            ['paragraph', TokenType.PARAGRAPH],
            ['subparagraph', TokenType.SUBPARAGRAPH],
            ['textbf', TokenType.TEXTBF],
            ['textit', TokenType.TEXTIT],
            ['underline', TokenType.UNDERLINE],
            ['sout', TokenType.SOUT],
            ['textsuperscript', TokenType.TEXTSUPERSCRIPT],
            ['textsubscript', TokenType.TEXTSUBSCRIPT],
            ['texttt', TokenType.TEXTTT],
            ['begin', TokenType.BEGIN],
            ['end', TokenType.END],
            ['item', TokenType.ITEM],
            ['href', TokenType.HREF],
            ['hrule', TokenType.HRULE],
            ['toprule', TokenType.TOPRULE],
            ['midrule', TokenType.MIDRULE],
            ['bottomrule', TokenType.BOTTOMRULE],
            ['documentclass', TokenType.DOCUMENTCLASS],
            ['usepackage', TokenType.USEPACKAGE],
            ['unknown', TokenType.COMMAND],
        ];
        for (const [name, expected] of cases) {
            expect([name, l['getCommandType'](name)]).toEqual([name, expected]);
        }
    });

    it.each([
        ['{Hello}', 'Hello'],
        ['{Hello World}', 'Hello World'],
        ['{nested {braces}}', 'nested {braces}'],
        ['{}', ''],
        ['not starting with brace', ''],
    ])('readBraceContent(%j)', (input, expected) => {
        expect(new Lexer(input).readBraceContent()).toBe(expected);
    });

    it.each([
        ['[optional]', 'optional'],
        ['[language=go]', 'language=go'],
        ['[]', ''],
        ['not starting with bracket', ''],
    ])('readBracketContent(%j)', (input, expected) => {
        expect(new Lexer(input).readBracketContent()).toBe(expected);
    });

    it.each([
        ['E = mc^2$', '$', 'E = mc^2'],
        ['x + y = z$', '$', 'x + y = z'],
        ['\\sum_{i=1}^{n} i$$', '$$', '\\sum_{i=1}^{n} i'],
        ['a^2 + b^2 = c^2$$', '$$', 'a^2 + b^2 = c^2'],
    ])('readMathContent(%j, %j)', (input, delimiter, expected) => {
        expect(new Lexer(input).readMathContent(delimiter)).toBe(expected);
    });

    it('isLetter', () => {
        const cases: Array<[string, boolean]> = [
            ['a', true], ['z', true], ['A', true], ['Z', true],
            ['1', false], ['@', false], [' ', false], ['_', false],
        ];
        for (const [ch, expected] of cases) {
            expect([ch, isLetter(ch)]).toEqual([ch, expected]);
        }
    });

    it('isDigit', () => {
        const cases: Array<[string, boolean]> = [
            ['0', true], ['9', true], ['5', true],
            ['a', false], [' ', false], ['@', false],
        ];
        for (const [ch, expected] of cases) {
            expect([ch, isDigit(ch)]).toEqual([ch, expected]);
        }
    });

    it('isWhitespace', () => {
        const cases: Array<[string, boolean]> = [
            [' ', true], ['\t', true], ['\r', true],
            ['\n', false], // \n is handled separately
            ['a', false], ['1', false],
        ];
        for (const [ch, expected] of cases) {
            expect([ch, isWhitespace(ch)]).toEqual([ch, expected]);
        }
    });

    it('isText', () => {
        const cases: Array<[string, boolean]> = [
            ['a', true], ['A', true], ['1', true], ['.', true], [',', true], ['!', true], ['?', true],
            ['\\', false], ['{', false], ['}', false], ['[', false], [']', false],
            ['&', false], ['$', false], ['^', false], ['_', false], ['%', false],
        ];
        for (const [ch, expected] of cases) {
            expect([ch, isText(ch)]).toEqual([ch, expected]);
        }
    });

    it('skipWhitespace skips spaces, tabs and carriage returns', () => {
        const l = new Lexer('   \t\r text');
        l['skipWhitespace']();
        expect(l['ch']).toBe('t');
    });

    it('peekChar does not advance', () => {
        const l = new Lexer('abc');
        expect(l['peekChar']()).toBe('b');
        expect(l['ch']).toBe('a');
    });

    it.each([
        ['section', 'section'],
        ['textbf', 'textbf'],
        ['begin', 'begin'],
        ['a', 'a'],
        ['', ''],
    ])('readIdentifier(%j)', (input, expected) => {
        expect(new Lexer(input)['readIdentifier']()).toBe(expected);
    });

    it.each([
        ['Hello', 'Hello'],
        ['Hello World', 'Hello'],   // stops at space
        ['text{', 'text'],          // stops at brace
        ['word\\command', 'word'],  // stops at backslash
        ['', ''],
    ])('readText(%j)', (input, expected) => {
        expect(new Lexer(input)['readText']()).toBe(expected);
    });

    // Not in the Go suite: documents the intentional deviation for non-ASCII
    // input. Go emits one ILLEGAL token per UTF-8 byte and re-encodes each byte
    // as a Latin-1 rune ("é" -> "Ã", "©"); the port keeps the character intact.
    it('keeps a leading non-ASCII character intact as a single ILLEGAL token', () => {
        expectTokens('élan 😀', [
            { type: TokenType.ILLEGAL, literal: 'é' },
            { type: TokenType.TEXT, literal: 'lan' },
            { type: TokenType.ILLEGAL, literal: '😀' },
            { type: TokenType.EOF, literal: '' },
        ]);
    });
});
