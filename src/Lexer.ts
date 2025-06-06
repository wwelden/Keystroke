import { Token, TokenType } from "./Token";

export class Lexer {
    private input: string;
    private position: number;      // current position in input (points to current char)
    private readPosition: number;  // current reading position in input (after current char)
    private ch: string;           // current char under examination

    constructor(input: string) {
        this.input = input;
        this.position = 0;
        this.readPosition = 0;
        this.ch = '';
        this.readChar(); // Initialize the first character
    }

    private readChar(): void {
        if (this.readPosition >= this.input.length) {
            this.ch = '\0';  // EOF character
        } else {
            this.ch = this.input[this.readPosition];
        }
        this.position = this.readPosition;
        this.readPosition++;
    }

    private peekChar(): string {
        if (this.readPosition >= this.input.length) {
            return '\0';
        } else {
            return this.input[this.readPosition];
        }
    }
    private skipWhitespace(): void {
        // Only skip newlines and tabs, preserve spaces
        while (this.ch === '\t' || this.ch === '\n' || this.ch === '\r') {
            this.readChar();
        }
    }

    private readIdentifier(): string {
        const position = this.position;
        while (this.isLetter(this.ch)) {
            this.readChar();
        }
        return this.input.slice(position, this.position);
    }

    private isLetter(ch: string): boolean {
        return 'a' <= ch && ch <= 'z' || 'A' <= ch && ch <= 'Z' || ch === '_';
    }

    private readNumber(): string {
        const position = this.position;
        while (this.isDigit(this.ch)) {
            this.readChar();
        }
        return this.input.slice(position, this.position);
    }

    private isDigit(ch: string): boolean {
        return '0' <= ch && ch <= '9';
    }

    private readText(): string {
        const position = this.position;
        while (
            this.ch !== '\0' &&
            this.ch !== '\n' &&
            this.ch !== '\r' &&
            this.ch !== '#' &&
            this.ch !== '*' &&
            this.ch !== '_' &&
            this.ch !== '~' &&
            this.ch !== '`' &&
            this.ch !== '[' &&
            this.ch !== ']' &&
            this.ch !== '(' &&
            this.ch !== ')' &&
            this.ch !== '>' &&
            this.ch !== ' ' &&  // Count space as a separator
            this.ch !== '^' &&  // Add superscript separator
            this.ch !== '$' &&  // Add math separator
            !(this.ch === 'x' &&
              this.position > 2 &&
              this.input[this.position - 1] === '[' &&
              this.input[this.position - 2] === ' ' &&
              this.input[this.position - 3] === '-') &&
            this.ch !== '-'
        ) {
            if (this.isDigit(this.ch)) {
                this.readNumber();
            } else {
                this.readChar();
            }
        }
        return this.input.slice(position, this.position);
    }

