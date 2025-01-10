import { Token, TokenType, keywords } from '../src/Token';

describe('Token', () => {
    describe('Token Class', () => {
        it('should create a token with type and literal', () => {
            const token = new Token(TokenType.HEADER1, '#');
            expect(token.type).toBe(TokenType.HEADER1);
            expect(token.literal).toBe('#');
        });

        it('should handle empty literal', () => {
            const token = new Token(TokenType.EOF, '');
            expect(token.type).toBe(TokenType.EOF);
            expect(token.literal).toBe('');
        });
    });

    describe('TokenType Enum', () => {
        it('should have all header types defined', () => {
            expect(TokenType.HEADER1).toBe('HEADER1');
            expect(TokenType.HEADER2).toBe('HEADER2');
            expect(TokenType.HEADER3).toBe('HEADER3');
            expect(TokenType.HEADER4).toBe('HEADER4');
            expect(TokenType.HEADER5).toBe('HEADER5');
            expect(TokenType.HEADER6).toBe('HEADER6');
        });

        it('should have all list types defined', () => {
            expect(TokenType.UNORDERED_LIST).toBe('UNORDERED_LIST');
            expect(TokenType.ORDERED_LIST).toBe('ORDERED_LIST');
            expect(TokenType.LIST_ITEM).toBe('LIST_ITEM');
            expect(TokenType.CHECKLIST).toBe('CHECKLIST');
            expect(TokenType.CHECKLIST_CHECKED).toBe('CHECKLIST_CHECKED');
        });

        it('should have all text formatting types defined', () => {
            expect(TokenType.BOLD).toBe('BOLD');
            expect(TokenType.ITALIC).toBe('ITALIC');
            expect(TokenType.STRIKETHROUGH).toBe('STRIKETHROUGH');
        });

        it('should have all code types defined', () => {
            expect(TokenType.INLINE_CODE).toBe('INLINE_CODE');
            expect(TokenType.CODE_BLOCK).toBe('CODE_BLOCK');
        });

        it('should have all link types defined', () => {
            expect(TokenType.LEFT_BRACKET).toBe('LEFT_BRACKET');
            expect(TokenType.RIGHT_BRACKET).toBe('RIGHT_BRACKET');
            expect(TokenType.LEFT_PARENTHESIS).toBe('LEFT_PARENTHESIS');
            expect(TokenType.RIGHT_PARENTHESIS).toBe('RIGHT_PARENTHESIS');
        });

        it('should have all other types defined', () => {
            expect(TokenType.BLOCKQUOTE).toBe('BLOCKQUOTE');
            expect(TokenType.HORIZONTAL_RULE).toBe('HORIZONTAL_RULE');
            expect(TokenType.TEXT).toBe('TEXT');
            expect(TokenType.EOF).toBe('EOF');
            expect(TokenType.NEWLINE).toBe('NEWLINE');
            expect(TokenType.ILLEGAL).toBe('ILLEGAL');
        });

        it('should have all math types defined', () => {
            expect(TokenType.MATH).toBe('MATH');
            expect(TokenType.SUPERSCRIPT).toBe('SUPERSCRIPT');
            expect(TokenType.SUBSCRIPT).toBe('SUBSCRIPT');
        });
    });

    describe('Keywords Map', () => {
        const testCases = {
            headers: [
                { input: '#', expected: TokenType.HEADER1 },
                { input: '##', expected: TokenType.HEADER2 },
                { input: '###', expected: TokenType.HEADER3 },
                { input: '####', expected: TokenType.HEADER4 },
                { input: '#####', expected: TokenType.HEADER5 },
                { input: '######', expected: TokenType.HEADER6 }
            ],
            lists: [
                { input: '*', expected: TokenType.UNORDERED_LIST },
                { input: '1.', expected: TokenType.ORDERED_LIST },
                { input: '-', expected: TokenType.LIST_ITEM },
                { input: '- [ ]', expected: TokenType.CHECKLIST },
                { input: '- [x]', expected: TokenType.CHECKLIST_CHECKED }
            ],
            textFormatting: [
                { input: '**', expected: TokenType.BOLD },
                { input: '_', expected: TokenType.ITALIC },
                { input: '~~', expected: TokenType.STRIKETHROUGH }
            ],
            code: [
                { input: '`', expected: TokenType.INLINE_CODE },
                { input: '```', expected: TokenType.CODE_BLOCK }
            ],
            links: [
                { input: '[', expected: TokenType.LEFT_BRACKET },
                { input: ']', expected: TokenType.RIGHT_BRACKET },
                { input: '(', expected: TokenType.LEFT_PARENTHESIS },
                { input: ')', expected: TokenType.RIGHT_PARENTHESIS }
            ],
            other: [
                { input: '>', expected: TokenType.BLOCKQUOTE },
                { input: '---', expected: TokenType.HORIZONTAL_RULE }
            ],
            invalid: [
                { input: 'undefined_symbol', expected: undefined },
                { input: '!', expected: undefined }
            ],
            math: [
                { input: '$', expected: TokenType.MATH },
                { input: '^', expected: TokenType.SUPERSCRIPT },
                { input: '~', expected: TokenType.SUBSCRIPT }
            ]
        };

        Object.entries(testCases).forEach(([category, cases]) => {
            describe(category, () => {
                cases.forEach(({ input, expected }) => {
                    it(`should map ${input} to ${expected}`, () => {
                        expect(keywords[input]).toBe(expected);
                    });
                });
            });
        });
    });
});