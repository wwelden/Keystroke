import { Lexer } from "./Lexer";
import { Token, TokenType } from "./Token";
import {
    MarkdownNode,
    HeaderNode,
    Header1Node,
    Header2Node,
    Header3Node,
    Header4Node,
    Header5Node,
    Header6Node,
    ListNode,
    ListItemNode,
    ListRelatedNode,
    ChecklistNode,
    ChecklistCheckedNode,
    BlockquoteNode,
    HorizontalRuleNode,
    LinkNode,
    BoldNode,
    ItalicNode,
    StrikethroughNode,
    InlineCodeNode,
    CodeBlockNode,
    IllegalNode,
    NewlineNode,
    DocumentNode,
    SpaceNode,
    TabNode,
    MathNode,
    SuperscriptNode,
    SubscriptNode,
    TextNode
} from "./Ast";

// An unparenthesized ^ or ~ operand: an optional sign, then a number or a run
// of letters and digits.
const SCRIPT_OPERAND = /^[+-]?(?:\d*\.\d+|\d+|[\p{L}\p{N}]+)/u;
const OPERAND_START = /^(?:[\p{L}\p{N}]|\.\d)/u;

export class Parser {
    private lexer: Lexer;
    private currentToken: Token;
    private peekToken: Token;
    private peekNextToken: Token;
    private errors: string[];

        constructor(lexer: Lexer, currentToken: Token = new Token(TokenType.ILLEGAL, ''), peekToken: Token = new Token(TokenType.ILLEGAL, ''), peekNextToken: Token = new Token(TokenType.ILLEGAL, '')  ) {
        this.lexer = lexer;
        this.currentToken = currentToken;
        this.peekToken = peekToken;
        this.peekNextToken = peekNextToken;
        this.errors = [];

        // Initialize tokens if they are not provided (when only lexer is passed)
        if (this.currentToken.type === TokenType.ILLEGAL && this.currentToken.literal === '' &&
            this.peekToken.type === TokenType.ILLEGAL && this.peekToken.literal === '' &&
            this.peekNextToken.type === TokenType.ILLEGAL && this.peekNextToken.literal === '') {
            // Properly initialize all three tokens from the lexer
            this.currentToken = this.lexer.nextToken();
            this.peekToken = this.lexer.nextToken();
            this.peekNextToken = this.lexer.nextToken();
        }
    }

    public getErrors(): string[] {
        return this.errors;
    }

    private nextToken(): void {
        this.currentToken = this.peekToken;
        this.peekToken = this.peekNextToken;
        this.peekNextToken = this.lexer.nextToken();
    }

    private currentTokenIs(t: TokenType): boolean {
        return this.currentToken.type === t;
    }

    private isSpaceOrTab(token: Token): boolean {
        return token.type === TokenType.SPACE || token.type === TokenType.TAB;
    }

    private addError(msg: string): void {
        this.errors.push(msg);
    }

    private parseHeader(): HeaderNode {
        let header: HeaderNode;

        switch (this.currentToken.type) {
            case TokenType.HEADER1:
                header = new Header1Node(this.currentToken);
                break;
            case TokenType.HEADER2:
                header = new Header2Node(this.currentToken);
                break;
            case TokenType.HEADER3:
                header = new Header3Node(this.currentToken);
                break;
            case TokenType.HEADER4:
                header = new Header4Node(this.currentToken);
                break;
            case TokenType.HEADER5:
                header = new Header5Node(this.currentToken);
                break;
            case TokenType.HEADER6:
                header = new Header6Node(this.currentToken);
                break;
            default:
                this.addError(`expected header, got ${this.currentToken.type}`);
                header = new Header1Node(this.currentToken);
                break;
        }

        this.nextToken(); // Move past header token

        while (!this.currentTokenIs(TokenType.NEWLINE) && !this.currentTokenIs(TokenType.EOF)) {
            const node = this.parseInlineNode();
            if (node) {
                header.children.push(node);
            }
        }

        return header;
    }

