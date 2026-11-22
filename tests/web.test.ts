import { compile, parse, render, tokenize } from '../src/web';
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

describe('web render', () => {
    // The playground renders the AST it parsed, so the drawer can reuse it.
    test('render(parse(md)) matches compile(md)', () => {
        const md = '# Title\n\nSome **bold** and $x^2$, a [link](https://example.com), and $5.\n\n- [ ] task\n> quote\n\n```js\ncode\n```\n';
        expect(render(parse(md))).toBe(compile(md));
    });
});