    public nextToken(): Token {
        let token = new Token(TokenType.ILLEGAL, this.ch);



        // Handle space before the switch statement
        if (this.ch === ' ') {
            token = new Token(TokenType.SPACE, this.ch);
            this.readChar();
            return token;
        }

        switch (this.ch) {
            case '#':
                let hashCount = 1;
                while (this.peekChar() === '#' && hashCount < 6) {
                    this.readChar();
                    hashCount++;
                }

                const headerSymbol = '#'.repeat(hashCount);
                switch (hashCount) {
                    case 1:
                        token = new Token(TokenType.HEADER1, headerSymbol);
                        break;
                    case 2:
                        token = new Token(TokenType.HEADER2, headerSymbol);
                        break;
                    case 3:
                        token = new Token(TokenType.HEADER3, headerSymbol);
                        break;
                    case 4:
                        token = new Token(TokenType.HEADER4, headerSymbol);
                        break;
                    case 5:
                        token = new Token(TokenType.HEADER5, headerSymbol);
                        break;
                    case 6:
                        token = new Token(TokenType.HEADER6, headerSymbol);
                        break;
                }
                break;
            case '*':
                if (this.peekChar() === '*') {
                    this.readChar();
                    token = new Token(TokenType.BOLD, '**');
                } else {
                    // Simple heuristic: if followed by space, treat as list marker
                    // This covers most common cases including indented lists
                    const nextChar = this.peekChar();
                    if (nextChar === ' ') {
                        token = new Token(TokenType.UNORDERED_LIST, this.ch);
                    } else {
                        // Otherwise treat as italic
                        token = new Token(TokenType.ITALIC, this.ch);
                    }
                }
                break;
            case '_':
                if (this.peekChar() === '_') {
                    this.readChar();
                    token = new Token(TokenType.ITALIC, '__');
                } else {
                    token = new Token(TokenType.ITALIC, '_');
                }
                break;
            case '~':
                if (this.peekChar() === '~') {
                    this.readChar();
                    token = new Token(TokenType.STRIKETHROUGH, '~~');
                } else {
                    token = new Token(TokenType.SUBSCRIPT, '~');
                }
                break;
            case '`':
                let backtickCount = 1;
                while (this.peekChar() === '`' && backtickCount < 3) {
                    this.readChar();
                    backtickCount++;
                }
                token = new Token(TokenType.INLINE_CODE, '`'.repeat(backtickCount));
                break;
            case '[':
                token = new Token(TokenType.LEFT_BRACKET, this.ch);
                break;
            case ']':
                token = new Token(TokenType.RIGHT_BRACKET, this.ch);
                break;
            case '(':
                token = new Token(TokenType.LEFT_PARENTHESIS, this.ch);
                break;
            case ')':
                token = new Token(TokenType.RIGHT_PARENTHESIS, this.ch);
                break;
            case '{':
                token = new Token(TokenType.LEFT_BRACE, this.ch);
                break;
            case '}':
                token = new Token(TokenType.RIGHT_BRACE, this.ch);
                break;
            case '>':
                token = new Token(TokenType.BLOCKQUOTE, this.ch);
                break;
            case '$':
                token = new Token(TokenType.MATH, this.ch);
                break;
            case '^':
                token = new Token(TokenType.SUPERSCRIPT, this.ch);
                break;
            case '-':
                let dashCount = 1;
                while (this.peekChar() === '-' && dashCount < 3) {
                    this.readChar();
                    dashCount++;
                }
                if (dashCount === 3) {
                    token = new Token(TokenType.HORIZONTAL_RULE, '---');
                } else {
                    // Check for checkboxes after the dash
                    if (this.peekChar() === ' ') {
                        this.readChar(); // consume space
                        if (this.peekChar() === '[') {
                            this.readChar(); // consume [
                            const nextChar = this.peekChar();
                            if (nextChar === ' ' || nextChar === 'x') {
                                this.readChar(); // consume space or x
                                if (this.peekChar() === ']') {
                                    this.readChar(); // consume ]
                                    token = new Token(
                                        nextChar === 'x' ? TokenType.CHECKLIST_CHECKED : TokenType.CHECKLIST,
                                        nextChar === 'x' ? '- [x]' : '- [ ]'
                                    );
                                    break;
                                }
                            }
                        }
                    }
                    token = new Token(TokenType.LIST_ITEM, this.ch);
                    break;
                }
                break;
            // case '1':
            //     if (this.peekChar() === '.') {
            //         if (this.peekChar() === ' ') {
            //             this.readChar();
            //             token = new Token(TokenType.ORDERED_LIST, '1.');
            //         }
            //     }
            //     break;
            case '\n':
                token = new Token(TokenType.NEWLINE, this.ch);
                break;
            case ' ':
                token = new Token(TokenType.SPACE, this.ch);
                break;
            case '\t':
                token = new Token(TokenType.TAB, this.ch);
                break;
            default:
                if (this.ch === '\0') {
                    token = new Token(TokenType.EOF, '');
                } else {
                    const text = this.readText();
                    if (text) {
                        return new Token(TokenType.TEXT, text);
                    }
                }
                break;
        }
        this.readChar();
        return token;
    }
}