    private isUnorderedMarker(t: TokenType): boolean {
        return t === TokenType.UNORDERED_LIST || t === TokenType.LIST_ITEM ||
            t === TokenType.CHECKLIST || t === TokenType.CHECKLIST_CHECKED;
    }

    // Groups consecutive list lines into one list: `-`, `*` and checklist
    // items into a <ul>, `1.` items into an <ol>. Like parseHeader, leaves
    // currentToken on the NEWLINE (or EOF) that ends the last item.
    private parseList(): ListNode {
        const ordered = this.currentTokenIs(TokenType.ORDERED_LIST);
        const sameList = (t: TokenType) =>
            ordered ? t === TokenType.ORDERED_LIST : this.isUnorderedMarker(t);
        const list = new ListNode(
            new Token(ordered ? TokenType.ORDERED_LIST : TokenType.UNORDERED_LIST, this.currentToken.literal),
            ordered
        );

        list.items.push(this.parseListItem());
        while (this.currentTokenIs(TokenType.NEWLINE) && sameList(this.peekToken.type)) {
            this.nextToken(); // Move past the newline onto the next marker
            list.items.push(this.parseListItem());
        }

        return list;
    }

    private parseListItem(): ListRelatedNode {
        const marker = this.currentToken;
        let item: ListRelatedNode;
        if (marker.type === TokenType.CHECKLIST) {
            item = new ChecklistNode(marker, '');
        } else if (marker.type === TokenType.CHECKLIST_CHECKED) {
            item = new ChecklistCheckedNode(marker, '');
        } else {
            item = new ListItemNode(marker, '');
        }
        this.nextToken(); // Move past the marker

        // The space after a checkbox stays, to separate it from the text.
        if (item instanceof ListItemNode) {
            while (this.isSpaceOrTab(this.currentToken)) {
                this.nextToken();
            }
        }

        this.parseLineInline(item);
        return item;
    }

    // Parses inline content into `node` up to the end of the line, leaving
    // currentToken on the NEWLINE or EOF. Tokens with no inline meaning are
    // kept as their literal text.
    private parseLineInline(node: MarkdownNode): void {
        while (!this.currentTokenIs(TokenType.NEWLINE) && !this.currentTokenIs(TokenType.EOF)) {
            switch (this.currentToken.type) {
                case TokenType.SPACE:
                    node.children.push(new SpaceNode(this.currentToken));
                    this.nextToken();
                    break;
                case TokenType.TAB:
                    node.children.push(new TabNode(this.currentToken));
                    this.nextToken();
                    break;
                case TokenType.BOLD:
                    node.children.push(this.parseBold());
                    break;
                case TokenType.ITALIC:
                    node.children.push(this.parseItalic());
                    break;
                case TokenType.STRIKETHROUGH:
                    node.children.push(this.parseStrikethrough());
                    break;
                case TokenType.LEFT_BRACKET:
                    node.children.push(this.parseLink());
                    break;
                case TokenType.INLINE_CODE:
                    node.children.push(this.parseCode());
                    break;
                case TokenType.MATH:
                    if (this.hasClosingMath(TokenType.NEWLINE)) {
                        node.children.push(this.parseMath());
                    } else {
                        // A lone $ (e.g. a price) is literal, as in parseInlineNode
                        node.children.push(this.parseText());
                        this.nextToken();
                    }
                    break;
                case TokenType.SUPERSCRIPT:
                    node.children.push(this.parseSuperscript());
                    break;
                case TokenType.SUBSCRIPT:
                    node.children.push(this.parseSubscript());
                    break;
                default:
                    node.children.push(this.parseText());
                    this.nextToken();
                    break;
            }
        }
    }

    private parseText(): TextNode {
        const text = new TextNode(this.currentToken, this.currentToken.literal);
        return text;
    }

