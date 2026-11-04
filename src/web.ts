// Browser entry point for the Keystroke playground.
// Bundled to public/js/keystroke.js via `bun run build:web`.
import { Lexer } from './Lexer';
import { Parser } from './Parser';
import { Renderer } from './Renderer';
import { MarkdownNode } from './Ast';
import { Token, TokenType } from './Token';

export function compile(markdown: string): string {
    const parser = new Parser(new Lexer(markdown));
    return new Renderer().render(parser.parse());
}

export function tokenize(markdown: string): Token[] {
    const lexer = new Lexer(markdown);
    const tokens: Token[] = [];
    for (let i = 0; i < 100000; i++) {
        const token = lexer.nextToken();
        tokens.push(token);
        if (token.type === TokenType.EOF) break;
    }
    return tokens;
}

export function parse(markdown: string): MarkdownNode {
    return new Parser(new Lexer(markdown)).parse();
}

(window as any).Keystroke = { compile, tokenize, parse };
