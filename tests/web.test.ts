import { tokenize } from '../src/web';
import { TokenType } from '../src/Token';

describe('web tokenize', () => {
    test('returns the whole stream for long documents (#73)', () => {
        const tokens = tokenize('x '.repeat(50001) + 'END');
        expect(tokens.length).toBeGreaterThan(100000);
        expect(tokens[tokens.length - 2]).toMatchObject({ type: TokenType.TEXT, literal: 'END' });
        expect(tokens[tokens.length - 1].type).toBe(TokenType.EOF);
    });

    test('ends short documents with a single EOF', () => {
        const tokens = tokenize('hi');
        expect(tokens.map(t => t.type)).toEqual([TokenType.TEXT, TokenType.EOF]);
    });
});