    /**
     * Parses one inline construct inside a container (heading, blockquote,
     * emphasis, checklist item). Leaves currentToken on the first token it did
     * not consume. Returns null for tokens with no inline meaning, which are
     * skipped. Callers stop on their own closing delimiter before calling this.
     */
    private parseInlineNode(closer: TokenType = TokenType.NEWLINE): MarkdownNode | null {
        switch (this.currentToken.type) {
            case TokenType.SPACE: {
                const space = new SpaceNode(this.currentToken);
                this.nextToken();
                return space;
            }
            case TokenType.TAB: {
                const tab = new TabNode(this.currentToken);
                this.nextToken();
                return tab;
            }
            case TokenType.TEXT:
            case TokenType.LEFT_PARENTHESIS:
            case TokenType.RIGHT_PARENTHESIS: {
                const text = this.parseText();
                this.nextToken();
                return text;
            }
            case TokenType.BOLD:
                return this.parseBold();
            case TokenType.ITALIC:
                return this.parseItalic();
            case TokenType.STRIKETHROUGH:
                return this.parseStrikethrough();
            case TokenType.INLINE_CODE:
                return this.parseCode();
            case TokenType.LEFT_BRACKET:
                return this.parseLink();
            case TokenType.MATH: {
                if (this.hasClosingMath(closer)) {
                    return this.parseMath();
                }
                // A lone $ (e.g. a price) is literal and must not swallow the closer
                const dollar = this.parseText();
                this.nextToken();
                return dollar;
            }
            default:
                this.nextToken();
                return null;
        }
    }

    /**
     * True when the $ at currentToken has a closing $ before the container's
     * `closer`, the end of the line or EOF. Rewinds the lexer.
     */
    private hasClosingMath(closer: TokenType): boolean {
        const ends = (tok: Token) =>
            tok.type === closer || tok.type === TokenType.NEWLINE || tok.type === TokenType.EOF;
        for (const tok of [this.peekToken, this.peekNextToken]) {
            if (tok.type === TokenType.MATH) return true;
            if (ends(tok)) return false;
        }
        const state = this.lexer.saveState();
        let tok = this.lexer.nextToken();
        while (tok.type !== TokenType.MATH && !ends(tok)) {
            tok = this.lexer.nextToken();
        }
        this.lexer.restoreState(state);
        return tok.type === TokenType.MATH;
    }

    private parseBlockquote(): BlockquoteNode {
        const blockquote = new BlockquoteNode(this.currentToken, '');
        this.nextToken(); // Move past >

        // Skip the first space after > if it exists
        if (this.currentTokenIs(TokenType.SPACE)) {
            this.nextToken();
        }

        while (!this.currentTokenIs(TokenType.NEWLINE) && !this.currentTokenIs(TokenType.EOF)) {
            const node = this.parseInlineNode();
            if (node) {
                blockquote.children.push(node);
            }
        }

        return blockquote;
    }

    private parseHorizontalRule(): HorizontalRuleNode {
        const horizontalRule = new HorizontalRuleNode(this.currentToken);
        this.nextToken();
        return horizontalRule;
    }

    // Link text and URL stop at the end of the line, so an unclosed `[`
    // can't swallow the lines (or list items) after it. Brackets that aren't
    // `[text](url)` (no `]`, or no `(` right after it) stay literal text.
    private parseLink(): LinkNode | TextNode {
        let text = '';
        const textToken = this.currentToken;
        this.nextToken(); // Move past [

        while (!this.currentTokenIs(TokenType.RIGHT_BRACKET) && !this.currentTokenIs(TokenType.EOF) && !this.currentTokenIs(TokenType.NEWLINE)) {
            text += this.currentToken.literal;
            this.nextToken();
        }

        if (!this.currentTokenIs(TokenType.RIGHT_BRACKET)) {
            return new TextNode(textToken, '[' + text);
        }
        this.nextToken(); // Move past ]

        if (!this.currentTokenIs(TokenType.LEFT_PARENTHESIS)) {
            return new TextNode(textToken, '[' + text + ']');
        }

        // Balanced parentheses belong to the URL (as in CommonMark), so
        // `[x](https://example.com/a(b))` keeps `a(b)`; the first `)` that
        // closes no `(` ends the destination.
        let url = '';
        let depth = 0;
        this.nextToken(); // Move past (
        while (!(this.currentTokenIs(TokenType.RIGHT_PARENTHESIS) && depth === 0) &&
            !this.currentTokenIs(TokenType.EOF) && !this.currentTokenIs(TokenType.NEWLINE)) {
            if (this.currentTokenIs(TokenType.LEFT_PARENTHESIS)) {
                depth++;
            } else if (this.currentTokenIs(TokenType.RIGHT_PARENTHESIS)) {
                depth--;
            }
            url += this.currentToken.literal;
            this.nextToken();
        }
        if (this.currentTokenIs(TokenType.RIGHT_PARENTHESIS)) {
            this.nextToken(); // Move past )
        }

        return new LinkNode(textToken, text, url);
    }

