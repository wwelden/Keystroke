import { Lexer } from "./Lexer";
import { Token, TokenType, newToken } from "./Token";
import {
    Node,
    DocumentNode,
    HeaderNode,
    ParagraphNode,
    FormattingNode,
    ListNode,
    ListItemNode,
    LinkNode,
    CodeNode,
    PreNode,
    BlockquoteNode,
    TableNode,
    TableRowNode,
    TableCellNode,
    BreakNode,
    HorizontalRuleNode,
    TextNode,
} from "./Ast";

// HTML collapses runs of these into one space (U+00A0 &nbsp; is not one of them)
const HTML_WHITESPACE = /[ \t\n\r\f]+/g;

export class Parser {
    private lexer: Lexer;
    private curToken: Token;
    private peekToken: Token;
    private errors: string[];
    private preDepth = 0; // > 0 while inside <pre>, where whitespace is kept
    private openElements: TokenType[] = []; // types of the elements being parsed, outermost first

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

    public getErrors(): string[] {
        return this.errors;
    }

    private peekError(t: TokenType): void {
        const msg = `expected next token to be ${t}, got ${this.peekToken.type} instead`;
        this.errors.push(msg);
    }

    // Every parse* method starts on its element's first token and returns with
    // curToken on the token after the element (its closing tag included), so
    // callers never advance past a node themselves.
    public parseDocument(): DocumentNode {
        const children: Node[] = [];

        while (!this.curTokenIs(TokenType.EOF)) {
            // Stray closing tags, transparent tags and inter-block whitespace carry no content
            if (this.isClosingTag() || this.isTransparentTag() || this.isWhitespaceText()) {
                this.nextToken();
                continue;
            }
            const node = this.parseElement();
            if (node !== null) {
                children.push(node);
            }
        }

        return new DocumentNode(children);
    }

    private parseElement(): Node | null {
        switch (this.curToken.type) {
            case TokenType.H1:
            case TokenType.H2:
            case TokenType.H3:
            case TokenType.H4:
            case TokenType.H5:
            case TokenType.H6:
                return this.parseHeader();
            case TokenType.P:
                return this.parseParagraph();
            case TokenType.B:
            case TokenType.STRONG:
                return this.parseFormatting("strong");
            case TokenType.I:
            case TokenType.EM:
                return this.parseFormatting("em");
            case TokenType.U:
                return this.parseFormatting("u");
            case TokenType.S:
                return this.parseFormatting("s");
            case TokenType.SUP:
                return this.parseFormatting("sup");
            case TokenType.SUB:
                return this.parseFormatting("sub");
            case TokenType.UL:
                return this.parseList(false);
            case TokenType.OL:
                return this.parseList(true);
            case TokenType.A:
                return this.parseLink();
            case TokenType.CODE:
                return this.parseCode();
            case TokenType.PRE:
                return this.parsePreformattedText();
            case TokenType.BLOCKQUOTE:
                return this.parseBlockquote();
            case TokenType.TABLE:
                return this.parseTable();
            case TokenType.BR:
                return this.parseBreak();
            case TokenType.HR:
                return this.parseHorizontalRule();
            default:
                return this.parseText();
        }
    }

    // Skips the opening tag, collects children until a closing tag, then skips
    // the closing tag if it matches. A mismatched closing tag is left for an
    // enclosing element to close.
    private parseEnclosedContent(): Node[] {
        const type = this.openElement();
        const content = this.parseContent();
        this.closeElement(type);
        return content;
    }

    private parseHeader(): Node {
        const level = this.getHeaderLevel(this.curToken.type);
        const header = new HeaderNode(level, "", {});
        header.children = this.parseEnclosedContent();
        return header;
    }

    private parseParagraph(): Node {
        const paragraph = new ParagraphNode("", {});
        paragraph.children = this.parseEnclosedContent();
        return paragraph;
    }

    private parseFormatting(formatType: string): Node {
        const formatting = new FormattingNode(formatType, "", {});
        formatting.children = this.parseEnclosedContent();
        return formatting;
    }

