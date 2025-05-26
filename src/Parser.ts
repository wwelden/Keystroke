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
    ParagraphNode,
    ListNode,
    ListItemNode,
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
    EOFNode,
    NewlineNode,
    DocumentNode,
    SpaceNode,
    WhitespaceNode,
    TabNode,
    MathNode,
    SuperscriptNode,
    SubscriptNode,
    ParenthesisNode,
    TextNode
} from "./Ast";

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
            this.nextToken();
            this.nextToken();
        }
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
            switch (this.currentToken.type) {
                case TokenType.SPACE:
                    header.children.push(new SpaceNode(this.currentToken));
                    this.nextToken();
                    break;
                case TokenType.TEXT:
                    header.children.push(this.parseText());
                    this.nextToken();
                    break;
                case TokenType.BOLD:
                    header.children.push(this.parseBold());
                    break;
                case TokenType.ITALIC:
                    header.children.push(this.parseItalic());
                    break;
                case TokenType.STRIKETHROUGH:
                    header.children.push(this.parseStrikethrough());
                    break;
                default:
                    this.nextToken();
                    break;
            }
        }

        return header;
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

        // Parse the first list item
        unorderedList.items.push(this.parseListItem());
        this.nextToken();

        // Look for consecutive list items
        while (this.currentTokenIs(TokenType.NEWLINE)) {
            this.nextToken(); // Skip newline

            // Check if the next token is another list marker
            if (this.currentTokenIs(TokenType.UNORDERED_LIST)) {
                unorderedList.items.push(this.parseListItem());
                this.nextToken();
            } else {
                // No more list items, break
                break;
            }
        }

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

    private parseText(): TextNode {
        const text = new TextNode(this.currentToken, this.currentToken.literal);
        return text;
    }

    private parseBlockquote(): BlockquoteNode {
        const blockquote = new BlockquoteNode(this.currentToken, '');
        this.nextToken(); // Move past >

        // Skip the first space after > if it exists
        if (this.currentTokenIs(TokenType.SPACE)) {
            this.nextToken();
        }

        while (!this.currentTokenIs(TokenType.NEWLINE) && !this.currentTokenIs(TokenType.EOF)) {
            switch (this.currentToken.type) {
                case TokenType.SPACE:
                    blockquote.children.push(new SpaceNode(this.currentToken));
                    this.nextToken();
                    break;
                case TokenType.TEXT:
                    blockquote.children.push(this.parseText());
                    this.nextToken();
                    break;
                case TokenType.BOLD:
                    blockquote.children.push(this.parseBold());
                    break;
                case TokenType.ITALIC:
                    blockquote.children.push(this.parseItalic());
                    break;
                case TokenType.STRIKETHROUGH:
                    blockquote.children.push(this.parseStrikethrough());
                    break;
                default:
                    this.nextToken();
                    break;
            }
        }

        return blockquote;
    }

    private parseHorizontalRule(): HorizontalRuleNode {
        this.expectPeek(TokenType.HORIZONTAL_RULE);
        const horizontalRule = new HorizontalRuleNode(this.currentToken);
        this.nextToken();
        return horizontalRule;
    }

    private parseLink(): LinkNode {
        let text = '';
        const textToken = this.currentToken;
        this.nextToken(); // Move past [

        while (!this.currentTokenIs(TokenType.RIGHT_BRACKET) && !this.currentTokenIs(TokenType.EOF)) {
            text += this.currentToken.literal;
            this.nextToken();
        }

        if (this.currentTokenIs(TokenType.RIGHT_BRACKET)) {
            this.nextToken(); // Move past ]
        }

        let url = '';
        if (this.currentTokenIs(TokenType.LEFT_PARENTHESIS)) {
            this.nextToken(); // Move past (
            while (!this.currentTokenIs(TokenType.RIGHT_PARENTHESIS) && !this.currentTokenIs(TokenType.EOF)) {
                url += this.currentToken.literal;
                this.nextToken();
            }
            if (this.currentTokenIs(TokenType.RIGHT_PARENTHESIS)) {
                this.nextToken(); // Move past )
            }
        }

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
        const bold = new BoldNode(this.currentToken, '');
        this.nextToken(); // Move past opening **

        while (!this.currentTokenIs(TokenType.BOLD) && !this.currentTokenIs(TokenType.EOF) && !this.currentTokenIs(TokenType.NEWLINE)) {
            switch (this.currentToken.type) {
                case TokenType.SPACE:
                    bold.children.push(new SpaceNode(this.currentToken));
                    this.nextToken();
                    break;
                case TokenType.TEXT:
                    bold.children.push(this.parseText());
                    this.nextToken();
                    break;
                case TokenType.ITALIC:
                    bold.children.push(this.parseItalic());
                    break;
                case TokenType.STRIKETHROUGH:
                    bold.children.push(this.parseStrikethrough());
                    break;
                default:
                    this.nextToken();
                    break;
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
            switch (this.currentToken.type) {
                case TokenType.SPACE:
                    italic.children.push(new SpaceNode(this.currentToken));
                    this.nextToken();
                    break;
                case TokenType.TEXT:
                    italic.children.push(this.parseText());
                    this.nextToken();
                    break;
                case TokenType.BOLD:
                    italic.children.push(this.parseBold());
                    break;
                case TokenType.STRIKETHROUGH:
                    italic.children.push(this.parseStrikethrough());
                    break;
                default:
                    this.nextToken();
                    break;
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
            switch (this.currentToken.type) {
                case TokenType.SPACE:
                    strikethrough.children.push(new SpaceNode(this.currentToken));
                    this.nextToken();
                    break;
                case TokenType.TEXT:
                    strikethrough.children.push(this.parseText());
                    this.nextToken();
                    break;
                case TokenType.BOLD:
                    strikethrough.children.push(this.parseBold());
                    break;
                case TokenType.ITALIC:
                    strikethrough.children.push(this.parseItalic());
                    break;
                default:
                    this.nextToken();
                    break;
            }
        }

        if (this.currentTokenIs(TokenType.STRIKETHROUGH)) {
            this.nextToken(); // Move past closing ~~
        } else {
            this.addError("Unmatched ~~ for strikethrough text");
        }

        return strikethrough;
    }
    private parseNested(): MarkdownNode { //probalby needs to be recursive or something
        switch (this.currentToken.type){
            case TokenType.BOLD:
                return this.parseBold();
            case TokenType.ITALIC:
                return this.parseItalic();
            case TokenType.STRIKETHROUGH:
                return this.parseStrikethrough();
            default:
                return this.parseText();
        }

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
        let superscriptText = '';
        this.nextToken(); // Move past ^

        if (this.currentTokenIs(TokenType.TEXT)) {
            superscriptText += this.currentToken.literal;
            this.nextToken();
        } else if (this.currentTokenIs(TokenType.LIST_ITEM)) {
            superscriptText += '-';
            this.nextToken();
        } else if (this.currentTokenIs(TokenType.LEFT_PARENTHESIS)) {
            // Handle parentheses content like ^(98+13)
            superscriptText += this.currentToken.literal; // Add opening (
            this.nextToken();

            // Collect everything until closing parenthesis
            while (!this.currentTokenIs(TokenType.RIGHT_PARENTHESIS) && !this.currentTokenIs(TokenType.EOF)) {
                superscriptText += this.currentToken.literal;
                this.nextToken();
            }

            // Add closing parenthesis if found
            if (this.currentTokenIs(TokenType.RIGHT_PARENTHESIS)) {
                superscriptText += this.currentToken.literal;
                this.nextToken();
            }
        }

        const superscript = new SuperscriptNode(this.currentToken, superscriptText);
        return superscript;
    }
    private parseSubscript(): SubscriptNode {
        let subscriptText = '';
        this.nextToken(); // Move past ~

        if (this.currentTokenIs(TokenType.TEXT)) {
            subscriptText += this.currentToken.literal;
            this.nextToken();
        } else if (this.currentTokenIs(TokenType.LIST_ITEM)) {
            subscriptText += '-';
            this.nextToken();
        } else if (this.currentTokenIs(TokenType.LEFT_PARENTHESIS)) {
            // Handle parentheses content like ~(abc+def)
            subscriptText += this.currentToken.literal; // Add opening (
            this.nextToken();

            // Collect everything until closing parenthesis
            while (!this.currentTokenIs(TokenType.RIGHT_PARENTHESIS) && !this.currentTokenIs(TokenType.EOF)) {
                subscriptText += this.currentToken.literal;
                this.nextToken();
            }

            // Add closing parenthesis if found
            if (this.currentTokenIs(TokenType.RIGHT_PARENTHESIS)) {
                subscriptText += this.currentToken.literal;
                this.nextToken();
            }
        }

        const subscript = new SubscriptNode(this.currentToken, subscriptText);
        return subscript;
    }
    private parseParenthesis(): ParenthesisNode {
        this.expectPeek(TokenType.LEFT_PARENTHESIS);
        const parenthesis = new ParenthesisNode(this.currentToken, '');
        this.nextToken();

        while (!this.currentTokenIs(TokenType.RIGHT_PARENTHESIS) && !this.currentTokenIs(TokenType.EOF) && !this.currentTokenIs(TokenType.NEWLINE)) {
            switch (this.currentToken.type) {
                case TokenType.SUPERSCRIPT:
                    parenthesis.children.push(this.parseSuperscript());
                    break;
                case TokenType.SUBSCRIPT:
                    parenthesis.children.push(this.parseSubscript());
                    break;
                case TokenType.TEXT:
                    parenthesis.children.push(this.parseText());
                    break;
                default:
                    this.nextToken();
                    break;
            }
        }

        if (this.currentTokenIs(TokenType.RIGHT_PARENTHESIS)) {
            this.nextToken();
        }

        return parenthesis;
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
            this.addError("Unmatched _ for italic text");
        }
        this.nextToken();

        return code;
    }

    private parseCodeBlock(): CodeBlockNode {
        this.expectPeek(TokenType.CODE_BLOCK);
        let text = '';
        while (!this.peekTokenIs(TokenType.CODE_BLOCK)) {
            text += this.parseText().value;
            this.nextToken();
        }
        const codeBlock = new CodeBlockNode(this.currentToken, text);
        this.nextToken();
        return codeBlock;
    }


    private parseCheckbox(): ChecklistNode {
        const checklist = new ChecklistNode(this.currentToken, '');
        this.nextToken(); // Move past checkbox token

        while (!this.currentTokenIs(TokenType.NEWLINE) && !this.currentTokenIs(TokenType.EOF)) {
            switch (this.currentToken.type) {
                case TokenType.SPACE:
                    checklist.children.push(new SpaceNode(this.currentToken));
                    this.nextToken();
                    break;
                case TokenType.TEXT:
                    checklist.children.push(this.parseText());
                    this.nextToken();
                    break;
                case TokenType.BOLD:
                    checklist.children.push(this.parseBold());
                    break;
                case TokenType.ITALIC:
                    checklist.children.push(this.parseItalic());
                    break;
                case TokenType.STRIKETHROUGH:
                    checklist.children.push(this.parseStrikethrough());
                    break;
                default:
                    this.nextToken();
                    break;
            }
        }

        return checklist;
    }

    private parseCheckboxChecked(): ChecklistCheckedNode {
        const checklistChecked = new ChecklistCheckedNode(this.currentToken, '');
        this.nextToken(); // Move past checkbox token

        while (!this.currentTokenIs(TokenType.NEWLINE) && !this.currentTokenIs(TokenType.EOF)) {
            switch (this.currentToken.type) {
                case TokenType.SPACE:
                    checklistChecked.children.push(new SpaceNode(this.currentToken));
                    this.nextToken();
                    break;
                case TokenType.TEXT:
                    checklistChecked.children.push(this.parseText());
                    this.nextToken();
                    break;
                case TokenType.BOLD:
                    checklistChecked.children.push(this.parseBold());
                    break;
                case TokenType.ITALIC:
                    checklistChecked.children.push(this.parseItalic());
                    break;
                case TokenType.STRIKETHROUGH:
                    checklistChecked.children.push(this.parseStrikethrough());
                    break;
                default:
                    this.nextToken();
                    break;
            }
        }

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
                case TokenType.SPACE:
                    node = new SpaceNode(this.currentToken);
                    break;
                case TokenType.TAB:
                    node = new TabNode(this.currentToken);
                    break;
                case TokenType.NEWLINE:
                    node = new NewlineNode(this.currentToken);
                    break;
                case TokenType.CHECKLIST:
                    node = this.parseCheckbox();
                    break;
                case TokenType.CHECKLIST_CHECKED:
                    node = this.parseCheckboxChecked();
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
                case TokenType.LEFT_BRACKET:
                    node = this.parseLink();
                    break;
                case TokenType.INLINE_CODE:
                    node = this.parseCode();
                    break;
                case TokenType.MATH:
                    node = this.parseMath();
                    break;
                case TokenType.SUPERSCRIPT:
                    node = this.parseSuperscript();
                    break;
                case TokenType.SUBSCRIPT:
                    node = this.parseSubscript();
                    break;
                default:
                    node = new IllegalNode(this.currentToken);
                    break;
            }

            if (node) {
                documentNode.children.push(node);
            }

            this.nextToken();
        }

        return documentNode;
    }

}