    private parseBold(): BoldNode {
        const bold = new BoldNode(this.currentToken, '');
        this.nextToken(); // Move past opening **

        while (!this.currentTokenIs(TokenType.BOLD) && !this.currentTokenIs(TokenType.EOF) && !this.currentTokenIs(TokenType.NEWLINE)) {
            const node = this.parseInlineNode(TokenType.BOLD);
            if (node) {
                bold.children.push(node);
            }
        }

        if (this.currentTokenIs(TokenType.BOLD)) {
            this.nextToken(); // Move past closing **
        } else {
            this.addError("Unmatched ** for bold text");
        }

        return bold;
    }

    private parseItalic(): ItalicNode {
        const italic = new ItalicNode(this.currentToken, '');
        this.nextToken(); // Move past opening _ or *

        while (!this.currentTokenIs(TokenType.ITALIC) && !this.currentTokenIs(TokenType.EOF) && !this.currentTokenIs(TokenType.NEWLINE)) {
            const node = this.parseInlineNode(TokenType.ITALIC);
            if (node) {
                italic.children.push(node);
            }
        }

        if (this.currentTokenIs(TokenType.ITALIC)) {
            this.nextToken(); // Move past closing _ or *
        } else {
            this.addError("Unmatched _ for italic text");
        }

        return italic;
    }

    private parseStrikethrough(): StrikethroughNode {
        const strikethrough = new StrikethroughNode(this.currentToken, '');
        this.nextToken(); // Move past opening ~~

        while (!this.currentTokenIs(TokenType.STRIKETHROUGH) && !this.currentTokenIs(TokenType.EOF) && !this.currentTokenIs(TokenType.NEWLINE)) {
            const node = this.parseInlineNode(TokenType.STRIKETHROUGH);
            if (node) {
                strikethrough.children.push(node);
            }
        }

        if (this.currentTokenIs(TokenType.STRIKETHROUGH)) {
            this.nextToken(); // Move past closing ~~
        } else {
            this.addError("Unmatched ~~ for strikethrough text");
        }

        return strikethrough;
    }
    private parseMath(): MathNode {
        const math = new MathNode(this.currentToken, '');
        this.nextToken(); // Move past opening $

        while (!this.currentTokenIs(TokenType.MATH) && !this.currentTokenIs(TokenType.EOF) && !this.currentTokenIs(TokenType.NEWLINE)) {
            switch (this.currentToken.type) {
                case TokenType.SUPERSCRIPT:
                    math.children.push(this.parseSuperscript());
                    break;
                case TokenType.SUBSCRIPT:
                    math.children.push(this.parseSubscript());
                    break;
                case TokenType.LEFT_PARENTHESIS:
                    math.children.push(new TextNode(this.currentToken, this.currentToken.literal));
                    this.nextToken();
                    break;
                case TokenType.RIGHT_PARENTHESIS:
                    math.children.push(new TextNode(this.currentToken, this.currentToken.literal));
                    this.nextToken();
                    break;
                case TokenType.LIST_ITEM:
                    math.children.push(new TextNode(this.currentToken, '-'));
                    this.nextToken();
                    break;
                case TokenType.UNORDERED_LIST:
                    math.children.push(new TextNode(this.currentToken, '*'));
                    this.nextToken();
                    break;
                case TokenType.SPACE:
                    math.children.push(new SpaceNode(this.currentToken));
                    this.nextToken();
                    break;
                case TokenType.TEXT:
                    math.children.push(this.parseText());
                    this.nextToken();
                    break;
                default:
                    math.children.push(new TextNode(this.currentToken, this.currentToken.literal));
                    this.nextToken();
                    break;
            }
        }

        if (this.currentTokenIs(TokenType.MATH)) {
            this.nextToken(); // Move past closing $
        } else {
            this.addError("Unmatched $ for math expression");
        }

        return math;
    }
    private parseSuperscript(): SuperscriptNode {
        const marker = this.currentToken;
        const superscriptText = this.parseScriptOperand(TokenType.SUPERSCRIPT);
        return new SuperscriptNode(marker, superscriptText);
    }
    private parseSubscript(): SubscriptNode {
        const marker = this.currentToken;
        const subscriptText = this.parseScriptOperand(TokenType.SUBSCRIPT);
        return new SubscriptNode(marker, subscriptText);
    }

