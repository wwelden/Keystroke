// Token definitions for the LaTeX -> HTML converter.
// Ported from the Go package keystroke/latek/tokens.

export enum TokenType {
    // LaTeX sectioning commands
    SECTION = 'SECTION',
    SUBSECTION = 'SUBSECTION',
    SUBSUBSECTION = 'SUBSUBSECTION',
    PARAGRAPH = 'PARAGRAPH',
    SUBPARAGRAPH = 'SUBPARAGRAPH',

    // Text formatting commands
    TEXTBF = 'TEXTBF',                   // \textbf{}
    TEXTIT = 'TEXTIT',                   // \textit{}
    UNDERLINE = 'UNDERLINE',             // \underline{}
    SOUT = 'SOUT',                       // \sout{}
    TEXTSUPERSCRIPT = 'TEXTSUPERSCRIPT', // \textsuperscript{}
    TEXTSUBSCRIPT = 'TEXTSUBSCRIPT',     // \textsubscript{}
    TEXTTT = 'TEXTTT',                   // \texttt{}

    // Environment commands
    BEGIN = 'BEGIN', // \begin{}
    END = 'END',     // \end{}

    // Environment types
    ITEMIZE = 'ITEMIZE',
    ENUMERATE = 'ENUMERATE',
    TABULAR = 'TABULAR',
    QUOTE = 'QUOTE',
    LSTLISTING = 'LSTLISTING',

    // List commands
    ITEM = 'ITEM', // \item

    // Links and references
    HREF = 'HREF', // \href{}{}

    // Math delimiters
    MATH_INLINE = 'MATH_INLINE',   // $...$
    MATH_DISPLAY = 'MATH_DISPLAY', // $$...$$

    // Table commands
    TOPRULE = 'TOPRULE',
    MIDRULE = 'MIDRULE',
    BOTTOMRULE = 'BOTTOMRULE',

    // Line breaks and spacing
    LINEBREAK = 'LINEBREAK', // \\
    HRULE = 'HRULE',         // \hrule

    // Document structure
    DOCUMENTCLASS = 'DOCUMENTCLASS', // \documentclass{}
    USEPACKAGE = 'USEPACKAGE',       // \usepackage{}

    // Content types
    TEXT = 'TEXT',
    COMMAND = 'COMMAND',
    COMMENT = 'COMMENT',

    // Structural tokens
    BACKSLASH = 'BACKSLASH',
    LBRACE = 'LBRACE',
    RBRACE = 'RBRACE',
    LBRACKET = 'LBRACKET',
    RBRACKET = 'RBRACKET',
    AMPERSAND = 'AMPERSAND',
    DOLLAR = 'DOLLAR',
    CARET = 'CARET',
    UNDERSCORE = 'UNDERSCORE',
    PERCENT = 'PERCENT',

    // Special tokens
    WHITESPACE = 'WHITESPACE',
    NEWLINE = 'NEWLINE',
    EOF = 'EOF',
    ILLEGAL = 'ILLEGAL',
}

const COMMAND_TYPES: ReadonlySet<TokenType> = new Set([
    TokenType.SECTION, TokenType.SUBSECTION, TokenType.SUBSUBSECTION,
    TokenType.PARAGRAPH, TokenType.SUBPARAGRAPH, TokenType.TEXTBF,
    TokenType.TEXTIT, TokenType.UNDERLINE, TokenType.SOUT,
    TokenType.TEXTSUPERSCRIPT, TokenType.TEXTSUBSCRIPT, TokenType.TEXTTT,
    TokenType.ITEM, TokenType.HREF, TokenType.LINEBREAK, TokenType.HRULE,
]);

const ENVIRONMENT_TYPES: ReadonlySet<TokenType> = new Set([
    TokenType.ITEMIZE, TokenType.ENUMERATE, TokenType.TABULAR,
    TokenType.QUOTE, TokenType.LSTLISTING,
]);

const STRUCTURAL_TYPES: ReadonlySet<TokenType> = new Set([
    TokenType.LBRACE, TokenType.RBRACE, TokenType.LBRACKET,
    TokenType.RBRACKET, TokenType.BACKSLASH, TokenType.AMPERSAND,
]);

export class Token {
    constructor(
        public type: TokenType,
        public literal: string,
        public value: string = '',   // For commands, the content inside braces
        public options: string = '', // For commands with optional parameters
        public position: number = 0, // Position in source (never populated by the lexer, as in Go)
    ) {}

    /** True if the token is a LaTeX command. */
    isCommand(): boolean {
        return COMMAND_TYPES.has(this.type);
    }

    /** True if the token is an environment name. */
    isEnvironment(): boolean {
        return ENVIRONMENT_TYPES.has(this.type);
    }

    /** True if the token is a structural element. */
    isStructural(): boolean {
        return STRUCTURAL_TYPES.has(this.type);
    }
}

export function newToken(type: TokenType, literal: string): Token {
    return new Token(type, literal);
}

export function newTokenWithValue(type: TokenType, literal: string, value: string): Token {
    return new Token(type, literal, value);
}

export function newTokenWithOptions(type: TokenType, literal: string, value: string, options: string): Token {
    return new Token(type, literal, value, options);
}
