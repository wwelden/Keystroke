// LaTeX parser. Ported from the Go package keystroke/latek/parser.
// Builds a DocumentNode from the token stream produced by the Lexer.

import { Lexer } from './Lexer';
import { Token, TokenType, newToken } from './Token';
import {
    Node,
    DocumentNode,
    SectionNode,
    TextNode,
    CommandNode,
    EnvironmentNode,
    ItemNode,
    TableRowNode,
    TableCellNode,
    MathNode,
    CommentNode,
} from './Ast';

export class Parser {
    private lexer: Lexer;
    private curToken: Token;
    private peekToken: Token;
    private errors: string[];
    // Whitespace just inside the braces of the last argument read by
    // readBraceContent; it belongs outside an inline command's content.
    private braceLeadingSpace = false;
    private braceTrailingSpace = false;

    constructor(lexer: Lexer) {
        this.lexer = lexer;
        this.errors = [];
        this.curToken = newToken(TokenType.ILLEGAL, '');
        this.peekToken = newToken(TokenType.ILLEGAL, '');

        // Read two tokens, so curToken and peekToken are both set
        this.nextToken();
        this.nextToken();
    }

    private nextToken(): void {
        this.curToken = this.peekToken;
        this.peekToken = this.lexer.nextToken();
    }

    getErrors(): string[] {
        return this.errors;
    }

    private peekError(t: TokenType): void {
        this.errors.push(`expected next token to be ${t}, got ${this.peekToken.type} instead`);
    }

    parseDocument(): DocumentNode {
        const children: Node[] = [];
        let pendingSpace = false;

        while (!this.curTokenIs(TokenType.EOF)) {
            const start = this.curToken;
            pendingSpace = this.appendElement(children, this.parseElement(), start, pendingSpace);
            if (!this.stoppedOnTerminator(start)) {
                this.nextToken();
            }
        }

        return new DocumentNode(children);
    }

    /**
     * Appends `node` (if any) to `children`, inserting a single space when
     * whitespace separated it from the previous inline sibling. Returns the
     * pending-space state for the next element: true when `node` was skipped
     * whitespace (a newline) that should still separate the next element.
     */
    private appendElement(children: Node[], node: Node | null, start: Token, pendingSpace: boolean): boolean {
        const space = pendingSpace || start.spaceBefore;
        if (node === null) {
            return space || start.type === TokenType.NEWLINE;
        }
        // \textbf{ a } spaces its content from its neighbours like "\textbf{a}" with spaces outside
        const isCommand = node instanceof CommandNode;
        const prev = children[children.length - 1];
        if ((space || (isCommand && this.braceLeadingSpace)) && prev !== undefined && isInline(prev) && isInline(node)) {
            children.push(new TextNode(' '));
        }
        children.push(node);
        return isCommand && this.braceTrailingSpace;
    }

    /**
     * True when parsing an element advanced onto an \item or \end that it
     * left for the enclosing loop to handle; that loop must not skip past it.
     */
    private stoppedOnTerminator(start: Token): boolean {
        return this.curToken !== start && (this.curTokenIs(TokenType.ITEM) || this.curTokenIs(TokenType.END));
    }

    private parseElement(): Node | null {
        this.braceLeadingSpace = false;
        this.braceTrailingSpace = false;
        switch (this.curToken.type) {
            case TokenType.SECTION:
                return this.parseSection(1);
            case TokenType.SUBSECTION:
                return this.parseSection(2);
            case TokenType.SUBSUBSECTION:
                return this.parseSection(3);
            case TokenType.PARAGRAPH:
                return this.parseSection(4);
            case TokenType.SUBPARAGRAPH:
                return this.parseSection(5);
            case TokenType.TEXTBF:
            case TokenType.TEXTIT:
            case TokenType.UNDERLINE:
            case TokenType.SOUT:
            case TokenType.TEXTSUPERSCRIPT:
            case TokenType.TEXTSUBSCRIPT:
            case TokenType.TEXTTT:
                return this.parseCommand();
            case TokenType.BEGIN:
                return this.parseEnvironment();
            case TokenType.ITEM:
                return this.parseItem();
            case TokenType.HREF:
                return this.parseHref();
            case TokenType.LINEBREAK:
                return this.parseLineBreak();
            case TokenType.HRULE:
                return this.parseHrule();
            case TokenType.MATH_INLINE:
                return this.parseMath(false);
            case TokenType.MATH_DISPLAY:
                return this.parseMath(true);
            case TokenType.TEXT:
                return this.parseText();
            case TokenType.COMMENT:
                return this.parseComment();
            case TokenType.DOCUMENTCLASS:
            case TokenType.USEPACKAGE:
                // Skip document preamble for now
                this.skipToEndOfCommand();
                return null;
            case TokenType.NEWLINE:
            case TokenType.WHITESPACE:
                return null;
            default:
                return this.parseText();
        }
    }

