import { Lexer } from "./Lexer";
import { Token, TokenType } from "./Token";
import { MarkdownNode, HeaderNode, Header1Node, Header2Node, Header3Node, Header4Node, Header5Node, Header6Node, ParagraphNode, ListNode, ListItemNode, ChecklistNode, ChecklistCheckedNode, BlockquoteNode, HorizontalRuleNode, LinkNode, LinkTextNode, LinkUrlNode, LinkUrlEndNode, BoldNode, ItalicNode, StrikethroughNode, InlineCodeNode, CodeBlockNode, IllegalNode, EOFNode, NewlineNode, DocumentNode, SpaceNode, WhitespaceNode, TabNode } from "./Ast";

export class Parser {
    private lexer: Lexer;
    private currentToken: Token;
    private peekToken: Token;
    private peekNextToken: Token;
    private errors: string[];

    constructor(lexer: Lexer) {
        this.lexer = lexer;
        this.currentToken = new Token(TokenType.ILLEGAL, '');
        this.peekToken = new Token(TokenType.ILLEGAL, '');
        this.peekNextToken = new Token(TokenType.ILLEGAL, '');
        this.errors = [];
    }

    private nextToken(): void {
        this.currentToken = this.peekToken;
        this.peekToken = this.peekNextToken;
        this.peekNextToken = this.lexer.nextToken();
    }

    private peekTokenIs(t: TokenType): boolean {
        return this.peekToken.type === t;
    }

    private peekNextTokenIs(t: TokenType): boolean {
        return this.peekNextToken.type === t;
    }

    private currentTokenIs(t: TokenType): boolean {
        return this.currentToken.type === t;
    }

    private expectPeek(t: TokenType): void {
        if (this.peekTokenIs(t)) {
            this.nextToken();
        } else {
            this.addError(`expected next token to be ${t}, got ${this.peekToken.type} instead`);
        }
    }

    private addError(msg: string): void {
        this.errors.push(msg);
    }
    private peekError(t: TokenType): void {
        if (this.peekTokenIs(t)) {
            this.addError(`expected next token to be ${t}, got ${this.peekToken.type} instead`);
        }
    }

    private parseHeader(): HeaderNode {
        switch (this.currentToken.type) {
            case TokenType.HEADER1:
                const header = new Header1Node(this.currentToken);
                this.nextToken(); // Move past header token
                while (!this.currentTokenIs(TokenType.NEWLINE) && !this.currentTokenIs(TokenType.EOF)) {
                    header.children.push(this.parseText());
                    this.nextToken();
                }
                return header;
            case TokenType.HEADER2:
                const header2 = new Header2Node(this.currentToken);
                this.nextToken();
                while (!this.currentTokenIs(TokenType.NEWLINE) && !this.currentTokenIs(TokenType.EOF)) {
                    header2.children.push(this.parseText());
                    this.nextToken();
                }
                return header2;
            case TokenType.HEADER3:
                const header3 = new Header3Node(this.currentToken);
                this.nextToken();
                while (!this.currentTokenIs(TokenType.NEWLINE) && !this.currentTokenIs(TokenType.EOF)) {
                    header3.children.push(this.parseText());
                    this.nextToken();
                }
                return header3;
            case TokenType.HEADER4:
                const header4 = new Header4Node(this.currentToken);
                this.nextToken();
                while (!this.currentTokenIs(TokenType.NEWLINE) && !this.currentTokenIs(TokenType.EOF)) {
                    header4.children.push(this.parseText());
                    this.nextToken();
                }
                return header4;
            case TokenType.HEADER5:
                const header5 = new Header5Node(this.currentToken);
                this.nextToken();
                while (!this.currentTokenIs(TokenType.NEWLINE) && !this.currentTokenIs(TokenType.EOF)) {
                    header5.children.push(this.parseText());
                    this.nextToken();
                }
                return header5;
            case TokenType.HEADER6:
                const header6 = new Header6Node(this.currentToken);
                this.nextToken();
                while (!this.currentTokenIs(TokenType.NEWLINE) && !this.currentTokenIs(TokenType.EOF)) {
                    header6.children.push(this.parseText());
                    this.nextToken();
                }
                return header6;
            default:
                this.addError(`expected header, got ${this.currentToken.type}`);
                return new Header1Node(this.currentToken);
        }
    }

