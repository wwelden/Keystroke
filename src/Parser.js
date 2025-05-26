"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const Token_1 = require("./Token");
const Ast_1 = require("./Ast");
class Parser {
    constructor(lexer, currentToken = new Token_1.Token(Token_1.TokenType.ILLEGAL, ''), peekToken = new Token_1.Token(Token_1.TokenType.ILLEGAL, ''), peekNextToken = new Token_1.Token(Token_1.TokenType.ILLEGAL, '')) {
        this.lexer = lexer;
        this.currentToken = currentToken;
        this.peekToken = peekToken;
        this.peekNextToken = peekNextToken;
        this.errors = [];
        // Initialize tokens if they are not provided (when only lexer is passed)
        if (this.currentToken.type === Token_1.TokenType.ILLEGAL && this.currentToken.literal === '' &&
            this.peekToken.type === Token_1.TokenType.ILLEGAL && this.peekToken.literal === '' &&
            this.peekNextToken.type === Token_1.TokenType.ILLEGAL && this.peekNextToken.literal === '') {
            this.nextToken();
            this.nextToken();
        }
    }
    nextToken() {
        this.currentToken = this.peekToken;
        this.peekToken = this.peekNextToken;
        this.peekNextToken = this.lexer.nextToken();
    }
    peekTokenIs(t) {
        return this.peekToken.type === t;
    }
    peekNextTokenIs(t) {
        return this.peekNextToken.type === t;
    }
    currentTokenIs(t) {
        return this.currentToken.type === t;
    }
    expectPeek(t) {
        if (this.peekTokenIs(t)) {
            this.nextToken();
        }
        else {
            this.addError(`expected next token to be ${t}, got ${this.peekToken.type} instead`);
        }
    }
    isSpaceOrTab(token) {
        return token.type === Token_1.TokenType.SPACE || token.type === Token_1.TokenType.TAB;
    }
    addError(msg) {
        this.errors.push(msg);
    }
    peekError(t) {
        if (this.peekTokenIs(t)) {
            this.addError(`expected next token to be ${t}, got ${this.peekToken.type} instead`);
        }
    }
    parseHeader() {
        let header;
        switch (this.currentToken.type) {
            case Token_1.TokenType.HEADER1:
                header = new Ast_1.Header1Node(this.currentToken);
                break;
            case Token_1.TokenType.HEADER2:
                header = new Ast_1.Header2Node(this.currentToken);
                break;
            case Token_1.TokenType.HEADER3:
                header = new Ast_1.Header3Node(this.currentToken);
                break;
            case Token_1.TokenType.HEADER4:
                header = new Ast_1.Header4Node(this.currentToken);
                break;
            case Token_1.TokenType.HEADER5:
                header = new Ast_1.Header5Node(this.currentToken);
                break;
            case Token_1.TokenType.HEADER6:
                header = new Ast_1.Header6Node(this.currentToken);
                break;
            default:
                this.addError(`expected header, got ${this.currentToken.type}`);
                header = new Ast_1.Header1Node(this.currentToken);
                break;
        }
        this.nextToken(); // Move past header token
        while (!this.currentTokenIs(Token_1.TokenType.NEWLINE) && !this.currentTokenIs(Token_1.TokenType.EOF)) {
            switch (this.currentToken.type) {
                case Token_1.TokenType.SPACE:
                    header.children.push(new Ast_1.SpaceNode(this.currentToken));
                    this.nextToken();
                    break;
                case Token_1.TokenType.TEXT:
                    header.children.push(this.parseText());
                    this.nextToken();
                    break;
                case Token_1.TokenType.BOLD:
                    header.children.push(this.parseBold());
                    break;
                case Token_1.TokenType.ITALIC:
                    header.children.push(this.parseItalic());
                    break;
                case Token_1.TokenType.STRIKETHROUGH:
                    header.children.push(this.parseStrikethrough());
                    break;
                default:
                    this.nextToken();
                    break;
            }
        }
        return header;
    }
    parseListItem() {
        const listItem = new Ast_1.ListItemNode(this.currentToken, '');
        while (!this.currentTokenIs(Token_1.TokenType.NEWLINE) && !this.currentTokenIs(Token_1.TokenType.EOF)) {
            listItem.children.push(this.parseText());
            this.nextToken();
        }
        return listItem;
    }
    parseUnorderedList() {
        const unorderedList = new Ast_1.ListNode(this.currentToken, true);
        unorderedList.items.push(this.parseListItem());
        this.nextToken();
        return unorderedList;
    }
    parseOrderedList() {
        const orderedList = new Ast_1.ListNode(this.currentToken, false);
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
    isInlineToken(type) {
        return [
            Token_1.TokenType.BOLD,
            Token_1.TokenType.ITALIC,
            Token_1.TokenType.STRIKETHROUGH,
            Token_1.TokenType.TEXT,
            Token_1.TokenType.INLINE_CODE,
            Token_1.TokenType.SPACE,
            Token_1.TokenType.TAB,
            Token_1.TokenType.NEWLINE,
        ].includes(type);
    }
    parseText() {
        const text = new Ast_1.TextNode(this.currentToken, this.currentToken.literal);
        return text;
    }
    parseBlockquote() {
        const blockquote = new Ast_1.BlockquoteNode(this.currentToken, '');
        this.nextToken(); // Move past >
        while (!this.currentTokenIs(Token_1.TokenType.NEWLINE) && !this.currentTokenIs(Token_1.TokenType.EOF)) {
            switch (this.currentToken.type) {
                case Token_1.TokenType.SPACE:
                    blockquote.children.push(new Ast_1.SpaceNode(this.currentToken));
                    this.nextToken();
                    break;
                case Token_1.TokenType.TEXT:
                    blockquote.children.push(this.parseText());
                    this.nextToken();
                    break;
                case Token_1.TokenType.BOLD:
                    blockquote.children.push(this.parseBold());
                    break;
                case Token_1.TokenType.ITALIC:
                    blockquote.children.push(this.parseItalic());
                    break;
                case Token_1.TokenType.STRIKETHROUGH:
                    blockquote.children.push(this.parseStrikethrough());
                    break;
                default:
                    this.nextToken();
                    break;
            }
        }
        return blockquote;
    }
    parseHorizontalRule() {
        this.expectPeek(Token_1.TokenType.HORIZONTAL_RULE);
        const horizontalRule = new Ast_1.HorizontalRuleNode(this.currentToken);
        this.nextToken();
        return horizontalRule;
    }
    parseLink() {
        let text = '';
        const textToken = this.currentToken;
        this.nextToken(); // Move past [
        while (!this.currentTokenIs(Token_1.TokenType.RIGHT_BRACKET) && !this.currentTokenIs(Token_1.TokenType.EOF)) {
            text += this.currentToken.literal;
            this.nextToken();
        }
        if (this.currentTokenIs(Token_1.TokenType.RIGHT_BRACKET)) {
            this.nextToken(); // Move past ]
        }
        let url = '';
        if (this.currentTokenIs(Token_1.TokenType.LEFT_PARENTHESIS)) {
            this.nextToken(); // Move past (
            while (!this.currentTokenIs(Token_1.TokenType.RIGHT_PARENTHESIS) && !this.currentTokenIs(Token_1.TokenType.EOF)) {
                url += this.currentToken.literal;
                this.nextToken();
            }
            if (this.currentTokenIs(Token_1.TokenType.RIGHT_PARENTHESIS)) {
                this.nextToken(); // Move past )
            }
        }
        const link = new Ast_1.LinkNode(textToken, text, url);
        return link;
    }
    parseWhitespace() {
        if (this.currentToken.type === Token_1.TokenType.SPACE) {
            return new Ast_1.SpaceNode(this.currentToken);
        }
        else if (this.currentToken.type === Token_1.TokenType.TAB) {
            return new Ast_1.TabNode(this.currentToken);
        }
        else if (this.currentToken.type === Token_1.TokenType.NEWLINE) {
            return new Ast_1.NewlineNode(this.currentToken);
        }
        return new Ast_1.SpaceNode(this.currentToken);
    }
    parseSpace() {
        this.expectPeek(Token_1.TokenType.SPACE);
        const space = new Ast_1.SpaceNode(this.currentToken);
        this.nextToken();
        return space;
    }
    parseTab() {
        this.expectPeek(Token_1.TokenType.TAB);
        const tab = new Ast_1.TabNode(this.currentToken);
        this.nextToken();
        return tab;
    }
    parseNewline() {
        this.expectPeek(Token_1.TokenType.NEWLINE);
        const newline = new Ast_1.NewlineNode(this.currentToken);
        this.nextToken();
        return newline;
    }
    parseBold() {
        const bold = new Ast_1.BoldNode(this.currentToken, '');
        this.nextToken(); // Move past opening **
        while (!this.currentTokenIs(Token_1.TokenType.BOLD) && !this.currentTokenIs(Token_1.TokenType.EOF) && !this.currentTokenIs(Token_1.TokenType.NEWLINE)) {
            switch (this.currentToken.type) {
                case Token_1.TokenType.SPACE:
                    bold.children.push(new Ast_1.SpaceNode(this.currentToken));
                    this.nextToken();
                    break;
                case Token_1.TokenType.TEXT:
                    bold.children.push(this.parseText());
                    this.nextToken();
                    break;
                case Token_1.TokenType.ITALIC:
                    bold.children.push(this.parseItalic());
                    break;
                case Token_1.TokenType.STRIKETHROUGH:
                    bold.children.push(this.parseStrikethrough());
                    break;
                default:
                    this.nextToken();
                    break;
            }
        }
        if (this.currentTokenIs(Token_1.TokenType.BOLD)) {
            this.nextToken(); // Move past closing **
        }
        else {
            this.addError("Unmatched ** for bold text");
        }
        return bold;
    }
    parseItalic() {
        const italic = new Ast_1.ItalicNode(this.currentToken, '');
        this.nextToken(); // Move past opening _ or *
        while (!this.currentTokenIs(Token_1.TokenType.ITALIC) && !this.currentTokenIs(Token_1.TokenType.EOF) && !this.currentTokenIs(Token_1.TokenType.NEWLINE)) {
            switch (this.currentToken.type) {
                case Token_1.TokenType.SPACE:
                    italic.children.push(new Ast_1.SpaceNode(this.currentToken));
                    this.nextToken();
                    break;
                case Token_1.TokenType.TEXT:
                    italic.children.push(this.parseText());
                    this.nextToken();
                    break;
                case Token_1.TokenType.BOLD:
                    italic.children.push(this.parseBold());
                    break;
                case Token_1.TokenType.STRIKETHROUGH:
                    italic.children.push(this.parseStrikethrough());
                    break;
                default:
                    this.nextToken();
                    break;
            }
        }
        if (this.currentTokenIs(Token_1.TokenType.ITALIC)) {
            this.nextToken(); // Move past closing _ or *
        }
        else {
            this.addError("Unmatched _ for italic text");
        }
        return italic;
    }
    parseStrikethrough() {
        const strikethrough = new Ast_1.StrikethroughNode(this.currentToken, '');
        this.nextToken(); // Move past opening ~~
        while (!this.currentTokenIs(Token_1.TokenType.STRIKETHROUGH) && !this.currentTokenIs(Token_1.TokenType.EOF) && !this.currentTokenIs(Token_1.TokenType.NEWLINE)) {
            switch (this.currentToken.type) {
                case Token_1.TokenType.SPACE:
                    strikethrough.children.push(new Ast_1.SpaceNode(this.currentToken));
                    this.nextToken();
                    break;
                case Token_1.TokenType.TEXT:
                    strikethrough.children.push(this.parseText());
                    this.nextToken();
                    break;
                case Token_1.TokenType.BOLD:
                    strikethrough.children.push(this.parseBold());
                    break;
                case Token_1.TokenType.ITALIC:
                    strikethrough.children.push(this.parseItalic());
                    break;
                default:
                    this.nextToken();
                    break;
            }
        }
        if (this.currentTokenIs(Token_1.TokenType.STRIKETHROUGH)) {
            this.nextToken(); // Move past closing ~~
        }
        else {
            this.addError("Unmatched ~~ for strikethrough text");
        }
        return strikethrough;
    }
    parseNested() {
        switch (this.currentToken.type) {
            case Token_1.TokenType.BOLD:
                return this.parseBold();
            case Token_1.TokenType.ITALIC:
                return this.parseItalic();
            case Token_1.TokenType.STRIKETHROUGH:
                return this.parseStrikethrough();
            default:
                return this.parseText();
        }
    }
    parseMath() {
        const math = new Ast_1.MathNode(this.currentToken, '');
        this.nextToken(); // Move past opening $
        while (!this.currentTokenIs(Token_1.TokenType.MATH) && !this.currentTokenIs(Token_1.TokenType.EOF) && !this.currentTokenIs(Token_1.TokenType.NEWLINE)) {
            switch (this.currentToken.type) {
                case Token_1.TokenType.SUPERSCRIPT:
                    math.children.push(this.parseSuperscript());
                    break;
                case Token_1.TokenType.SUBSCRIPT:
                    math.children.push(this.parseSubscript());
                    break;
                case Token_1.TokenType.LEFT_PARENTHESIS:
                    math.children.push(new Ast_1.TextNode(this.currentToken, this.currentToken.literal));
                    this.nextToken();
                    break;
                case Token_1.TokenType.RIGHT_PARENTHESIS:
                    math.children.push(new Ast_1.TextNode(this.currentToken, this.currentToken.literal));
                    this.nextToken();
                    break;
                case Token_1.TokenType.LIST_ITEM:
                    math.children.push(new Ast_1.TextNode(this.currentToken, '-'));
                    this.nextToken();
                    break;
                case Token_1.TokenType.UNORDERED_LIST:
                    math.children.push(new Ast_1.TextNode(this.currentToken, '*'));
                    this.nextToken();
                    break;
                case Token_1.TokenType.SPACE:
                    math.children.push(new Ast_1.SpaceNode(this.currentToken));
                    this.nextToken();
                    break;
                case Token_1.TokenType.TEXT:
                    math.children.push(this.parseText());
                    this.nextToken();
                    break;
                default:
                    math.children.push(new Ast_1.TextNode(this.currentToken, this.currentToken.literal));
                    this.nextToken();
                    break;
            }
        }
        if (this.currentTokenIs(Token_1.TokenType.MATH)) {
            this.nextToken(); // Move past closing $
        }
        else {
            this.addError("Unmatched $ for math expression");
        }
        return math;
    }
    parseSuperscript() {
        let superscriptText = '';
        this.nextToken(); // Move past ^
        // Parse the immediate content (usually just one token)
        if (this.currentTokenIs(Token_1.TokenType.TEXT)) {
            superscriptText += this.currentToken.literal;
            this.nextToken();
        }
        else if (this.currentTokenIs(Token_1.TokenType.LIST_ITEM)) {
            superscriptText += '-';
            this.nextToken();
        }
        const superscript = new Ast_1.SuperscriptNode(this.currentToken, superscriptText);
        return superscript;
    }
    parseSubscript() {
        let subscriptText = '';
        this.nextToken(); // Move past ~
        // Parse the immediate content (usually just one token)
        if (this.currentTokenIs(Token_1.TokenType.TEXT)) {
            subscriptText += this.currentToken.literal;
            this.nextToken();
        }
        else if (this.currentTokenIs(Token_1.TokenType.LIST_ITEM)) {
            subscriptText += '-';
            this.nextToken();
        }
        const subscript = new Ast_1.SubscriptNode(this.currentToken, subscriptText);
        return subscript;
    }
    parseParenthesis() {
        this.expectPeek(Token_1.TokenType.LEFT_PARENTHESIS);
        const parenthesis = new Ast_1.ParenthesisNode(this.currentToken, '');
        this.nextToken();
        while (!this.currentTokenIs(Token_1.TokenType.RIGHT_PARENTHESIS) && !this.currentTokenIs(Token_1.TokenType.EOF) && !this.currentTokenIs(Token_1.TokenType.NEWLINE)) {
            switch (this.currentToken.type) {
                case Token_1.TokenType.SUPERSCRIPT:
                    parenthesis.children.push(this.parseSuperscript());
                    break;
                case Token_1.TokenType.SUBSCRIPT:
                    parenthesis.children.push(this.parseSubscript());
                    break;
                case Token_1.TokenType.TEXT:
                    parenthesis.children.push(this.parseText());
                    break;
                default:
                    this.nextToken();
                    break;
            }
        }
        if (this.currentTokenIs(Token_1.TokenType.RIGHT_PARENTHESIS)) {
            this.nextToken();
        }
        return parenthesis;
    }
    parseCode() {
        this.expectPeek(Token_1.TokenType.INLINE_CODE);
        const code = new Ast_1.InlineCodeNode(this.currentToken, '');
        // Consume the opening **
        this.nextToken();
        while (!this.currentTokenIs(Token_1.TokenType.INLINE_CODE) && !this.currentTokenIs(Token_1.TokenType.EOF) && !this.currentTokenIs(Token_1.TokenType.NEWLINE)) {
            code.children.push(this.parseText());
            this.nextToken(); // Ensure token advancement
        }
        if (this.currentTokenIs(Token_1.TokenType.ITALIC)) {
            this.nextToken(); // Consume the closing **
        }
        else {
            this.addError("Unmatched _ for italic text");
        }
        this.nextToken();
        return code;
    }
    parseCodeBlock() {
        this.expectPeek(Token_1.TokenType.CODE_BLOCK);
        let text = '';
        while (!this.peekTokenIs(Token_1.TokenType.CODE_BLOCK)) {
            text += this.parseText().value;
            this.nextToken();
        }
        const codeBlock = new Ast_1.CodeBlockNode(this.currentToken, text);
        this.nextToken();
        return codeBlock;
    }
    parseCheckbox() {
        const checklist = new Ast_1.ChecklistNode(this.currentToken, '');
        this.nextToken(); // Move past checkbox token
        while (!this.currentTokenIs(Token_1.TokenType.NEWLINE) && !this.currentTokenIs(Token_1.TokenType.EOF)) {
            switch (this.currentToken.type) {
                case Token_1.TokenType.SPACE:
                    checklist.children.push(new Ast_1.SpaceNode(this.currentToken));
                    this.nextToken();
                    break;
                case Token_1.TokenType.TEXT:
                    checklist.children.push(this.parseText());
                    this.nextToken();
                    break;
                case Token_1.TokenType.BOLD:
                    checklist.children.push(this.parseBold());
                    break;
                case Token_1.TokenType.ITALIC:
                    checklist.children.push(this.parseItalic());
                    break;
                case Token_1.TokenType.STRIKETHROUGH:
                    checklist.children.push(this.parseStrikethrough());
                    break;
                default:
                    this.nextToken();
                    break;
            }
        }
        return checklist;
    }
    parseCheckboxChecked() {
        const checklistChecked = new Ast_1.ChecklistCheckedNode(this.currentToken, '');
        this.nextToken(); // Move past checkbox token
        while (!this.currentTokenIs(Token_1.TokenType.NEWLINE) && !this.currentTokenIs(Token_1.TokenType.EOF)) {
            switch (this.currentToken.type) {
                case Token_1.TokenType.SPACE:
                    checklistChecked.children.push(new Ast_1.SpaceNode(this.currentToken));
                    this.nextToken();
                    break;
                case Token_1.TokenType.TEXT:
                    checklistChecked.children.push(this.parseText());
                    this.nextToken();
                    break;
                case Token_1.TokenType.BOLD:
                    checklistChecked.children.push(this.parseBold());
                    break;
                case Token_1.TokenType.ITALIC:
                    checklistChecked.children.push(this.parseItalic());
                    break;
                case Token_1.TokenType.STRIKETHROUGH:
                    checklistChecked.children.push(this.parseStrikethrough());
                    break;
                default:
                    this.nextToken();
                    break;
            }
        }
        return checklistChecked;
    }
    parseInlineContent() {
        const children = [];
        while (this.isInlineToken(this.currentToken.type)) {
            switch (this.currentToken.type) {
                case Token_1.TokenType.BOLD:
                    children.push(this.parseBold());
                    break;
                case Token_1.TokenType.ITALIC:
                    children.push(this.parseItalic());
                    break;
                case Token_1.TokenType.STRIKETHROUGH:
                    children.push(this.parseStrikethrough());
                    break;
                case Token_1.TokenType.SPACE:
                case Token_1.TokenType.TAB:
                case Token_1.TokenType.NEWLINE:
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
    parse() {
        const documentNode = new Ast_1.DocumentNode();
        while (this.currentToken.type !== Token_1.TokenType.EOF) {
            let node = null;
            switch (this.currentToken.type) {
                case Token_1.TokenType.HEADER1:
                case Token_1.TokenType.HEADER2:
                case Token_1.TokenType.HEADER3:
                case Token_1.TokenType.HEADER4:
                case Token_1.TokenType.HEADER5:
                case Token_1.TokenType.HEADER6:
                    node = this.parseHeader();
                    break;
                case Token_1.TokenType.BLOCKQUOTE:
                    node = this.parseBlockquote();
                    break;
                case Token_1.TokenType.HORIZONTAL_RULE:
                    node = this.parseHorizontalRule();
                    break;
                case Token_1.TokenType.TEXT:
                    node = this.parseText();
                    break;
                case Token_1.TokenType.UNORDERED_LIST:
                    node = this.parseUnorderedList();
                    break;
                case Token_1.TokenType.ORDERED_LIST:
                    node = this.parseOrderedList();
                    break;
                case Token_1.TokenType.LIST_ITEM:
                    node = this.parseListItem();
                    break;
                case Token_1.TokenType.SPACE:
                    node = new Ast_1.SpaceNode(this.currentToken);
                    break;
                case Token_1.TokenType.TAB:
                    node = new Ast_1.TabNode(this.currentToken);
                    break;
                case Token_1.TokenType.NEWLINE:
                    node = new Ast_1.NewlineNode(this.currentToken);
                    break;
                case Token_1.TokenType.CHECKLIST:
                    node = this.parseCheckbox();
                    break;
                case Token_1.TokenType.CHECKLIST_CHECKED:
                    node = this.parseCheckboxChecked();
                    break;
                case Token_1.TokenType.BOLD:
                    node = this.parseBold();
                    break;
                case Token_1.TokenType.ITALIC:
                    node = this.parseItalic();
                    break;
                case Token_1.TokenType.STRIKETHROUGH:
                    node = this.parseStrikethrough();
                    break;
                case Token_1.TokenType.LEFT_BRACKET:
                    node = this.parseLink();
                    break;
                case Token_1.TokenType.INLINE_CODE:
                    node = this.parseCode();
                    break;
                case Token_1.TokenType.MATH:
                    node = this.parseMath();
                    break;
                case Token_1.TokenType.SUPERSCRIPT:
                    node = this.parseSuperscript();
                    break;
                case Token_1.TokenType.SUBSCRIPT:
                    node = this.parseSubscript();
                    break;
                default:
                    node = new Ast_1.IllegalNode(this.currentToken);
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
exports.Parser = Parser;
