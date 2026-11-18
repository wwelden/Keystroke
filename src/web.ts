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

// Returns the whole stream, through EOF. The Tokens view pages long streams
// itself, so a cap here would silently drop the end of long documents.
export function tokenize(markdown: string): Token[] {
    const lexer = new Lexer(markdown);
    const tokens: Token[] = [];
    let token: Token;
    do {
        token = lexer.nextToken();
        tokens.push(token);
    } while (token.type !== TokenType.EOF);
    return tokens;
}

export function parse(markdown: string): MarkdownNode {
    return new Parser(new Lexer(markdown)).parse();
}

if (typeof window !== 'undefined') (window as any).Keystroke = { compile, tokenize, parse };
