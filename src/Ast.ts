import { Token, TokenType } from "./Token";

// export abstract class MarkdownNode {
//     constructor(
//         public type: TokenType,
//         public value: string,
//         public children: MarkdownNode[] = []
//     ) {}
// }

export abstract class MarkdownNode {
    constructor(public type: TokenType, public value: string) { }
    children: MarkdownNode[] = [];

    render(): string {
        switch (this.type) {
            case TokenType.HEADER1:
                return `<h1>${this.children.map(child => child.render()).join("")}</h1>`;
            case TokenType.BOLD:
                return `<strong>${this.children.map(child => child.render()).join("")}</strong>`;
            case TokenType.PARAGRAPH:
                return `<p>${this.children.map(child => child.render()).join("")}</p>`;
            // Add cases for other node types
            default:
                return this.value;
        }
    }
}

export abstract class HeaderNode extends MarkdownNode {
    constructor(
        public type: TokenType.HEADER1 | TokenType.HEADER2 | TokenType.HEADER3 | TokenType.HEADER4 | TokenType.HEADER5 | TokenType.HEADER6,
        public value: string,
        public level: number,
        public text: string = '',
            children: MarkdownNode[] = []
        ) {
            super(type, value);
            this.children = children;
    }
}

export class Header1Node extends HeaderNode {
    constructor(token: Token) {
        super(TokenType.HEADER1, token.literal, 1);
    }
}

export class Header2Node extends HeaderNode {
    constructor(token: Token) {
        super(TokenType.HEADER2, token.literal, 2);
    }
}

export class Header3Node extends HeaderNode {
    constructor(token: Token) {
        super(TokenType.HEADER3, token.literal, 3);
    }
}

export class Header4Node extends HeaderNode {
    constructor(token: Token) {
        super(TokenType.HEADER4, token.literal, 4);
    }
}

export class Header5Node extends HeaderNode {
    constructor(token: Token) {
        super(TokenType.HEADER5, token.literal, 5);
    }
}

export class Header6Node extends HeaderNode {
    constructor(token: Token) {
        super(TokenType.HEADER6, token.literal, 6);
    }
}

export class ParagraphNode extends MarkdownNode {
    constructor(token: Token, public text: string) {
        super(TokenType.TEXT, token.literal);
    }
}

export class ListNode extends MarkdownNode {
    constructor(
        token: Token,
        public ordered: boolean,
        public items: ListItemNode[] = []
    ) {
        super(token.type as TokenType.UNORDERED_LIST | TokenType.ORDERED_LIST, token.literal);
        this.children = items;
    }
}

export abstract class ListRelatedNode extends MarkdownNode {
    constructor(
        public type: TokenType.LIST_ITEM | TokenType.CHECKLIST | TokenType.CHECKLIST_CHECKED,
        public value: string,
        public text: string
    ) {
        super(type, value);
    }
}

export class ListItemNode extends ListRelatedNode {
    constructor(token: Token, text: string) {
        super(TokenType.LIST_ITEM, token.literal, text);
    }
}

export class ChecklistNode extends ListRelatedNode {
    constructor(token: Token, text: string) {
        super(TokenType.CHECKLIST, token.literal, text);
    }
}

export class ChecklistCheckedNode extends ListRelatedNode {
    constructor(token: Token, text: string) {
        super(TokenType.CHECKLIST_CHECKED, token.literal, text);
    }
}

export class BlockquoteNode extends MarkdownNode {
    constructor(token: Token, public text: string) {
        super(TokenType.BLOCKQUOTE, token.literal);
        this.children = [new TextNode(token, text)];
    }
}

export class TextNode extends MarkdownNode {
    constructor(token: Token, text: string) {
        super(TokenType.TEXT, token.literal);
        this.value = text;
    }
}

export class HorizontalRuleNode extends MarkdownNode {
    constructor(token: Token) {
        super(TokenType.HORIZONTAL_RULE, token.literal);
    }
}

