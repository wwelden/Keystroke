// LaTeX lexer. Ported from the Go package keystroke/latek/lexer.
//
// The Go lexer walks bytes; this one walks UTF-16 code units. For ASCII input
// the two are identical. See README notes in the port report for the
// (intentional) difference on non-ASCII input.

import { Token, TokenType, newToken } from './Token';

const EOF_CHAR = '\0';

export class Lexer {
    private input: string;
    private position: number;     // current position in input (points to current char)
    private readPosition: number; // current reading position in input (after current char)
    private ch: string;           // current char under examination ('\0' at EOF)

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

    // Comparison helper that avoids TypeScript narrowing `ch` across readChar() calls.
    private chIs(c: string): boolean {
        return this.ch === c;
    }

    private peekChar(): string {
        if (this.readPosition >= this.input.length) {
            return EOF_CHAR;
        }
        return this.input[this.readPosition];
    }

    nextToken(): Token {
        let tok: Token;

        this.skipWhitespace();

        switch (this.ch) {
            case '\\':
                if (this.peekChar() === '\\') {
                    // Line break \\
                    this.readChar();
                    tok = newToken(TokenType.LINEBREAK, '\\\\');
                } else {
                    // LaTeX command
                    return this.readCommand();
                }
                break;
            case '{':
                tok = newToken(TokenType.LBRACE, this.ch);
                break;
            case '}':
                tok = newToken(TokenType.RBRACE, this.ch);
                break;
            case '[':
                tok = newToken(TokenType.LBRACKET, this.ch);
                break;
            case ']':
                tok = newToken(TokenType.RBRACKET, this.ch);
                break;
            case '&':
                tok = newToken(TokenType.AMPERSAND, this.ch);
                break;
            case '$':
                if (this.peekChar() === '$') {
                    // Display math $$
                    this.readChar();
                    tok = newToken(TokenType.MATH_DISPLAY, '$$');
                } else {
                    // Inline math $
                    tok = newToken(TokenType.MATH_INLINE, '$');
                }
                break;
            case '^':
                tok = newToken(TokenType.CARET, this.ch);
                break;
            case '_':
                tok = newToken(TokenType.UNDERSCORE, this.ch);
                break;
            case '%':
                // Comment - read until end of line
                return this.readComment();
            case '\n':
                tok = newToken(TokenType.NEWLINE, this.ch);
                break;
            case EOF_CHAR:
                tok = newToken(TokenType.EOF, '');
                break;
            default:
                if (isLetter(this.ch) || isDigit(this.ch) || isText(this.ch)) {
                    return newToken(TokenType.TEXT, this.readText());
                }
                tok = newToken(TokenType.ILLEGAL, this.readIllegal());
        }

        this.readChar();
        return tok;
    }

    /**
     * Returns the current character as an ILLEGAL literal. Unlike Go (which
     * emits one token per byte and re-encodes each byte as a Latin-1 rune,
     * producing mojibake), a surrogate pair is kept together so the original
     * character survives. Leaves the lexer on the last code unit consumed.
     */
    private readIllegal(): string {
        const ch = this.ch;
        const code = ch.charCodeAt(0);
        if (code >= 0xd800 && code <= 0xdbff) {
            const next = this.peekChar();
            const nextCode = next.charCodeAt(0);
            if (nextCode >= 0xdc00 && nextCode <= 0xdfff) {
                this.readChar();
                return ch + next;
            }
        }
        return ch;
    }

    private readCommand(): Token {
        const position = this.position;
        this.readChar(); // skip '\'

        const commandName = this.readIdentifier();
        const fullCommand = this.input.slice(position, this.position);

        return newToken(this.getCommandType(commandName), fullCommand);
    }

    private getCommandType(commandName: string): TokenType {
        switch (commandName) {
            case 'section': return TokenType.SECTION;
            case 'subsection': return TokenType.SUBSECTION;
            case 'subsubsection': return TokenType.SUBSUBSECTION;
            case 'paragraph': return TokenType.PARAGRAPH;
            case 'subparagraph': return TokenType.SUBPARAGRAPH;
            case 'textbf': return TokenType.TEXTBF;
            case 'textit': return TokenType.TEXTIT;
            case 'underline': return TokenType.UNDERLINE;
            case 'sout': return TokenType.SOUT;
            case 'textsuperscript': return TokenType.TEXTSUPERSCRIPT;
            case 'textsubscript': return TokenType.TEXTSUBSCRIPT;
            case 'texttt': return TokenType.TEXTTT;
            case 'begin': return TokenType.BEGIN;
            case 'end': return TokenType.END;
            case 'item': return TokenType.ITEM;
            case 'href': return TokenType.HREF;
            case 'hrule': return TokenType.HRULE;
            case 'toprule': return TokenType.TOPRULE;
            case 'midrule': return TokenType.MIDRULE;
            case 'bottomrule': return TokenType.BOTTOMRULE;
            case 'documentclass': return TokenType.DOCUMENTCLASS;
            case 'usepackage': return TokenType.USEPACKAGE;
            default: return TokenType.COMMAND;
        }
    }