    private parseList(ordered: boolean): Node {
        const list = new ListNode(ordered, {});
        const type = this.openElement();

        while (!this.curTokenIs(TokenType.EOF) && !this.atClosingTag()) {
            if (this.curTokenIs(TokenType.LI)) {
                const item = this.parseListItem();
                list.children.push(item);
                list.items.push(item);
            } else if (this.isWhitespaceText() || this.isTransparentTag() || this.isClosingTag()) {
                this.nextToken();
            } else {
                // Content outside an <li> (invalid HTML) joins the previous item,
                // or a new one, so it is kept and the list stays valid LaTeX
                const node = this.parseElement();
                if (node !== null) {
                    let item = list.items[list.items.length - 1];
                    if (item === undefined) {
                        item = new ListItemNode("", {});
                        list.children.push(item);
                        list.items.push(item);
                    }
                    item.children.push(node);
                }
            }
        }

        this.closeElement(type);
        return list;
    }

    private parseListItem(): ListItemNode {
        const listItem = new ListItemNode("", {});
        listItem.children = this.parseEnclosedContent();
        return listItem;
    }

    private parseLink(): Node {
        const href = this.extractAttribute("href");
        const link = new LinkNode(href, "", {});
        link.children = this.parseEnclosedContent();
        return link;
    }

    private parseCode(): Node {
        const code = new CodeNode("", "", {});
        code.children = this.parseEnclosedContent();
        return code;
    }

    private parsePreformattedText(): Node {
        // Extract language from class attribute if present
        const language = this.extractLanguageFromClass();
        const pre = new PreNode("", language, {});
        this.preDepth++;
        try {
            pre.children = this.parseEnclosedContent();
        } finally {
            this.preDepth--;
        }
        return pre;
    }

    private parseBlockquote(): Node {
        const blockquote = new BlockquoteNode("", {});
        blockquote.children = this.parseEnclosedContent();
        return blockquote;
    }

    private parseTable(): Node {
        const table = new TableNode({});
        const type = this.openElement();

        // Parse table rows; <thead>/<tbody> are transparent
        while (!this.curTokenIs(TokenType.EOF) && !this.atClosingTag()) {
            if (this.curTokenIs(TokenType.TR)) {
                const row = this.parseTableRow();
                table.children.push(row);
                table.rows.push(row);
            } else if (this.isWhitespaceText() || this.isTransparentTag() || this.isClosingTag()) {
                this.nextToken();
            } else {
                const node = this.parseElement();
                if (node !== null) {
                    table.children.push(node);
                }
            }
        }

        this.closeElement(type);
        return table;
    }

    private parseTableRow(): TableRowNode {
        const row = new TableRowNode({});
        const type = this.openElement();

        while (!this.curTokenIs(TokenType.EOF) && !this.atClosingTag()) {
            if (this.curTokenIs(TokenType.TD) || this.curTokenIs(TokenType.TH)) {
                const cell = this.parseTableCell();
                row.children.push(cell);
                row.cells.push(cell);
            } else if (this.isWhitespaceText() || this.isTransparentTag() || this.isClosingTag()) {
                this.nextToken();
            } else {
                const node = this.parseElement();
                if (node !== null) {
                    row.children.push(node);
                }
            }
        }

        this.closeElement(type);
        return row;
    }

    private parseTableCell(): TableCellNode {
        const isHeader = this.curToken.type === TokenType.TH;
        const cell = new TableCellNode("", isHeader, {});
        cell.children = this.parseEnclosedContent();
        return cell;
    }

    private parseBreak(): Node {
        this.nextToken();
        return new BreakNode();
    }

    private parseHorizontalRule(): Node {
        this.nextToken();
        return new HorizontalRuleNode({});
    }

    // Text becomes a TextNode (whitespace collapsed outside <pre>); any other
    // token reaching here (e.g. a stray <li>) is skipped.
    private parseText(): Node | null {
        const tok = this.curToken;
        this.nextToken();

        if (tok.type !== TokenType.TEXT) {
            return null;
        }

        const text = this.preDepth > 0 ? tok.literal : tok.literal.replace(HTML_WHITESPACE, " ");
        return text === "" ? null : new TextNode(text);
    }

    private parseContent(): Node[] {
        const content: Node[] = [];

        while (!this.curTokenIs(TokenType.EOF) && !this.atClosingTag()) {
            if (this.isTransparentTag() || this.isClosingTag()) {
                this.nextToken();
                continue;
            }
            const node = this.parseElement();
            if (node !== null) {
                content.push(node);
            }
        }

        return content;
    }

