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
            expect(TokenType.LINK_TEXT_START).toBe('LINK_TEXT_START');
            expect(TokenType.LINK_TEXT_END).toBe('LINK_TEXT_END');
            expect(TokenType.LINK_URL_START).toBe('LINK_URL_START');
            expect(TokenType.LINK_URL_END).toBe('LINK_URL_END');
        });

        it('should have all other types defined', () => {
            expect(TokenType.BLOCKQUOTE).toBe('BLOCKQUOTE');
            expect(TokenType.HORIZONTAL_RULE).toBe('HORIZONTAL_RULE');
            expect(TokenType.TEXT).toBe('TEXT');
            expect(TokenType.EOF).toBe('EOF');
            expect(TokenType.NEWLINE).toBe('NEWLINE');
            expect(TokenType.ILLEGAL).toBe('ILLEGAL');
        });
    });

    describe('Keywords Map', () => {
        it('should map header symbols correctly', () => {
            expect(keywords['#']).toBe(TokenType.HEADER1);
            expect(keywords['##']).toBe(TokenType.HEADER2);
            expect(keywords['###']).toBe(TokenType.HEADER3);
            expect(keywords['####']).toBe(TokenType.HEADER4);
            expect(keywords['#####']).toBe(TokenType.HEADER5);
            expect(keywords['######']).toBe(TokenType.HEADER6);
        });

        it('should map list symbols correctly', () => {
            expect(keywords['*']).toBe(TokenType.UNORDERED_LIST);
            expect(keywords['1.']).toBe(TokenType.ORDERED_LIST);
            expect(keywords['-']).toBe(TokenType.LIST_ITEM);
            expect(keywords['- [ ]']).toBe(TokenType.CHECKLIST);
            expect(keywords['- [x]']).toBe(TokenType.CHECKLIST_CHECKED);
        });

        it('should map text formatting symbols correctly', () => {
            expect(keywords['**']).toBe(TokenType.BOLD);
            expect(keywords['_']).toBe(TokenType.ITALIC);
            expect(keywords['~~']).toBe(TokenType.STRIKETHROUGH);
        });

        it('should map code symbols correctly', () => {
            expect(keywords['`']).toBe(TokenType.INLINE_CODE);
            expect(keywords['```']).toBe(TokenType.CODE_BLOCK);
        });

        it('should map link symbols correctly', () => {
            expect(keywords['[']).toBe(TokenType.LINK_TEXT_START);
            expect(keywords[']']).toBe(TokenType.LINK_TEXT_END);
            expect(keywords['(']).toBe(TokenType.LINK_URL_START);
            expect(keywords[')']).toBe(TokenType.LINK_URL_END);
        });

        it('should map other symbols correctly', () => {
            expect(keywords['>']).toBe(TokenType.BLOCKQUOTE);
            expect(keywords['---']).toBe(TokenType.HORIZONTAL_RULE);
        });

        it('should not map undefined symbols', () => {
            expect(keywords['undefined_symbol']).toBeUndefined();
            expect(keywords['!']).toBeUndefined();
        });
    });
});