    /**
     * Reads the operand after a ^ or ~ (`marker`) and returns its text. Leaves
     * currentToken on the first token after the script. The operand is one of:
     * - a parenthesized group: `x^(a+b)`
     * - the paired form's contents: `x^2^`, `H~2~O`
     * - an optional sign, then a number or a run of letters and digits:
     *   `x^2`, `x^-2`, `x^2.5`, `y~ij`
     * In the last form the operand ends where that pattern does, so `x^2+y`
     * is `x<sup>2</sup>+y`; the rest of the text token stays for the caller.
     */
    private parseScriptOperand(marker: TokenType): string {
        let text = '';
        this.nextToken(); // Move past ^ or ~

        if (this.currentTokenIs(TokenType.TEXT)) {
            text = this.readUnbracketedOperand(marker);
        } else if (this.currentTokenIs(TokenType.LIST_ITEM)) {
            text = '-';
            this.nextToken();
        } else if (this.currentTokenIs(TokenType.LEFT_PARENTHESIS)) {
            // Handle parentheses content like ^(98+13)
            text += this.currentToken.literal; // Add opening (
            this.nextToken();

            // Collect everything until closing parenthesis
            while (!this.currentTokenIs(TokenType.RIGHT_PARENTHESIS) && !this.currentTokenIs(TokenType.EOF) && !this.currentTokenIs(TokenType.NEWLINE)) {
                text += this.currentToken.literal;
                this.nextToken();
            }

            // Add closing parenthesis if found
            if (this.currentTokenIs(TokenType.RIGHT_PARENTHESIS)) {
                text += this.currentToken.literal;
                this.nextToken();
            }
        }

        // Paired form (e.g. H~2~O, x^2^): consume the closing marker.
        if (text !== '' && this.currentTokenIs(marker)) {
            this.nextToken();
        }

        return text;
    }

    // currentToken is TEXT. See parseScriptOperand.
    private readUnbracketedOperand(marker: TokenType): string {
        const literal = this.currentToken.literal;

        // Paired form: the whole token is the script, as before.
        if (this.peekToken.type === marker) {
            this.nextToken();
            return literal;
        }

        // The lexer splits a sign from the number after it (`-2` lexes as
        // `-`, `2`), so join a lone sign with the following text token.
        if ((literal === '-' || literal === '+') && this.peekToken.type === TokenType.TEXT &&
            OPERAND_START.test(this.peekToken.literal)) {
            this.nextToken();
            if (this.peekToken.type === marker) {
                const paired = literal + this.currentToken.literal;
                this.nextToken();
                return paired;
            }
            return literal + this.takeOperandPrefix(this.currentToken.literal);
        }

        return this.takeOperandPrefix(literal);
    }

    // Consumes the operand at the start of `literal` (currentToken's text).
    // Any rest stays in place as a TEXT token for the caller.
    private takeOperandPrefix(literal: string): string {
        const match = SCRIPT_OPERAND.exec(literal);
        // No operand (e.g. `x^=`): take a single character.
        const operand = match ? match[0] : Array.from(literal)[0];
        const rest = literal.slice(operand.length);
        if (rest === '') {
            this.nextToken();
        } else {
            this.currentToken = new Token(TokenType.TEXT, rest);
        }
        return operand;
    }

