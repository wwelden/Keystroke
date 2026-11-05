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

export class Parser {
    private lexer: Lexer;
    private curToken: Token;
    private peekToken: Token;
    private errors: string[];

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

    public parseDocument(): DocumentNode {
        const children: Node[] = [];

        while (!this.curTokenIs(TokenType.EOF)) {
            const node = this.parseElement();
            if (node !== null) {
                children.push(node);
            }
            this.nextToken();
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

    // Skips the opening tag, collects children until a closing tag, then skips the closing tag
    private parseEnclosedContent(): Node[] {
        this.nextToken();
        const content = this.parseContent();
        this.nextToken();
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

        // Skip opening tag
        this.nextToken();

        // Parse list items
        while (!this.curTokenIs(TokenType.EOF) && this.curToken.type === TokenType.LI) {
            const item = this.parseListItem();
            list.children.push(item);
            list.items.push(item);
            this.nextToken();
        }

        // Skip closing tag
        this.nextToken();

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
        pre.children = this.parseEnclosedContent();
        return pre;
    }

    private parseBlockquote(): Node {
        const blockquote = new BlockquoteNode("", {});
        blockquote.children = this.parseEnclosedContent();
        return blockquote;
    }

    private parseTable(): Node {
        const table = new TableNode({});

        // Skip opening table tag
        this.nextToken();

        // Parse table rows
        while (!this.curTokenIs(TokenType.EOF) && this.curToken.type === TokenType.TR) {
            const row = this.parseTableRow();
            table.children.push(row);
            table.rows.push(row);
            this.nextToken();
        }

        // Skip closing table tag
        this.nextToken();

        return table;
    }

    private parseTableRow(): TableRowNode {
        const row = new TableRowNode({});

        // Skip opening TR tag
        this.nextToken();

        // Parse table cells
        while (!this.curTokenIs(TokenType.EOF) &&
            (this.curToken.type === TokenType.TD || this.curToken.type === TokenType.TH)) {
            const cell = this.parseTableCell();
            row.children.push(cell);
            row.cells.push(cell);
            this.nextToken();
        }

        // Skip closing TR tag
        this.nextToken();

        return row;
    }

    private parseTableCell(): TableCellNode {
        const isHeader = this.curToken.type === TokenType.TH;
        const cell = new TableCellNode("", isHeader, {});
        cell.children = this.parseEnclosedContent();
        return cell;
    }

    private parseBreak(): Node {
        return new BreakNode();
    }

    private parseHorizontalRule(): Node {
        return new HorizontalRuleNode({});
    }

    private parseText(): Node | null {
        if (this.curToken.type === TokenType.TEXT) {
            return new TextNode(this.curToken.literal);
        }

        // Read text content directly from the lexer
        const textContent = this.lexer.readTextContent();
        if (textContent !== "") {
            return new TextNode(textContent);
        }

        return null;
    }

    private parseContent(): Node[] {
        const content: Node[] = [];

        while (!this.curTokenIs(TokenType.EOF) && !this.isClosingTag()) {
            const node = this.parseElement();
            if (node !== null) {
                content.push(node);
            }
            this.nextToken();
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
        // Simple attribute extraction from the raw tag literal; only handles name="value"
        const tokenLiteral = this.curToken.literal;
        const attrPattern = attrName + '="';
        const idx = tokenLiteral.indexOf(attrPattern);
        if (idx !== -1) {
            const start = idx + attrPattern.length;
            const end = tokenLiteral.indexOf('"', start);
            if (end !== -1) {
                return tokenLiteral.slice(start, end);
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

    private isClosingTag(): boolean {
        return this.curToken.literal.startsWith("</");
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
