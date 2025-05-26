"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lexer = void 0;
const Token_1 = require("./Token");
class Lexer {
    constructor(input) {
        this.input = input;
        this.position = 0;
        this.readPosition = 0;
        this.ch = '';
        this.readChar(); // Initialize the first character
    }
    readChar() {
        if (this.readPosition >= this.input.length) {
            this.ch = '\0'; // EOF character
        }
        else {
            this.ch = this.input[this.readPosition];
        }
        this.position = this.readPosition;
        this.readPosition++;
    }
    peekChar() {
        if (this.readPosition >= this.input.length) {
            return '\0';
        }
        else {
            return this.input[this.readPosition];
        }
    }
    skipWhitespace() {
        // Only skip newlines and tabs, preserve spaces
        while (this.ch === '\t' || this.ch === '\n' || this.ch === '\r') {
            this.readChar();
        }
    }
    readIdentifier() {
        const position = this.position;
        while (this.isLetter(this.ch)) {
            this.readChar();
        }
        return this.input.slice(position, this.position);
    }
    isLetter(ch) {
        return 'a' <= ch && ch <= 'z' || 'A' <= ch && ch <= 'Z' || ch === '_';
    }
    readNumber() {
        const position = this.position;
        while (this.isDigit(this.ch)) {
            this.readChar();
        }
        return this.input.slice(position, this.position);
    }
    isDigit(ch) {
        return '0' <= ch && ch <= '9';
    }
    readText() {
        const position = this.position;
        while (this.ch !== '\0' &&
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
            this.ch !== ' ' && // Count space as a separator
            !(this.ch === 'x' &&
                this.position > 2 &&
                this.input[this.position - 1] === '[' &&
                this.input[this.position - 2] === ' ' &&
                this.input[this.position - 3] === '-') &&
            this.ch !== '-') {
            if (this.isDigit(this.ch)) {
                this.readNumber();
            }
            else {
                this.readChar();
            }
        }
        return this.input.slice(position, this.position);
    }
    nextToken() {
        let token = new Token_1.Token(Token_1.TokenType.ILLEGAL, this.ch);
        // Handle space before the switch statement
        if (this.ch === ' ') {
            token = new Token_1.Token(Token_1.TokenType.SPACE, this.ch);
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
                        token = new Token_1.Token(Token_1.TokenType.HEADER1, headerSymbol);
                        break;
                    case 2:
                        token = new Token_1.Token(Token_1.TokenType.HEADER2, headerSymbol);
                        break;
                    case 3:
                        token = new Token_1.Token(Token_1.TokenType.HEADER3, headerSymbol);
                        break;
                    case 4:
                        token = new Token_1.Token(Token_1.TokenType.HEADER4, headerSymbol);
                        break;
                    case 5:
                        token = new Token_1.Token(Token_1.TokenType.HEADER5, headerSymbol);
                        break;
                    case 6:
                        token = new Token_1.Token(Token_1.TokenType.HEADER6, headerSymbol);
                        break;
                }
                break;
            case '*':
                if (this.peekChar() === '*') {
                    this.readChar();
                    token = new Token_1.Token(Token_1.TokenType.BOLD, '**');
                }
                else {
                    // For now, always treat single * as italic - the parser can handle the context
                    token = new Token_1.Token(Token_1.TokenType.ITALIC, this.ch);
                }
                break;
            case '_':
                if (this.peekChar() === '_') {
                    this.readChar();
                    token = new Token_1.Token(Token_1.TokenType.ITALIC, '__');
                }
                else {
                    token = new Token_1.Token(Token_1.TokenType.ITALIC, '_');
                }
                break;
            case '~':
                if (this.peekChar() === '~') {
                    this.readChar();
                    token = new Token_1.Token(Token_1.TokenType.STRIKETHROUGH, '~~');
                }
                else {
                    token = new Token_1.Token(Token_1.TokenType.SUBSCRIPT, '~');
                }
                break;
            case '`':
                let backtickCount = 1;
                while (this.peekChar() === '`' && backtickCount < 3) {
                    this.readChar();
                    backtickCount++;
                }
                token = new Token_1.Token(Token_1.TokenType.INLINE_CODE, '`'.repeat(backtickCount));
                break;
            case '[':
                token = new Token_1.Token(Token_1.TokenType.LEFT_BRACKET, this.ch);
                break;
            case ']':
                token = new Token_1.Token(Token_1.TokenType.RIGHT_BRACKET, this.ch);
                break;
            case '(':
                token = new Token_1.Token(Token_1.TokenType.LEFT_PARENTHESIS, this.ch);
                break;
            case ')':
                token = new Token_1.Token(Token_1.TokenType.RIGHT_PARENTHESIS, this.ch);
                break;
            case '{':
                token = new Token_1.Token(Token_1.TokenType.LEFT_BRACE, this.ch);
                break;
            case '}':
                token = new Token_1.Token(Token_1.TokenType.RIGHT_BRACE, this.ch);
                break;
            case '>':
                token = new Token_1.Token(Token_1.TokenType.BLOCKQUOTE, this.ch);
                break;
            case '$':
                token = new Token_1.Token(Token_1.TokenType.MATH, this.ch);
                break;
            case '^':
                token = new Token_1.Token(Token_1.TokenType.SUPERSCRIPT, this.ch);
                break;
            case '-':
                let dashCount = 1;
                while (this.peekChar() === '-' && dashCount < 3) {
                    this.readChar();
                    dashCount++;
                }
                if (dashCount === 3) {
                    token = new Token_1.Token(Token_1.TokenType.HORIZONTAL_RULE, '---');
                }
                else {
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
                                    token = new Token_1.Token(nextChar === 'x' ? Token_1.TokenType.CHECKLIST_CHECKED : Token_1.TokenType.CHECKLIST, nextChar === 'x' ? '- [x]' : '- [ ]');
                                    break;
                                }
                            }
                        }
                    }
                    token = new Token_1.Token(Token_1.TokenType.LIST_ITEM, this.ch);
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
                token = new Token_1.Token(Token_1.TokenType.NEWLINE, this.ch);
                break;
            case ' ':
                token = new Token_1.Token(Token_1.TokenType.SPACE, this.ch);
                break;
            case '\t':
                token = new Token_1.Token(Token_1.TokenType.TAB, this.ch);
                break;
            default:
                if (this.ch === '\0') {
                    token = new Token_1.Token(Token_1.TokenType.EOF, '');
                }
                else {
                    const text = this.readText();
                    if (text) {
                        return new Token_1.Token(Token_1.TokenType.TEXT, text);
                    }
                }
                break;
        }
        this.readChar();
        return token;
    }
}
exports.Lexer = Lexer;