    private parseCode(): InlineCodeNode {
        const code = new InlineCodeNode(this.currentToken, '');

        // Consume the opening `
        this.nextToken();

        while (!this.currentTokenIs(TokenType.INLINE_CODE) && !this.currentTokenIs(TokenType.EOF) && !this.currentTokenIs(TokenType.NEWLINE)) {
            code.children.push(this.parseText());
            this.nextToken(); // Ensure token advancement
        }

        if (this.currentTokenIs(TokenType.INLINE_CODE)) {
            this.nextToken(); // Consume the closing backtick
        } else {
            // Leave a NEWLINE/EOF in place so containers stop at the end of the line
            this.addError("Unmatched ` for inline code");
        }

        return code;
    }

    // The lexer reads the whole fence (content and language) into one token.
    private parseCodeBlock(): CodeBlockNode {
        return new CodeBlockNode(this.currentToken, this.currentToken.literal, this.currentToken.language);
    }

    public parse(): DocumentNode {
        const documentNode = new DocumentNode();

        while (this.currentToken.type !== TokenType.EOF) {
            let node: MarkdownNode | null = null;
            // Inline sub-parsers leave currentToken on the first token after
            // the construct, so the loop must not advance again for them.
            let consumedOwnTokens = false;

            switch (this.currentToken.type) {
                case TokenType.HEADER1:
                case TokenType.HEADER2:
                case TokenType.HEADER3:
                case TokenType.HEADER4:
                case TokenType.HEADER5:
                case TokenType.HEADER6:
                    node = this.parseHeader();
                    break;
                case TokenType.BLOCKQUOTE:
                    node = this.parseBlockquote();
                    break;
                case TokenType.HORIZONTAL_RULE:
                    node = this.parseHorizontalRule();
                    consumedOwnTokens = true;
                    break;
                case TokenType.TEXT:
                // Parentheses outside link destinations and math are literal prose
                case TokenType.LEFT_PARENTHESIS:
                case TokenType.RIGHT_PARENTHESIS:
                    node = this.parseText();
                    break;
                case TokenType.UNORDERED_LIST:
                case TokenType.ORDERED_LIST:
                case TokenType.LIST_ITEM:
                case TokenType.CHECKLIST:
                case TokenType.CHECKLIST_CHECKED:
                    node = this.parseList();
                    break;
                case TokenType.SPACE:
                    node = new SpaceNode(this.currentToken);
                    break;
                case TokenType.TAB:
                    node = new TabNode(this.currentToken);
                    break;
                case TokenType.NEWLINE:
                    node = new NewlineNode(this.currentToken);
                    break;
                case TokenType.BOLD:
                    node = this.parseBold();
                    consumedOwnTokens = true;
                    break;
                case TokenType.ITALIC:
                    node = this.parseItalic();
                    consumedOwnTokens = true;
                    break;
                case TokenType.STRIKETHROUGH:
                    node = this.parseStrikethrough();
                    consumedOwnTokens = true;
                    break;
                case TokenType.LEFT_BRACKET:
                    node = this.parseLink();
                    consumedOwnTokens = true;
                    break;
                case TokenType.INLINE_CODE:
                    node = this.parseCode();
                    consumedOwnTokens = true;
                    break;
                case TokenType.CODE_BLOCK:
                    node = this.parseCodeBlock();
                    break;
                case TokenType.MATH:
                    if (this.hasClosingMath(TokenType.NEWLINE)) {
                        node = this.parseMath();
                        consumedOwnTokens = true;
                    } else {
                        // A lone $ (e.g. a price) is literal, as in parseInlineNode
                        node = this.parseText();
                    }
                    break;
                case TokenType.SUPERSCRIPT:
                    node = this.parseSuperscript();
                    consumedOwnTokens = true;
                    break;
                case TokenType.SUBSCRIPT:
                    node = this.parseSubscript();
                    consumedOwnTokens = true;
                    break;
                default:
                    node = new IllegalNode(this.currentToken);
                    break;
            }

            if (node) {
                documentNode.children.push(node);
            }

            if (!consumedOwnTokens) {
                this.nextToken();
            }
        }

        return documentNode;
    }

}