    private parseSection(level: number): Node {
        let title = '';
        if (this.expectPeek(TokenType.LBRACE)) {
            title = this.readBraceContent();
        }
        return new SectionNode(level, title);
    }

    private parseCommand(): Node {
        const commandType = this.curToken.type;
        const command = this.curToken.literal;

        let value = '';
        let options = '';

        // Optional parameters [...]; leaves curToken on the closing ']'
        if (this.peekTokenIs(TokenType.LBRACKET)) {
            this.nextToken();
            options = this.readBracketContent();
        }

        // Mandatory parameter {...}
        if (this.expectPeek(TokenType.LBRACE)) {
            value = this.readBraceContent();
        }

        return new CommandNode(commandType, command, value, options);
    }

    private parseEnvironment(): Node | null {
        if (!this.expectPeek(TokenType.LBRACE)) {
            return null;
        }

        const envName = this.readBraceContent();
        const envType = this.getEnvironmentType(envName);

        let options = '';
        if (this.peekTokenIs(TokenType.LBRACKET)) {
            this.nextToken();
            options = this.readBracketContent();
        }

        const env = new EnvironmentNode(envType, envName, options);

        if (envName === 'lstlisting') {
            this.parseVerbatimContent(env);
            return env;
        }

        // Parse environment content until \end{environment}
        this.nextToken();
        let pendingSpace = false;
        while (!this.curTokenIs(TokenType.EOF)) {
            if (this.curToken.type === TokenType.END) {
                // Check if this is the matching \end
                if (this.expectPeek(TokenType.LBRACE)) {
                    const endEnvName = this.readBraceContent();
                    if (endEnvName === envName) {
                        break;
                    }
                    // Drop a stray \end{other} instead of rendering it as text
                    this.nextToken();
                    continue;
                }
            }

            const start = this.curToken;
            const node = envName === 'tabular' ? this.parseTableContent() : this.parseElement();
            pendingSpace = this.appendElement(env.children, node, start, pendingSpace);
            if (!this.stoppedOnTerminator(start)) {
                this.nextToken();
            }
        }

        return env;
    }

    /**
     * Reads the environment body verbatim up to \end{name}, keeping spaces and
     * line breaks. The line break after \begin{name}[...] and the one before
     * \end{name} are not part of the content.
     */
    private parseVerbatimContent(env: EnvironmentNode): void {
        // curToken is the '}' or ']' that closes the \begin line
        const start = this.curToken.position + this.curToken.literal.length;
        const raw = this.lexer.readVerbatim(start, '\\end{' + env.environment + '}');
        const content = raw.replace(/^[ \t]*\r?\n/, '').replace(/\r?\n[ \t]*$/, '');
        if (content !== '') {
            env.children.push(new TextNode(content));
        }

        // Resume after \end{name}; curToken stands in for its closing '}'
        this.curToken = newToken(TokenType.RBRACE, '}');
        this.peekToken = this.lexer.nextToken();
    }

    private parseTableContent(): Node | null {
        // Cells separated by &, rows by \\
        if (this.curToken.type === TokenType.LINEBREAK) {
            return null; // Empty row
        }

        const row = new TableRowNode();
        let cell = new TableCellNode(false);
        let pendingSpace = false;

        while (!this.curTokenIs(TokenType.EOF) && !this.curTokenIs(TokenType.LINEBREAK) && !this.curTokenIs(TokenType.END)) {
            if (this.curToken.type === TokenType.AMPERSAND) {
                // End current cell, start new one
                row.cells.push(cell);
                row.children.push(cell);
                cell = new TableCellNode(false);
                pendingSpace = false;
            } else {
                const start = this.curToken;
                pendingSpace = this.appendElement(cell.children, this.parseElement(), start, pendingSpace);
                if (this.stoppedOnTerminator(start)) {
                    continue;
                }
            }
            this.nextToken();
        }

        // Add the last cell
        if (cell.children.length > 0 || row.cells.length > 0) {
            row.cells.push(cell);
            row.children.push(cell);
        }

        // Whitespace after the final \\ is not a row
        return row.cells.length > 0 ? row : null;
    }

    private parseItem(): Node {
        const item = new ItemNode();

        // Parse content until next \item or end of environment
        this.nextToken();
        let pendingSpace = false;
        while (!this.curTokenIs(TokenType.EOF) && !this.curTokenIs(TokenType.ITEM) && !this.curTokenIs(TokenType.END)) {
            const start = this.curToken;
            pendingSpace = this.appendElement(item.children, this.parseElement(), start, pendingSpace);
            if (this.curTokenIs(TokenType.EOF) || this.curTokenIs(TokenType.ITEM) || this.curTokenIs(TokenType.END)) {
                break;
            }
            this.nextToken();
        }

        // The current token is left on \item, \end or EOF for the caller
        return item;
    }

