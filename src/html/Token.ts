// Token types for the HTML -> LaTeX lexer
export enum TokenType {
    // HTML Tags
    H1 = 'H1',
    H2 = 'H2',
    H3 = 'H3',
    H4 = 'H4',
    H5 = 'H5',
    H6 = 'H6',
    P = 'P',
    DIV = 'DIV',
    SPAN = 'SPAN',

    // Text formatting
    B = 'B',
    STRONG = 'STRONG',
    I = 'I',
    EM = 'EM',
    U = 'U',
    S = 'S',
    SUP = 'SUP',
    SUB = 'SUB',

    // Lists
    UL = 'UL',
    OL = 'OL',
    LI = 'LI',

    // Links and images
    A = 'A',
    IMG = 'IMG',

    // Code
    CODE = 'CODE',
    PRE = 'PRE',

    // Tables
    TABLE = 'TABLE',
    TR = 'TR',
    TD = 'TD',
    TH = 'TH',
    THEAD = 'THEAD',
    TBODY = 'TBODY',

    // Block elements
    BLOCKQUOTE = 'BLOCKQUOTE',
    HR = 'HR',
    BR = 'BR',

    // Special characters and content
    TEXT = 'TEXT',
    CONTENT = 'CONTENT',

    // Structural
    TAG_OPEN = 'TAG_OPEN',
    TAG_CLOSE = 'TAG_CLOSE',
    TAG_SELF_CLOSE = 'TAG_SELF_CLOSE',
    ATTRIBUTE = 'ATTRIBUTE',
    ATTR_NAME = 'ATTR_NAME',
    ATTR_VALUE = 'ATTR_VALUE',

    // Whitespace
    SPACE = 'SPACE',
    TAB = 'TAB',
    NEWLINE = 'NEWLINE',

    // Special tokens
    EOF = 'EOF',
    ILLEGAL = 'ILLEGAL',
    DOCUMENT = 'DOCUMENT',

    // Symbols
    LT = 'LT',                     // <
    GT = 'GT',                     // >
    SLASH = 'SLASH',               // /
    EQUALS = 'EQUALS',             // =
    QUOTE = 'QUOTE',               // "
    SINGLE_QUOTE = 'SINGLE_QUOTE', // '
}

export type Attributes = { [name: string]: string };

export class Token {
    public attributes: Attributes;

    constructor(
        public type: TokenType,
        public literal: string,
        attributes: Attributes = {}
    ) {
        this.attributes = attributes;
    }
}

export function newToken(type: TokenType, literal: string): Token {
    return new Token(type, literal, {});
}

export function newTokenWithAttributes(type: TokenType, literal: string, attributes: Attributes): Token {
    return new Token(type, literal, attributes);
}