    private parseList(): ListNode {
        const listNode = new ListNode(this.currentToken, this.currentToken.type === TokenType.UNORDERED_LIST);

        while (this.currentToken.type === TokenType.LIST_ITEM || this.currentToken.type === TokenType.UNORDERED_LIST) {
            const listItem = new ListItemNode(this.currentToken, '');
            this.nextToken(); // Consume the list item marker

            let text = '';
            // Add any inline content to the list item
            while (!this.peekTokenIs(TokenType.NEWLINE) &&
                   !this.peekTokenIs(TokenType.LIST_ITEM) &&
                   !this.peekTokenIs(TokenType.UNORDERED_LIST)) {
                text += this.currentToken.literal + ' ';
                this.nextToken();
            }
            listItem.text = text.trim();
            listNode.items.push(listItem);

            if (this.peekTokenIs(TokenType.NEWLINE)) {
                this.nextToken(); // Consume newline
            }
        }

        return listNode;
    }

    private parseInlineContent(): MarkdownNode[] {
        const children: MarkdownNode[] = [];

        while (this.isInlineToken(this.currentToken.type)) {
            switch (this.currentToken.type) {
                case TokenType.BOLD:
                    children.push(this.parseBold());
                    break;
                case TokenType.ITALIC:
                    children.push(this.parseItalic());
                    break;
                case TokenType.STRIKETHROUGH:
                    children.push(this.parseStrikethrough());
                    break;
                default:
                    children.push(this.parseText());
                    break;
            }
            this.nextToken();
        }

        return children;
    }

    private isInlineToken(type: TokenType): boolean {
        return [
            TokenType.BOLD,
            TokenType.ITALIC,
            TokenType.STRIKETHROUGH,
            TokenType.TEXT,
        ].includes(type);
    }

    private parseText(): ParagraphNode {
        this.expectPeek(TokenType.TEXT);
        const paragraph = new ParagraphNode(this.currentToken, this.currentToken.literal);
        this.nextToken();
        return paragraph;
    }

    private parseBlockquote(): BlockquoteNode {
        this.expectPeek(TokenType.BLOCKQUOTE);
        let text = '';
        const blockquote = new BlockquoteNode(this.currentToken, text);
        while (!this.peekTokenIs(TokenType.NEWLINE)&&!this.peekNextTokenIs(TokenType.NEWLINE)) {
            blockquote.children.push(this.parseText());
            this.nextToken();
        }
        this.nextToken();
        return blockquote;
    }

    private parseHorizontalRule(): HorizontalRuleNode {
        this.expectPeek(TokenType.HORIZONTAL_RULE);
        const horizontalRule = new HorizontalRuleNode(this.currentToken);
        this.nextToken();
        return horizontalRule;
    }

    private parseLink(): LinkNode {
        this.expectPeek(TokenType.LINK_TEXT_START);
        let text = '';
        while (!this.peekTokenIs(TokenType.LINK_TEXT_END)) {
            text += this.parseText().text;
            this.nextToken();
        }
        this.expectPeek(TokenType.LINK_URL_START);
        let url = '';
            while (!this.peekTokenIs(TokenType.LINK_URL_END)) {
                url += this.parseText().text;
                this.nextToken();
        }
        const link = new LinkNode(this.currentToken, text, url);
        this.nextToken();
        return link;
    }

    private parseWhitespace(): WhitespaceNode {
        if (this.currentToken.type === TokenType.SPACE) {
            return new SpaceNode(this.currentToken);
        } else if (this.currentToken.type === TokenType.TAB) {
            return new TabNode(this.currentToken);
        } else if (this.currentToken.type === TokenType.NEWLINE) {
            return new NewlineNode(this.currentToken);
        }
        return new SpaceNode(this.currentToken);
    }

    // private parseLinkUrl(): LinkUrlNode {
    //     this.expectPeek(TokenType.LINK_URL_START);
    //     let url = '';
    //     while (!this.peekTokenIs(TokenType.LINK_URL_END)) {
    //         url += this.parseText().text;
    //         this.nextToken();
    //     }
    //     const linkUrl = new LinkUrlNode(this.currentToken, this.currentToken.literal, url);
    //     this.nextToken();
    //     return linkUrl;
    // }