    private parseHref(): Node {
        let url = '';
        let text = '';

        if (this.expectPeek(TokenType.LBRACE)) {
            url = this.readBraceContent();
        }
        if (this.expectPeek(TokenType.LBRACE)) {
            text = this.readBraceContent();
        }

        return new CommandNode(TokenType.HREF, 'href', text, url);
    }

    private parseLineBreak(): Node {
        return new CommandNode(TokenType.LINEBREAK, '\\\\', '', '');
    }

    private parseHrule(): Node {
        return new CommandNode(TokenType.HRULE, 'hrule', '', '');
    }

    private parseMath(isDisplay: boolean): Node {
        const endTokenType = isDisplay ? TokenType.MATH_DISPLAY : TokenType.MATH_INLINE;
        let content = '';

        // Move past the opening delimiter
        this.nextToken();

        // Read until the closing delimiter (left as curToken for the caller)
        while (!this.curTokenIs(TokenType.EOF) && !this.curTokenIs(endTokenType)) {
            if (this.curToken.spaceBefore && content !== '') {
                content += ' ';
            }
            content += this.curToken.literal;
            this.nextToken();
        }

        return new MathNode(content, isDisplay);
    }

    private parseText(): Node {
        return new TextNode(this.curToken.literal);
    }

    private parseComment(): Node {
        return new CommentNode(this.curToken.literal);
    }

    private getEnvironmentType(envName: string): TokenType {
        switch (envName) {
            case 'itemize': return TokenType.ITEMIZE;
            case 'enumerate': return TokenType.ENUMERATE;
            case 'tabular': return TokenType.TABULAR;
            case 'quote': return TokenType.QUOTE;
            case 'lstlisting': return TokenType.LSTLISTING;
            default: return TokenType.BEGIN; // Generic environment
        }
    }

    private readBraceContent(): string {
        // curToken must be LBRACE; content is rebuilt from tokens
        if (this.curToken.type !== TokenType.LBRACE) {
            return '';
        }

        let content = '';
        let braceCount = 1;

        this.nextToken(); // Move past opening brace
        this.braceLeadingSpace = this.curToken.spaceBefore && !this.curTokenIs(TokenType.RBRACE);
        this.braceTrailingSpace = false;

        while (!this.curTokenIs(TokenType.EOF) && braceCount > 0) {
            if (this.curToken.type === TokenType.LBRACE) {
                braceCount++;
            } else if (this.curToken.type === TokenType.RBRACE) {
                braceCount--;
                if (braceCount === 0) {
                    this.braceTrailingSpace = this.curToken.spaceBefore;
                }
            }
            if (braceCount > 0) {
                // Re-insert the whitespace the lexer skipped before this token
                if (this.curToken.spaceBefore && content !== '') {
                    content += ' ';
                }
                content += this.curToken.literal;
                this.nextToken();
            }
        }

        return content;
    }

    private readBracketContent(): string {
        if (this.curToken.type !== TokenType.LBRACKET) {
            return '';
        }

        let content = '';
        this.nextToken(); // Move past opening bracket

        while (!this.curTokenIs(TokenType.EOF) && !this.curTokenIs(TokenType.RBRACKET)) {
            if (this.curToken.spaceBefore && content !== '') {
                content += ' ';
            }
            content += this.curToken.literal;
            this.nextToken();
        }

        // The closing bracket is left as curToken for the caller
        return content;
    }

    private skipToEndOfCommand(): void {
        // Skip optional parameters
        while (this.peekTokenIs(TokenType.LBRACKET)) {
            this.nextToken();
            this.readBracketContent();
        }

        // Skip mandatory parameters
        while (this.peekTokenIs(TokenType.LBRACE)) {
            this.nextToken();
            this.readBraceContent();
        }
    }

    private curTokenIs(t: TokenType): boolean {
        return this.curToken.type === t;
    }

    private peekTokenIs(t: TokenType): boolean {
        return this.peekToken.type === t;
    }

    private expectPeek(t: TokenType): boolean {
        if (this.peekTokenIs(t)) {
            this.nextToken();
            return true;
        }
        this.peekError(t);
        return false;
    }
}

/** Nodes that flow inline with text, so whitespace between them is kept. */
function isInline(node: Node): boolean {
    if (node instanceof TextNode) {
        return true;
    }
    if (node instanceof MathNode) {
        return !node.isDisplay;
    }
    if (node instanceof CommandNode) {
        return node.type !== TokenType.LINEBREAK && node.type !== TokenType.HRULE;
    }
    return false;
}