    private getHeaderLevel(tokenType: TokenType): number {
        switch (tokenType) {
            case TokenType.H1: return 1;
            case TokenType.H2: return 2;
            case TokenType.H3: return 3;
            case TokenType.H4: return 4;
            case TokenType.H5: return 5;
            case TokenType.H6: return 6;
            default: return 1;
        }
    }

    private extractAttribute(attrName: string): string {
        // Scan the raw tag literal attribute by attribute, supporting
        // name="value", name='value', name=value and bare name forms.
        // Names are matched whole and case-insensitively; the first
        // occurrence wins, as in HTML.
        const literal = this.curToken.literal;
        const target = attrName.toLowerCase();
        const isSpace = (c: string) => c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\f';
        const len = literal.length;

        // Skip '<' and the tag name
        let i = literal.startsWith('<') ? 1 : 0;
        while (i < len && !isSpace(literal[i]) && literal[i] !== '/' && literal[i] !== '>') {
            i++;
        }

        while (i < len) {
            while (i < len && (isSpace(literal[i]) || literal[i] === '/')) {
                i++;
            }
            if (i >= len || literal[i] === '>') {
                break;
            }

            const nameStart = i;
            // The first character may be '='; per HTML it is then part of the name
            i++;
            while (i < len && !isSpace(literal[i]) && literal[i] !== '/' && literal[i] !== '>' && literal[i] !== '=') {
                i++;
            }
            const name = literal.slice(nameStart, i).toLowerCase();

            while (i < len && isSpace(literal[i])) {
                i++;
            }

            let value = "";
            if (literal[i] === '=') {
                i++;
                while (i < len && isSpace(literal[i])) {
                    i++;
                }
                const quote = literal[i];
                if (quote === '"' || quote === "'") {
                    const end = literal.indexOf(quote, i + 1);
                    // Unterminated quote: take the rest, minus the tag's closing '>'
                    const stop = end !== -1 ? end : (literal.endsWith('>') ? len - 1 : len);
                    value = literal.slice(i + 1, stop);
                    i = stop + 1;
                } else {
                    const valueStart = i;
                    while (i < len && !isSpace(literal[i]) && literal[i] !== '>') {
                        i++;
                    }
                    value = literal.slice(valueStart, i);
                }
            }

            if (name === target) {
                return value;
            }
        }
        return "";
    }

    private extractLanguageFromClass(): string {
        // Extract language from class attribute like class="language-go"
        const cls = this.extractAttribute("class");
        if (cls.startsWith("language-")) {
            return cls.slice("language-".length);
        }
        return "";
    }

    // Text is never a tag, even when it decodes to "</..." (e.g. &lt;/p&gt;)
    private isClosingTag(): boolean {
        return !this.curTokenIs(TokenType.TEXT) && this.curToken.literal.startsWith("</");
    }

    // A closing tag for an element being parsed. It ends the current element
    // (closing any unclosed ones inside it); a stray closing tag is skipped.
    private atClosingTag(): boolean {
        return this.isClosingTag() && !this.isTransparentTag() && this.openElements.includes(this.curToken.type);
    }

    // Records the current opening tag as open and skips it
    private openElement(): TokenType {
        const type = this.curToken.type;
        this.openElements.push(type);
        this.nextToken();
        return type;
    }

    // Skips the element's closing tag if it is next; a closing tag for an outer
    // element is left for that element to consume.
    private closeElement(type: TokenType): void {
        this.openElements.pop();
        if (this.curTokenIs(type) && this.isClosingTag()) {
            this.nextToken();
        }
    }

    // Tags with no LaTeX mapping: the tag itself is dropped, its content kept
    private isTransparentTag(): boolean {
        switch (this.curToken.type) {
            case TokenType.DIV:
            case TokenType.SPAN:
            case TokenType.IMG:
            case TokenType.THEAD:
            case TokenType.TBODY:
            case TokenType.TAG_OPEN:
            case TokenType.TAG_CLOSE:
                return true;
            default:
                return false;
        }
    }

    private isWhitespaceText(): boolean {
        return this.curTokenIs(TokenType.TEXT) && this.curToken.literal.replace(HTML_WHITESPACE, "") === "";
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
