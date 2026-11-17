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

    // Returns the next token: a tag, a text run (whitespace and all, entities
    // decoded), or EOF. Tags without a LaTeX mapping lex as TAG_OPEN / TAG_CLOSE.
    public nextToken(): Token {
        if (this.ch === EOF_CHAR) {
            return newToken(TokenType.EOF, '');
        }

        if (!this.atTagStart()) {
            return newToken(TokenType.TEXT, this.readTextRun());
        }

        let tok: Token;
        if (this.peekChar() === '/') {
            this.readChar();
            tok = this.readClosingTag();
        } else {
            tok = this.readOpeningTag();
        }
        this.readChar(); // skip '>'
        return tok;
    }

    // A '<' only starts a tag when followed by a letter, '/' or '!' (comments,
    // doctype); otherwise it is literal text, as in "1 < 2".
    private atTagStart(): boolean {
        if (this.ch !== '<') {
            return false;
        }
        const next = this.peekChar();
        return isLetter(next) || next === '/' || next === '!';
    }

    private readOpeningTag(): Token {
        const position = this.position;

        // Comment: runs to "-->" (it may contain '>'); leave the final '>' for nextToken
        if (this.input.startsWith('<!--', position)) {
            const end = this.input.indexOf('-->', position + 2);
            const last = end === -1 ? this.input.length : end + 2;
            while (this.position < last && this.ch !== EOF_CHAR) {
                this.readChar();
            }
            return newToken(TokenType.TAG_OPEN, this.input.slice(position, this.readPosition));
        }

        this.readChar(); // skip '<'

        const tagName = this.readTagName();

        this.skipWhitespace();

        // Self-closing tag: leave the final '>' for nextToken to consume
        if (this.ch === '/' && this.peekChar() === '>') {
            this.readChar(); // skip '/'
            return newToken(this.tagTokenType(tagName, TokenType.TAG_OPEN), this.input.slice(position, this.readPosition));
        }

        // A '>' inside a quoted attribute value is not the end of the tag.
        // Comments and <!...> declarations have no attributes, so they end at the first '>'.
        const isDeclaration = this.input[position + 1] === '!';
        let quote = '';
        while (this.ch !== EOF_CHAR) {
            if (isDeclaration) {
                if (this.ch === '>') break;
            } else if (quote !== '') {
                if (this.ch === quote) quote = '';
            } else if (this.ch === '"' || this.ch === "'") {
                quote = this.ch;
            } else if (this.ch === '>') {
                break;
            }
            this.readChar();
        }

        return newToken(this.tagTokenType(tagName, TokenType.TAG_OPEN), this.input.slice(position, this.readPosition));
    }

    private readClosingTag(): Token {
        const position = this.position - 1; // Include the '<' before '/'

        this.readChar(); // skip '/'

        const tagName = this.readTagName();

        // Skip to '>'
        while (this.ch !== '>' && this.ch !== EOF_CHAR) {
            this.readChar();
        }

        return newToken(this.tagTokenType(tagName, TokenType.TAG_CLOSE), this.input.slice(position, this.readPosition));
    }

    // Like getTokenTypeFromTag, but unknown tags get `unknown` instead of TEXT
    private tagTokenType(tagName: string, unknown: TokenType): TokenType {
        const type = this.getTokenTypeFromTag(tagName);
        return type === TokenType.TEXT ? unknown : type;
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

    // Reads text up to the next tag, decoding HTML entities and keeping whitespace
    private readTextRun(): string {
        let result = '';

        while (this.ch !== EOF_CHAR && !this.atTagStart()) {
            if (this.ch === '&') {
                result += this.readHTMLEntity();
            } else {
                result += this.ch;
                this.readChar();
            }
        }

        return result;
    }

    // Reads content between HTML tags, decoding HTML entities and trimming whitespace
    public readTextContent(): string {
        return trimSpace(this.readTextRun());
    }

    private readHTMLEntity(): string {
        const position = this.position;
        this.readChar(); // skip '&'

        // A candidate ends at ';'; '<', '&' or whitespace means this '&' is literal
        while (this.ch !== ';' && this.ch !== '<' && this.ch !== '&' && !/\s/.test(this.ch) &&
            this.ch !== EOF_CHAR && this.position - position < 10) {
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
