import { Token, TokenType, newToken, newTokenWithValue, newTokenWithOptions } from '../../src/latex/Token';

describe('latex Token', () => {
    describe('newToken', () => {
        it.each([
            [TokenType.SECTION, '\\section'],
            [TokenType.TEXTBF, '\\textbf'],
            [TokenType.TEXT, 'Hello'],
            [TokenType.LBRACE, '{'],
        ])('creates %s token', (type, literal) => {
            const result = newToken(type, literal);
            expect(result.type).toBe(type);
            expect(result.literal).toBe(literal);
            expect(result.value).toBe('');
            expect(result.options).toBe('');
        });
    });

    describe('newTokenWithValue', () => {
        it.each([
            [TokenType.SECTION, '\\section', 'Introduction'],
            [TokenType.TEXTBF, '\\textbf', 'bold text'],
            [TokenType.HREF, '\\href', 'link text'],
        ])('creates %s token with value', (type, literal, value) => {
            const result = newTokenWithValue(type, literal, value);
            expect(result.type).toBe(type);
            expect(result.literal).toBe(literal);
            expect(result.value).toBe(value);
            expect(result.options).toBe('');
        });
    });

    describe('newTokenWithOptions', () => {
        it.each([
            [TokenType.HREF, '\\href', 'text', 'url'],
            [TokenType.LSTLISTING, '\\begin{lstlisting}', '', 'language=go'],
        ])('creates %s token with options', (type, literal, value, options) => {
            const result = newTokenWithOptions(type, literal, value, options);
            expect(result.type).toBe(type);
            expect(result.value).toBe(value);
            expect(result.options).toBe(options);
        });
    });

    it('isCommand', () => {
        const cases: Array<[TokenType, boolean]> = [
            [TokenType.SECTION, true],
            [TokenType.SUBSECTION, true],
            [TokenType.TEXTBF, true],
            [TokenType.TEXTIT, true],
            [TokenType.ITEM, true],
            [TokenType.HREF, true],
            [TokenType.LINEBREAK, true],
            [TokenType.HRULE, true],
            [TokenType.TEXT, false],
            [TokenType.LBRACE, false],
            [TokenType.ITEMIZE, false],
            [TokenType.EOF, false],
        ];
        for (const [type, expected] of cases) {
            expect([type, new Token(type, '').isCommand()]).toEqual([type, expected]);
        }
    });

    it('isEnvironment', () => {
        const cases: Array<[TokenType, boolean]> = [
            [TokenType.ITEMIZE, true],
            [TokenType.ENUMERATE, true],
            [TokenType.TABULAR, true],
            [TokenType.QUOTE, true],
            [TokenType.LSTLISTING, true],
            [TokenType.SECTION, false],
            [TokenType.TEXTBF, false],
            [TokenType.TEXT, false],
            [TokenType.LBRACE, false],
            [TokenType.EOF, false],
        ];
        for (const [type, expected] of cases) {
            expect([type, new Token(type, '').isEnvironment()]).toEqual([type, expected]);
        }
    });

    it('isStructural', () => {
        const cases: Array<[TokenType, boolean]> = [
            [TokenType.LBRACE, true],
            [TokenType.RBRACE, true],
            [TokenType.LBRACKET, true],
            [TokenType.RBRACKET, true],
            [TokenType.BACKSLASH, true],
            [TokenType.AMPERSAND, true],
            [TokenType.SECTION, false],
            [TokenType.TEXTBF, false],
            [TokenType.TEXT, false],
            [TokenType.ITEMIZE, false],
            [TokenType.EOF, false],
        ];
        for (const [type, expected] of cases) {
            expect([type, new Token(type, '').isStructural()]).toEqual([type, expected]);
        }
    });

    it('defines every token type as a non-empty string', () => {
        const types = Object.values(TokenType);
        expect(types).toHaveLength(47);
        for (const type of types) {
            expect(typeof type).toBe('string');
            expect(type).not.toBe('');
        }
    });

    it('token type string values match their names', () => {
        const cases: Array<[TokenType, string]> = [
            [TokenType.SECTION, 'SECTION'],
            [TokenType.SUBSECTION, 'SUBSECTION'],
            [TokenType.TEXTBF, 'TEXTBF'],
            [TokenType.TEXTIT, 'TEXTIT'],
            [TokenType.ITEMIZE, 'ITEMIZE'],
            [TokenType.ENUMERATE, 'ENUMERATE'],
            [TokenType.HREF, 'HREF'],
            [TokenType.LBRACE, 'LBRACE'],
            [TokenType.RBRACE, 'RBRACE'],
            [TokenType.TEXT, 'TEXT'],
            [TokenType.EOF, 'EOF'],
        ];
        for (const [type, expected] of cases) {
            expect(String(type)).toBe(expected);
        }
    });
});
