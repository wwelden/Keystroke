import { Lexer } from "./Lexer";
import { Token, TokenType } from "./Token";
import { MarkdownNode, HeaderNode, Header1Node, Header2Node, Header3Node, Header4Node, Header5Node, Header6Node, ParagraphNode, ListNode, ListItemNode, ChecklistNode, ChecklistCheckedNode, BlockquoteNode, HorizontalRuleNode, LinkNode, BoldNode, ItalicNode, StrikethroughNode, InlineCodeNode, CodeBlockNode, IllegalNode, EOFNode, NewlineNode, DocumentNode, SpaceNode, WhitespaceNode, TabNode, MathNode, SuperscriptNode } from "./Ast";

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
    private isSpaceOrTab(token: Token): boolean {
        return token.type === TokenType.SPACE || token.type === TokenType.TAB;
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

    private parseListItem(): ListItemNode {
        const listItem = new ListItemNode(this.currentToken, '');
        while (!this.currentTokenIs(TokenType.NEWLINE) && !this.currentTokenIs(TokenType.EOF)) {
            listItem.children.push(this.parseText());
            this.nextToken();
        }
        return listItem;
    }
    private parseUnorderedList(): ListNode {
        const unorderedList = new ListNode(this.currentToken, true);
        unorderedList.items.push(this.parseListItem());
        this.nextToken();
        return unorderedList;
    }
    private parseOrderedList(): ListNode {
        const orderedList = new ListNode(this.currentToken, false);
        orderedList.items.push(this.parseListItem());
        this.nextToken();
        return orderedList;
    }


    // private parseInlineContent(): MarkdownNode[] {
    //     const children: MarkdownNode[] = [];

    //     while (this.isInlineToken(this.currentToken.type)) {
    //         switch (this.currentToken.type) {
    //             case TokenType.BOLD:
    //                 children.push(this.parseBold());
    //                 break;
    //             case TokenType.ITALIC:
    //                 children.push(this.parseItalic());
    //                 break;
    //             case TokenType.STRIKETHROUGH:
    //                 children.push(this.parseStrikethrough());
    //                 break;
    //             case TokenType.INLINE_CODE:
    //                 children.push(this.parseCode());
    //                 break;
    //             default:
    //                 children.push(this.parseText());
    //                 break;
    //         }
    //         this.nextToken(); // Ensure token advancement
    //     }

    //     return children;
    // }

    private isInlineToken(type: TokenType): boolean {
        return [
            TokenType.BOLD,
            TokenType.ITALIC,
            TokenType.STRIKETHROUGH,
            TokenType.TEXT,
            TokenType.INLINE_CODE,
            TokenType.SPACE,
            TokenType.TAB,
            TokenType.NEWLINE,
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
        this.nextToken();
        const blockquote = new BlockquoteNode(this.currentToken, text);
        while (!this.peekTokenIs(TokenType.NEWLINE) && !this.peekNextTokenIs(TokenType.NEWLINE)) {
                blockquote.children.push(this.parseText());
            this.nextToken();
        }
        blockquote.children.push(this.parseText());
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
        const textToken = this.currentToken;
        this.nextToken();
        while (!this.currentTokenIs(TokenType.LINK_TEXT_END) && !this.currentTokenIs(TokenType.EOF)) {
            text += this.currentToken.literal;
            this.nextToken();
        }
        this.nextToken();
        this.expectPeek(TokenType.LINK_URL_START);
        let url = '';
        this.nextToken();
        while (!this.currentTokenIs(TokenType.LINK_URL_END) && !this.currentTokenIs(TokenType.EOF)) {
            url += this.currentToken.literal;
            this.nextToken();
        }
        this.nextToken();
        const link = new LinkNode(textToken, text, url);
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
    private parseSpace(): SpaceNode {
        this.expectPeek(TokenType.SPACE);
        const space = new SpaceNode(this.currentToken);
        this.nextToken();
        return space;
    }

    private parseTab(): TabNode {
        this.expectPeek(TokenType.TAB);
        const tab = new TabNode(this.currentToken);
        this.nextToken();
        return tab;
    }

    private parseNewline(): NewlineNode {
        this.expectPeek(TokenType.NEWLINE);
        const newline = new NewlineNode(this.currentToken);
        this.nextToken();
        return newline;
    }

    private parseBold(): BoldNode {
        this.expectPeek(TokenType.BOLD);
        const bold = new BoldNode(this.currentToken, '');

        // Consume the opening **
        this.nextToken();

        while (!this.currentTokenIs(TokenType.BOLD) && !this.currentTokenIs(TokenType.EOF)&& !this.currentTokenIs(TokenType.NEWLINE)) {
            bold.children.push(this.parseText());
            this.nextToken(); // Ensure token advancement
        }

        if (this.currentTokenIs(TokenType.BOLD)) {
            this.nextToken(); // Consume the closing **
        } else {
            // Handle unclosed bold token
            this.addError("Unmatched ** for bold text");
        }
        // this.nextToken();

        return bold;
    }

    private parseItalic(): ItalicNode {
        this.expectPeek(TokenType.ITALIC);
        const italic = new ItalicNode(this.currentToken, '');

        // Consume the opening **
        this.nextToken();

        while (!this.currentTokenIs(TokenType.ITALIC) && !this.currentTokenIs(TokenType.EOF) && !this.currentTokenIs(TokenType.NEWLINE)) {
            italic.children.push(this.parseText());
            this.nextToken(); // Ensure token advancement
        }

        if (this.currentTokenIs(TokenType.ITALIC)) {
            this.nextToken(); // Consume the closing **
        } else {
            // Handle unclosed bold token
            this.addError("Unmatched _ for italic text");
        }
        // this.nextToken();

        return italic;
    }

    private parseStrikethrough(): StrikethroughNode {
        this.expectPeek(TokenType.STRIKETHROUGH);
        let text = '';
        const strikethrough = new StrikethroughNode(this.currentToken, text);
        this.nextToken(); // Move past opening ~~
        while (!this.currentTokenIs(TokenType.STRIKETHROUGH) && !this.currentTokenIs(TokenType.EOF)&& !this.currentTokenIs(TokenType.NEWLINE)) {
            strikethrough.children.push(this.parseText());
            this.nextToken();
        }
        if (this.currentTokenIs(TokenType.STRIKETHROUGH)) {
            this.nextToken(); // Move past closing ~~
        }
        return strikethrough;
    }
    private parseMath(): MathNode {
        this.expectPeek(TokenType.MATH);
        let text = '';
        const math = new MathNode(this.currentToken, text);
        this.nextToken(); // Move past opening ~~
        while (!this.currentTokenIs(TokenType.MATH) && !this.currentTokenIs(TokenType.EOF) && !this.currentTokenIs(TokenType.NEWLINE)) {
            if (this.currentTokenIs(TokenType.SUPERSCRIPT)) {
                math.children.push(this.parseSuperscript());
            } else if (!this.currentTokenIs(TokenType.MATH)) {
                math.children.push(this.parseText());
            }
            this.nextToken();
        }
        if (this.currentTokenIs(TokenType.MATH)) {
            this.nextToken(); // Move past closing ~~
        }
        this.nextToken();
        return math;
    }
    private parseSuperscript(): SuperscriptNode {
        this.expectPeek(TokenType.SUPERSCRIPT);
        const superscript = new SuperscriptNode(this.currentToken, '');
        this.nextToken();
        while (!this.currentTokenIs(TokenType.SUPERSCRIPT) && !this.currentTokenIs(TokenType.EOF) && !this.currentTokenIs(TokenType.NEWLINE)) {
            superscript.children.push(this.parseText());
            this.nextToken();
        }
        if (this.currentTokenIs(TokenType.SUPERSCRIPT) || this.currentTokenIs(TokenType.MATH)) {
            this.nextToken(); // Move past closing ~~
        }
        this.nextToken();
        return superscript;
    }

    private parseCode(): InlineCodeNode {
        this.expectPeek(TokenType.INLINE_CODE);
        const code = new InlineCodeNode(this.currentToken, '');

        // Consume the opening **
        this.nextToken();

        while (!this.currentTokenIs(TokenType.INLINE_CODE) && !this.currentTokenIs(TokenType.EOF) && !this.currentTokenIs(TokenType.NEWLINE)) {
            code.children.push(this.parseText());
            this.nextToken(); // Ensure token advancement
        }

        if (this.currentTokenIs(TokenType.ITALIC)) {
            this.nextToken(); // Consume the closing **
        } else {
            // Handle unclosed bold token
            this.addError("Unmatched _ for italic text");
        }
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
        this.nextToken();
        const checklist = new ChecklistNode(this.currentToken, text);
        while (!this.peekTokenIs(TokenType.NEWLINE)) {
            checklist.children.push(this.parseText());
            this.nextToken();
        }
        // this.nextToken();
        return checklist;
    }

    private parseCheckboxChecked(): ChecklistCheckedNode {
        this.expectPeek(TokenType.CHECKLIST_CHECKED);
        let text = '';
        this.nextToken();
        const checklistChecked = new ChecklistCheckedNode(this.currentToken, text);
        while (!this.peekTokenIs(TokenType.NEWLINE)) {
            checklistChecked.children.push(this.parseText());
            this.nextToken();
        }
        // this.nextToken();
        return checklistChecked;
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
                case TokenType.SPACE:
                case TokenType.TAB:
                case TokenType.NEWLINE:
                    children.push(this.parseWhitespace());
                    break;
                default:
                    children.push(this.parseText());
                    break;
            }
            this.nextToken(); // Ensure token advancement
        }

        return children;
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
                case TokenType.BLOCKQUOTE:
                    node = this.parseBlockquote();
                    break;
                case TokenType.HORIZONTAL_RULE:
                    node = this.parseHorizontalRule();
                    break;
                case TokenType.TEXT:
                    node = this.parseText();
                    break;
                case TokenType.UNORDERED_LIST:
                    node = this.parseUnorderedList();
                    break;
                case TokenType.ORDERED_LIST:
                    node = this.parseOrderedList();
                    break;
                case TokenType.LIST_ITEM:
                    node = this.parseListItem();
                    break;
                case TokenType.NEWLINE:
                case TokenType.SPACE:
                case TokenType.TAB:
                    node = this.parseWhitespace();
                    break;
                case TokenType.CHECKLIST:
                    node = this.parseCheckbox();
                    break;
                case TokenType.CHECKLIST_CHECKED:
                    node = this.parseCheckboxChecked();
                    break;
                case TokenType.SPACE:
                    node = this.parseSpace();
                    break;
                case TokenType.TAB:
                    node = this.parseTab();
                    break;
                case TokenType.NEWLINE:
                    node = this.parseNewline();
                    break;
                case TokenType.BOLD:
                    node = this.parseBold();
                    break;
                case TokenType.ITALIC:
                    node = this.parseItalic();
                    break;
                case TokenType.STRIKETHROUGH:
                    node = this.parseStrikethrough();
                    break;
                case TokenType.LINK_TEXT_START:
                    node = this.parseLink();
                    break;
                case TokenType.INLINE_CODE:
                    node = this.parseCode();
                    break;
                case TokenType.MATH:
                    node = this.parseMath();
                    break;
                // case TokenType.CODE_BLOCK:
                //     node = this.parseCodeBlock();
                //     break;
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
