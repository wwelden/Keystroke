import { Token, TokenType, newToken } from "./Token";
import { trimSpace } from "./strings";

const EOF_CHAR = '\0';

// Maps lower-cased HTML tag names to their token types
const tagTokenTypes: { [tag: string]: TokenType } = {
    h1: TokenType.H1,
    h2: TokenType.H2,
    h3: TokenType.H3,
    h4: TokenType.H4,
    h5: TokenType.H5,
    h6: TokenType.H6,
    p: TokenType.P,
    div: TokenType.DIV,
    span: TokenType.SPAN,
    b: TokenType.B,
    strong: TokenType.STRONG,
    i: TokenType.I,
    em: TokenType.EM,
    u: TokenType.U,
    s: TokenType.S,
    sup: TokenType.SUP,
    sub: TokenType.SUB,
    ul: TokenType.UL,
    ol: TokenType.OL,
    li: TokenType.LI,
    a: TokenType.A,
    img: TokenType.IMG,
    code: TokenType.CODE,
    pre: TokenType.PRE,
    table: TokenType.TABLE,
    tr: TokenType.TR,
    td: TokenType.TD,
    th: TokenType.TH,
    thead: TokenType.THEAD,
    tbody: TokenType.TBODY,
    blockquote: TokenType.BLOCKQUOTE,
    hr: TokenType.HR,
    br: TokenType.BR,
};