    private readIdentifier(): string {
        const position = this.position;
        while (isLetter(this.ch)) {
            this.readChar();
        }
        return this.input.slice(position, this.position);
    }

    private readText(): string {
        const position = this.position;
        while (
            this.ch !== EOF_CHAR && this.ch !== '\\' && this.ch !== '{' && this.ch !== '}' &&
            this.ch !== '[' && this.ch !== ']' && this.ch !== '&' && this.ch !== '$' &&
            this.ch !== '^' && this.ch !== '_' && this.ch !== '%' && this.ch !== '\n' &&
            !isWhitespace(this.ch)
        ) {
            this.readChar();
        }
        return this.input.slice(position, this.position);
    }

    private readComment(): Token {
        const position = this.position;
        while (this.ch !== '\n' && this.ch !== EOF_CHAR) {
            this.readChar();
        }
        return newToken(TokenType.COMMENT, this.input.slice(position, this.position));
    }

    private skipWhitespace(): void {
        while (this.ch === ' ' || this.ch === '\t' || this.ch === '\r') {
            this.readChar();
        }
    }

    /** Reads content between braces { ... }. Not used by the parser (as in Go). */
    readBraceContent(): string {
        if (!this.chIs('{')) {
            return '';
        }

        this.readChar(); // skip '{'
        const position = this.position;
        let braceCount = 1;

        while (this.ch !== EOF_CHAR && braceCount > 0) {
            if (this.ch === '{') {
                braceCount++;
            } else if (this.ch === '}') {
                braceCount--;
            }
            if (braceCount > 0) {
                this.readChar();
            }
        }

        const content = this.input.slice(position, this.position);
        if (this.ch === '}') {
            this.readChar(); // skip closing '}'
        }
        return content;
    }

    /** Reads content between brackets [ ... ]. Not used by the parser (as in Go). */
    readBracketContent(): string {
        if (!this.chIs('[')) {
            return '';
        }

        this.readChar(); // skip '['
        const position = this.position;

        while (this.ch !== ']' && this.ch !== EOF_CHAR) {
            this.readChar();
        }

        const content = this.input.slice(position, this.position);
        if (this.ch === ']') {
            this.readChar(); // skip ']'
        }
        return content;
    }

    /** Reads content up to the given math delimiter. Not used by the parser (as in Go). */
    readMathContent(delimiter: string): string {
        const position = this.position;

        if (delimiter === '$$') {
            while (this.ch !== EOF_CHAR) {
                if (this.ch === '$' && this.peekChar() === '$') {
                    break;
                }
                this.readChar();
            }
            const content = this.input.slice(position, this.position);
            if (this.ch === '$') {
                this.readChar(); // skip first $
                this.readChar(); // skip second $
            }
            return content;
        }

        while (this.ch !== '$' && this.ch !== EOF_CHAR) {
            this.readChar();
        }
        const content = this.input.slice(position, this.position);
        if (this.ch === '$') {
            this.readChar(); // skip $
        }
        return content;
    }
}

export function isLetter(ch: string): boolean {
    return ('a' <= ch && ch <= 'z') || ('A' <= ch && ch <= 'Z');
}

export function isDigit(ch: string): boolean {
    return '0' <= ch && ch <= '9';
}

export function isWhitespace(ch: string): boolean {
    return ch === ' ' || ch === '\t' || ch === '\r';
}

export function isText(ch: string): boolean {
    // Printable ASCII that is not a LaTeX special character
    const code = ch.charCodeAt(0);
    return code >= 32 && code <= 126 && ch !== '\\' && ch !== '{' && ch !== '}' &&
        ch !== '[' && ch !== ']' && ch !== '&' && ch !== '$' && ch !== '^' &&
        ch !== '_' && ch !== '%';
}