    private parseBold(): BoldNode {
        this.expectPeek(TokenType.BOLD);
        //might have to make sure this doesn't loop once it hits bold at the end
        let text = '';
        while (!this.peekTokenIs(TokenType.BOLD)) {
            text += this.parseText().text;
            this.nextToken();
        }
        const bold = new BoldNode(this.currentToken, text);
        this.nextToken();
        return bold;
    }

    private parseItalic(): ItalicNode {
        this.expectPeek(TokenType.ITALIC);
        let text = '';
        while (!this.peekTokenIs(TokenType.ITALIC)) {
            text += this.parseText().text;
            this.nextToken();
        }
        const italic = new ItalicNode(this.currentToken, text);
        this.nextToken();
        return italic;
    }

    private parseStrikethrough(): StrikethroughNode {
        this.expectPeek(TokenType.STRIKETHROUGH);
        let text = '';
        while (!this.peekTokenIs(TokenType.STRIKETHROUGH)) {
            text += this.parseText().text;
            this.nextToken();
        }
        const strikethrough = new StrikethroughNode(this.currentToken, text);
        this.nextToken();
        return strikethrough;
    }

    private parseCode(): InlineCodeNode {
        this.expectPeek(TokenType.INLINE_CODE);
        let text = '';
        while (!this.peekTokenIs(TokenType.INLINE_CODE)) {
            text += this.parseText().text;
            this.nextToken();
        }
        const code = new InlineCodeNode(this.currentToken, text);
        this.nextToken();
        return code;
    }

    private parseCodeBlock(): CodeBlockNode {
        this.expectPeek(TokenType.CODE_BLOCK);
        let text = '';
        while (!this.peekTokenIs(TokenType.CODE_BLOCK)) {
            text += this.parseText().text;
            this.nextToken();
        }
        const codeBlock = new CodeBlockNode(this.currentToken, text);
        this.nextToken();
        return codeBlock;
    }


    private parseCheckbox(): ChecklistNode {
        this.expectPeek(TokenType.CHECKLIST);
        let text = '';
        while (!this.peekTokenIs(TokenType.NEWLINE)) {
            text += this.parseText().text;
            this.nextToken();
        }
        const checklist = new ChecklistNode(this.currentToken, text);
        this.nextToken();
        return checklist;
    }

    private parseCheckboxChecked(): ChecklistCheckedNode {
        this.expectPeek(TokenType.CHECKLIST_CHECKED);
        let text = '';
        while (!this.peekTokenIs(TokenType.NEWLINE)) {
            text += this.parseText().text;
            this.nextToken();
        }
        const checklistChecked = new ChecklistCheckedNode(this.currentToken, text);
        this.nextToken();
        return checklistChecked;
    }


    public parse(): DocumentNode {
        const documentNode = new DocumentNode();

        while (this.currentToken.type !== TokenType.EOF) {
            let node: MarkdownNode | null = null;

            switch (this.currentToken.type) {
                case TokenType.HEADER1:
                case TokenType.HEADER2:
                case TokenType.HEADER3:
                case TokenType.HEADER4:
                case TokenType.HEADER5:
                case TokenType.HEADER6:
                    node = this.parseHeader();
                    break;
                case TokenType.UNORDERED_LIST:
                case TokenType.LIST_ITEM:
                    node = this.parseList();
                    break;
                case TokenType.BLOCKQUOTE:
                    node = this.parseBlockquote();
                    break;
                case TokenType.HORIZONTAL_RULE:
                    node = this.parseHorizontalRule();
                    break;
                case TokenType.TEXT:
                    node = this.parseText();
                    break;
                case TokenType.NEWLINE:
                    this.nextToken(); // Skip newlines
                    continue;
                default:
                    node = new IllegalNode(this.currentToken);
                    break;
            }

            if (node) {
                documentNode.children.push(node);
            }

            this.nextToken(); // Advance to the next token
        }

        return documentNode;
    }

}