const htmlEntities: { [entity: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
    '&nbsp;': '\u00A0', // Non-breaking space
};

export function isLetter(ch: string): boolean {
    return ('a' <= ch && ch <= 'z') || ('A' <= ch && ch <= 'Z') || ch === '_';
}

export function isDigit(ch: string): boolean {
    return '0' <= ch && ch <= '9';
}

export function isAlphaNumeric(ch: string): boolean {
    return isLetter(ch) || isDigit(ch);
}

export class Lexer {
    private input: string;
    private position: number;      // current position in input (points to current char)
    private readPosition: number;  // current reading position in input (after current char)
    private ch: string;            // current char under examination ('\0' at EOF)

    constructor(input: string) {
        this.input = input;
        this.position = 0;
        this.readPosition = 0;
        this.ch = EOF_CHAR;
        this.readChar();
    }

    private readChar(): void {
        if (this.readPosition >= this.input.length) {
            this.ch = EOF_CHAR;
        } else {
            this.ch = this.input[this.readPosition];
        }
        this.position = this.readPosition;
        this.readPosition++;
    }

    private peekChar(): string {
        if (this.readPosition >= this.input.length) {
            return EOF_CHAR;
        }
        return this.input[this.readPosition];
    }

    public nextToken(): Token {
        let tok: Token;

        this.skipWhitespace();

        switch (this.ch) {
            case '<':
                if (this.peekChar() === '/') {
                    this.readChar();
                    tok = this.readClosingTag();
                } else {
                    tok = this.readOpeningTag();
                }
                break;
            case '>':
                tok = newToken(TokenType.GT, this.ch);
                break;
            case '/':
                if (this.peekChar() === '>') {
                    this.readChar();
                    tok = newToken(TokenType.TAG_SELF_CLOSE, '/>');
                } else {
                    tok = newToken(TokenType.SLASH, this.ch);
                }
                break;
            case '=':
                tok = newToken(TokenType.EQUALS, this.ch);
                break;
            case '"':
                tok = newToken(TokenType.QUOTE, this.readString('"'));
                break;
            case "'":
                tok = newToken(TokenType.SINGLE_QUOTE, this.readString("'"));
                break;
            case '\n':
                tok = newToken(TokenType.NEWLINE, this.ch);
                break;
            case '\t':
                tok = newToken(TokenType.TAB, this.ch);
                break;
            case ' ':
                tok = newToken(TokenType.SPACE, this.ch);
                break;
            case EOF_CHAR:
                tok = newToken(TokenType.EOF, '');
                break;
            default:
                if (isLetter(this.ch)) {
                    return newToken(TokenType.TEXT, this.readIdentifier());
                } else if (isDigit(this.ch)) {
                    return newToken(TokenType.TEXT, this.readNumber());
                }
                tok = newToken(TokenType.ILLEGAL, this.ch);
        }

        this.readChar();
        return tok;
    }

    private readOpeningTag(): Token {
        const position = this.position;
        this.readChar(); // skip '<'

        const tagName = this.readTagName();

        this.skipWhitespace();

        // Self-closing tag: leave the final '>' for nextToken to consume
        if (this.ch === '/' && this.peekChar() === '>') {
            this.readChar(); // skip '/'
            return newToken(this.getTokenTypeFromTag(tagName), this.input.slice(position, this.readPosition));
        }

        // Read until '>'
        while (this.ch !== '>' && this.ch !== EOF_CHAR) {
            this.readChar();
        }

        return newToken(this.getTokenTypeFromTag(tagName), this.input.slice(position, this.readPosition));
    }

    private readClosingTag(): Token {
        const position = this.position - 1; // Include the '<' before '/'

        this.readChar(); // skip '/'

        const tagName = this.readTagName();

        // Skip to '>'
        while (this.ch !== '>' && this.ch !== EOF_CHAR) {
            this.readChar();
        }

        return newToken(this.getTokenTypeFromTag(tagName), this.input.slice(position, this.readPosition));
    }

    private readTagName(): string {
        const position = this.position;
        while (isLetter(this.ch) || isDigit(this.ch)) {
            this.readChar();
        }
        return this.input.slice(position, this.position);
    }

    public getTokenTypeFromTag(tagName: string): TokenType {
        const key = tagName.toLowerCase();
        return Object.prototype.hasOwnProperty.call(tagTokenTypes, key) ? tagTokenTypes[key] : TokenType.TEXT;
    }

    private skipWhitespace(): void {
        while (this.ch === ' ' || this.ch === '\t' || this.ch === '\n' || this.ch === '\r') {
            this.readChar();
        }
    }

    private readIdentifier(): string {
        const position = this.position;
        while (isLetter(this.ch) || isDigit(this.ch) || this.ch === '_' || this.ch === '-') {
            this.readChar();
        }
        return this.input.slice(position, this.position);
    }

    private readNumber(): string {
        const position = this.position;
        while (isDigit(this.ch)) {
            this.readChar();
        }
        return this.input.slice(position, this.position);
    }

    private readString(delimiter: string): string {
        const position = this.position + 1;
        for (;;) {
            this.readChar();
            if (this.ch === delimiter || this.ch === EOF_CHAR) {
                break;
            }
        }
        return this.input.slice(position, this.position);
    }

    private readText(): string {
        const position = this.position;
        while (this.ch !== '<' && this.ch !== EOF_CHAR) {
            this.readChar();
        }
        return trimSpace(this.input.slice(position, this.position));
    }

    // Reads content between HTML tags, decoding HTML entities
    public readTextContent(): string {
        let result = '';

        while (this.ch !== '<' && this.ch !== EOF_CHAR) {
            if (this.ch === '&') {
                result += this.readHTMLEntity();
            } else {
                result += this.ch;
                this.readChar();
            }
        }

        return trimSpace(result);
    }

    private readHTMLEntity(): string {
        const position = this.position;
        this.readChar(); // skip '&'

        while (this.ch !== ';' && this.ch !== EOF_CHAR && this.position - position < 10) {
            this.readChar();
        }

        if (this.ch === ';') {
            this.readChar(); // skip ';'
            return this.decodeHTMLEntity(this.input.slice(position, this.position));
        }

        // If no closing ';' found, return the original characters
        return this.input.slice(position, this.position);
    }

    public decodeHTMLEntity(entity: string): string {
        return Object.prototype.hasOwnProperty.call(htmlEntities, entity) ? htmlEntities[entity] : entity;
    }
}