export abstract class LinkRelatedNode extends MarkdownNode {
    constructor(
        public type: TokenType.LINK_TEXT_START | TokenType.LINK_TEXT_END | TokenType.LINK_URL_START | TokenType.LINK_URL_END,
        public value: string,
        public text: string,
        public url: string
    ) {
        super(type, value);
    }
}

export class LinkNode extends LinkRelatedNode {
    constructor(token: Token, text: string, url: string) {
        super(TokenType.LINK_TEXT_START, token.literal, text, url);
    }
}

export class LinkTextNode extends LinkRelatedNode {
    constructor(token: Token, text: string, url: string) {
        super(TokenType.LINK_TEXT_START, token.literal, text, url);
    }
}

export class LinkUrlNode extends LinkRelatedNode {
    constructor(token: Token, text: string, url: string) {
        super(TokenType.LINK_URL_START, token.literal, text, url);
    }
}

export class LinkUrlEndNode extends LinkRelatedNode {
    constructor(token: Token, text: string, url: string) {
        super(TokenType.LINK_URL_END, token.literal, text, url);
    }
}

export abstract class TextFormattingNode extends MarkdownNode {
    constructor(
        public type: TokenType.BOLD | TokenType.ITALIC | TokenType.STRIKETHROUGH,
        public value: string,
        public text: string
    ) {
        super(type, value);
    }
}

export abstract class WhitespaceNode extends MarkdownNode {
    constructor(
        public type: TokenType.SPACE | TokenType.TAB | TokenType.NEWLINE,
        public value: string,
        public text: string
    ) {
        super(type, value);
    }
}

export class TabNode extends WhitespaceNode {
    constructor(token: Token) {
        super(TokenType.TAB, token.literal, '');
    }
}
export class BlankNode extends ParagraphNode {
    constructor(token: Token) {
        super(token, '');
    }
}

export class SpaceNode extends WhitespaceNode {
    constructor(token: Token) {
        super(TokenType.SPACE, token.literal, '');
    }
}

export class NewlineNode extends WhitespaceNode {
    constructor(token: Token) {
        super(TokenType.NEWLINE, token.literal, '');
    }
}

export class BoldNode extends TextFormattingNode {
    constructor(token: Token, text: string) {
        super(TokenType.BOLD, token.literal, text);
    }
}

export class ItalicNode extends TextFormattingNode {
    constructor(token: Token, text: string) {
        super(TokenType.ITALIC, token.literal, text);
    }
}

export class StrikethroughNode extends TextFormattingNode {
    constructor(token: Token, text: string) {
        super(TokenType.STRIKETHROUGH, token.literal, text);
    }
}

export abstract class CodeRelatedNode extends MarkdownNode {
    constructor(
        public type: TokenType.INLINE_CODE | TokenType.CODE_BLOCK,
        public value: string,
        public code: string
    ) {
        super(type, value);
    }
}

export class InlineCodeNode extends CodeRelatedNode {
    constructor(token: Token, code: string) {
        super(TokenType.INLINE_CODE, token.literal, code);
    }
}

export class CodeBlockNode extends CodeRelatedNode {
    constructor(token: Token, code: string, public language?: string) {
        super(TokenType.CODE_BLOCK, token.literal, code);
    }
}

export class IllegalNode extends MarkdownNode {
    constructor(token: Token) {
        super(TokenType.ILLEGAL, token.literal);
    }
}

export class EOFNode extends MarkdownNode {
    constructor(token: Token) {
        super(TokenType.EOF, token.literal);
    }
}

export class DocumentNode extends MarkdownNode {
    children: MarkdownNode[];

    constructor(children: MarkdownNode[] = []) {
        super(TokenType.DOCUMENT, "document");
        this.children = children;
    }

    render(): string {
        return this.children.map(child => child.render()).join("\n");
    }
}

