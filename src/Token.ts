// Define all possible token types
export enum TokenType {
    // Headers
    HEADER1 = 'HEADER1',
    HEADER2 = 'HEADER2',
    HEADER3 = 'HEADER3',
    HEADER4 = 'HEADER4',
    HEADER5 = 'HEADER5',
    HEADER6 = 'HEADER6',

    // Lists
    UNORDERED_LIST = 'UNORDERED_LIST',
    ORDERED_LIST = 'ORDERED_LIST',
    LIST_ITEM = 'LIST_ITEM',
    CHECKLIST = 'CHECKLIST',
    CHECKLIST_CHECKED = 'CHECKLIST_CHECKED',

    // Text formatting
    BOLD = 'BOLD',
    ITALIC = 'ITALIC',
    STRIKETHROUGH = 'STRIKETHROUGH',
    UNDERLINE = 'UNDERLINE',

    SUPERSCRIPT = 'SUPERSCRIPT',
    SUBSCRIPT = 'SUBSCRIPT',
    // HIGHLIGHT = 'HIGHLIGHT',
    // COLOR = 'COLOR',
    MATH = 'MATH',

    // Code
    INLINE_CODE = 'INLINE_CODE',
    CODE_BLOCK = 'CODE_BLOCK',

    // Links and images
    LINK_TEXT_START = 'LINK_TEXT_START',
    LINK_TEXT_END = 'LINK_TEXT_END',
    LINK_URL_START = 'LINK_URL_START',
    LINK_URL_END = 'LINK_URL_END',
    // IMAGE = 'IMAGE',

    // Other
    BLOCKQUOTE = 'BLOCKQUOTE',
    HORIZONTAL_RULE = 'HORIZONTAL_RULE',
    TEXT = 'TEXT',           // Regular text
    EOF = 'EOF',            // End of file
    ILLEGAL = 'ILLEGAL',     // Unknown token
    DOCUMENT = 'DOCUMENT',   // Root node
    PARAGRAPH = 'PARAGRAPH',   // Paragraph

    //whitespace
    SPACE = 'SPACE',
    TAB = 'TAB',
    NEWLINE = 'NEWLINE',

}

export class Token {
    constructor(
        public type: TokenType,
        public literal: string
    ) {}
}

// Map of markdown symbols to their corresponding token types
export const keywords: { [key: string]: TokenType } = {
    '#': TokenType.HEADER1,
    '##': TokenType.HEADER2,
    '###': TokenType.HEADER3,
    '####': TokenType.HEADER4,
    '#####': TokenType.HEADER5,
    '######': TokenType.HEADER6,

    '*': TokenType.UNORDERED_LIST,
    '1.': TokenType.ORDERED_LIST,
    '-': TokenType.LIST_ITEM,
    '- [ ]': TokenType.CHECKLIST,
    '- [x]': TokenType.CHECKLIST_CHECKED,

    '**': TokenType.BOLD,
    '_': TokenType.ITALIC,
    '~~': TokenType.STRIKETHROUGH,

    '`': TokenType.INLINE_CODE,
    '```': TokenType.CODE_BLOCK,

    '[': TokenType.LINK_TEXT_START,
    ']': TokenType.LINK_TEXT_END,
    '(': TokenType.LINK_URL_START,
    ')': TokenType.LINK_URL_END,
    // '![': TokenType.IMAGE,

    '>': TokenType.BLOCKQUOTE,
    '---': TokenType.HORIZONTAL_RULE,
    '$': TokenType.MATH,
    '^': TokenType.SUPERSCRIPT,
    '~': TokenType.SUBSCRIPT,
};
