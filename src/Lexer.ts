import { Token, TokenType } from "./Token";

export class Lexer {
    private input: string;
    private position: number;      // current position in input (points to current char)
    private readPosition: number;  // current reading position in input (after current char)
    private ch: string;           // current char under examination
    // True until the first non-space/tab token of a line. Block markers
    // (headers, blockquotes, lists, rules, checklists) only count here.
    private atLineStart: boolean = true;

    constructor(input: string) {
        this.input = input;
        this.position = 0;
        this.readPosition = 0;
        this.ch = '';
        this.readChar(); // Initialize the first character
    }

    /** Opaque read position, so a parser can look ahead and rewind with restoreState. */
    public saveState(): [number, number, string, boolean] {
        return [this.position, this.readPosition, this.ch, this.atLineStart];
    }

    public restoreState([position, readPosition, ch, atLineStart]: [number, number, string, boolean]): void {
        this.position = position;
        this.readPosition = readPosition;
        this.ch = ch;
        this.atLineStart = atLineStart;
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
        const token = this.readToken();
        // A code block consumes its closing fence's newline, so the next
        // token starts a line too.
        if (token.type === TokenType.NEWLINE || token.type === TokenType.CODE_BLOCK) {
            this.atLineStart = true;
        } else if (token.type !== TokenType.SPACE && token.type !== TokenType.TAB) {
            this.atLineStart = false;
        }
        return token;
    }

    // Reads a run of `ch` starting at the current char, leaving the last one
    // as the current char (readToken advances past it).
    private readRun(ch: string): string {
        let run = this.ch;
        while (this.peekChar() === ch) {
            this.readChar();
            run += ch;
        }
        return run;
    }

    // True when a block-marker char should be plain text. Off line start:
    // `C# is great`, `a > b`, `well-known`, `x - y`. At line start: `#tag`.
    // (`*` is handled in readToken.)
    private isMarkerAsText(): boolean {
        if (this.atLineStart) {
            // `#` opens a header only when followed by a space or end of line.
            if (this.ch !== '#') return false;
            let i = this.position;
            while (this.input[i] === '#') i++;
            const after = this.input[i];
            return i - this.position > 6 || !(after === undefined || after === ' ' ||
                after === '\t' || after === '\n' || after === '\r');
        }
        return this.ch === '#' || this.ch === '>' || this.ch === '-';
    }

    // At line start, a run of 3+ backticks indented 0-3 spaces opens a fenced
    // code block. The token's literal is the raw content up to a closing fence
    // of at least the same length (or EOF), with up to the opener's indent
    // removed from each line, and its language is the info string's first
    // word. Returns null when the line isn't a fence (deeper or tab indent,
    // backticks in the info string), leaving the lexer where it was.
    private readFencedCode(): Token | null {
        const input = this.input;
        const lineStart = input.lastIndexOf('\n', this.position - 1) + 1;
        const indent = this.position - lineStart;
        if (indent > 3 || !/^ *$/.test(input.slice(lineStart, this.position))) return null;
        const dedent = new RegExp(`^ {0,${indent}}`);

        let i = this.position;
        while (input[i] === '`') i++;
        const fenceLength = i - this.position;
        if (fenceLength < 3) return null;

        let lineEnd = input.indexOf('\n', i);
        if (lineEnd === -1) lineEnd = input.length;
        const info = input.slice(i, lineEnd).trim();
        if (info.includes('`')) return null;

        let content = '';
        let pos = lineEnd + 1;
        let resume = input.length;
        while (pos < input.length) {
            let end = input.indexOf('\n', pos);
            if (end === -1) end = input.length;
            const line = input.slice(pos, end).replace(/\r$/, '');
            const close = /^ {0,3}(`{3,})[ \t]*$/.exec(line);
            if (close && close[1].length >= fenceLength) {
                resume = end + 1;
                break;
            }
            content += line.replace(dedent, '') + '\n';
            pos = end + 1;
        }

        this.readPosition = resume;
        this.readChar();
        const language = info.split(/\s+/)[0] || undefined;
        return new Token(TokenType.CODE_BLOCK, content, language);
    }

    private readToken(): Token {
        let token = new Token(TokenType.ILLEGAL, this.ch);

        if (this.isMarkerAsText()) {
            token = new Token(TokenType.TEXT, this.readRun(this.ch));
            this.readChar();
            return token;
        }

        // Handle space before the switch statement
        if (this.ch === ' ') {
            token = new Token(TokenType.SPACE, this.ch);
            this.readChar();
            return token;
        }

        switch (this.ch) {
            case '#':
                // isMarkerAsText already turned runs longer than 6 into text.
                const headerSymbol = this.readRun('#');
                switch (headerSymbol.length) {
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
                    // At line start and followed by a space: list marker.
                    // Mid-line with spaces on both sides (`a * b`): plain text.
                    // Otherwise emphasis, including the closer in `*a* b`.
                    const next = this.peekChar();
                    const prev = this.input[this.position - 1];
                    if (this.atLineStart && next === ' ') {
                        token = new Token(TokenType.UNORDERED_LIST, this.ch);
                    } else if ((prev === ' ' || prev === '\t') &&
                        (next === ' ' || next === '\t' || next === '\n' || next === '\r' || next === '\0')) {
                        token = new Token(TokenType.TEXT, this.ch);
                    } else {
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
                if (this.atLineStart) {
                    const fence = this.readFencedCode();
                    if (fence) return fence;
                }
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
                    this.readRun('-'); // `----` and longer are one rule too
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
