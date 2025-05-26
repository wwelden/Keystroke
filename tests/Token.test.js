"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Token_1 = require("../src/Token");
describe('Token', () => {
    describe('Token Class', () => {
        it('should create a token with type and literal', () => {
            const token = new Token_1.Token(Token_1.TokenType.HEADER1, '#');
            expect(token.type).toBe(Token_1.TokenType.HEADER1);
            expect(token.literal).toBe('#');
        });
        it('should handle empty literal', () => {
            const token = new Token_1.Token(Token_1.TokenType.EOF, '');
            expect(token.type).toBe(Token_1.TokenType.EOF);
            expect(token.literal).toBe('');
        });
    });
    describe('TokenType Enum', () => {
        it('should have all header types defined', () => {
            expect(Token_1.TokenType.HEADER1).toBe('HEADER1');
            expect(Token_1.TokenType.HEADER2).toBe('HEADER2');
            expect(Token_1.TokenType.HEADER3).toBe('HEADER3');
            expect(Token_1.TokenType.HEADER4).toBe('HEADER4');
            expect(Token_1.TokenType.HEADER5).toBe('HEADER5');
            expect(Token_1.TokenType.HEADER6).toBe('HEADER6');
        });
        it('should have all list types defined', () => {
            expect(Token_1.TokenType.UNORDERED_LIST).toBe('UNORDERED_LIST');
            expect(Token_1.TokenType.ORDERED_LIST).toBe('ORDERED_LIST');
            expect(Token_1.TokenType.LIST_ITEM).toBe('LIST_ITEM');
            expect(Token_1.TokenType.CHECKLIST).toBe('CHECKLIST');
            expect(Token_1.TokenType.CHECKLIST_CHECKED).toBe('CHECKLIST_CHECKED');
        });
        it('should have all text formatting types defined', () => {
            expect(Token_1.TokenType.BOLD).toBe('BOLD');
            expect(Token_1.TokenType.ITALIC).toBe('ITALIC');
            expect(Token_1.TokenType.STRIKETHROUGH).toBe('STRIKETHROUGH');
        });
        it('should have all code types defined', () => {
            expect(Token_1.TokenType.INLINE_CODE).toBe('INLINE_CODE');
            expect(Token_1.TokenType.CODE_BLOCK).toBe('CODE_BLOCK');
        });
        it('should have all link types defined', () => {
            expect(Token_1.TokenType.LEFT_BRACKET).toBe('LEFT_BRACKET');
            expect(Token_1.TokenType.RIGHT_BRACKET).toBe('RIGHT_BRACKET');
            expect(Token_1.TokenType.LEFT_PARENTHESIS).toBe('LEFT_PARENTHESIS');
            expect(Token_1.TokenType.RIGHT_PARENTHESIS).toBe('RIGHT_PARENTHESIS');
        });
        it('should have all other types defined', () => {
            expect(Token_1.TokenType.BLOCKQUOTE).toBe('BLOCKQUOTE');
            expect(Token_1.TokenType.HORIZONTAL_RULE).toBe('HORIZONTAL_RULE');
            expect(Token_1.TokenType.TEXT).toBe('TEXT');
            expect(Token_1.TokenType.EOF).toBe('EOF');
            expect(Token_1.TokenType.NEWLINE).toBe('NEWLINE');
            expect(Token_1.TokenType.ILLEGAL).toBe('ILLEGAL');
        });
        it('should have all math types defined', () => {
            expect(Token_1.TokenType.MATH).toBe('MATH');
            expect(Token_1.TokenType.SUPERSCRIPT).toBe('SUPERSCRIPT');
            expect(Token_1.TokenType.SUBSCRIPT).toBe('SUBSCRIPT');
        });
    });
    describe('Keywords Map', () => {
        const testCases = {
            headers: [
                { input: '#', expected: Token_1.TokenType.HEADER1 },
                { input: '##', expected: Token_1.TokenType.HEADER2 },
                { input: '###', expected: Token_1.TokenType.HEADER3 },
                { input: '####', expected: Token_1.TokenType.HEADER4 },
                { input: '#####', expected: Token_1.TokenType.HEADER5 },
                { input: '######', expected: Token_1.TokenType.HEADER6 }
            ],
            lists: [
                { input: '*', expected: Token_1.TokenType.UNORDERED_LIST },
                { input: '1.', expected: Token_1.TokenType.ORDERED_LIST },
                { input: '-', expected: Token_1.TokenType.LIST_ITEM },
                { input: '- [ ]', expected: Token_1.TokenType.CHECKLIST },
                { input: '- [x]', expected: Token_1.TokenType.CHECKLIST_CHECKED }
            ],
            textFormatting: [
                { input: '**', expected: Token_1.TokenType.BOLD },
                { input: '_', expected: Token_1.TokenType.ITALIC },
                { input: '~~', expected: Token_1.TokenType.STRIKETHROUGH }
            ],
            code: [
                { input: '`', expected: Token_1.TokenType.INLINE_CODE },
                { input: '```', expected: Token_1.TokenType.CODE_BLOCK }
            ],
            links: [
                { input: '[', expected: Token_1.TokenType.LEFT_BRACKET },
                { input: ']', expected: Token_1.TokenType.RIGHT_BRACKET },
                { input: '(', expected: Token_1.TokenType.LEFT_PARENTHESIS },
                { input: ')', expected: Token_1.TokenType.RIGHT_PARENTHESIS }
            ],
            other: [
                { input: '>', expected: Token_1.TokenType.BLOCKQUOTE },
                { input: '---', expected: Token_1.TokenType.HORIZONTAL_RULE }
            ],
            invalid: [
                { input: 'undefined_symbol', expected: undefined },
                { input: '!', expected: undefined }
            ],
            math: [
                { input: '$', expected: Token_1.TokenType.MATH },
                { input: '^', expected: Token_1.TokenType.SUPERSCRIPT },
                { input: '~', expected: Token_1.TokenType.SUBSCRIPT }
            ]
        };
        Object.entries(testCases).forEach(([category, cases]) => {
            describe(category, () => {
                cases.forEach(({ input, expected }) => {
                    it(`should map ${input} to ${expected}`, () => {
                        expect(Token_1.keywords[input]).toBe(expected);
                    });
                });
            });
        });
    });
});
