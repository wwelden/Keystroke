import { Lexer } from "./lexer";
import { Token, TokenType } from "./Token";
class Parser {
    private lexer: Lexer;
    private currentToken: Token;
    private peekToken: Token;
    private errors: string[];

    constructor(lexer: Lexer) {
        this.lexer = lexer;
        this.currentToken = new Token(TokenType.ILLEGAL, '');
        this.peekToken = new Token(TokenType.ILLEGAL, '');
        this.errors = [];
    }

    private nextToken(): void {
        this.currentToken = this.peekToken;
        this.peekToken = this.lexer.nextToken();
    }

    private peekTokenIs(t: TokenType): boolean {
        return this.peekToken.type === t;
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

    private parseHeader(): void {
        this.expectPeek(TokenType.HEADER1);
    }

    private parseList(): void {
        this.expectPeek(TokenType.UNORDERED_LIST);
    }

    private parseText(): void {
        this.expectPeek(TokenType.TEXT);
    }

    private parseBlockquote(): void {
        this.expectPeek(TokenType.BLOCKQUOTE);
    }

    private parseHorizontalRule(): void {
        this.expectPeek(TokenType.HORIZONTAL_RULE);
    }

    private parseLink(): void {
        this.expectPeek(TokenType.LINK);
    }

    // private parseImage(): void {
    //     this.expectPeek(TokenType.IMAGE);
    // }

    private parseLinkText(): void {
        this.expectPeek(TokenType.LINK_TEXT);
    }

    private parseLinkUrl(): void {
        this.expectPeek(TokenType.LINK_URL);
    }

    private parseLinkUrlEnd(): void {
        this.expectPeek(TokenType.LINK_URL_END);
    }

    private parseBold(): void {
        this.expectPeek(TokenType.BOLD);
    }

    private parseItalic(): void {
        this.expectPeek(TokenType.ITALIC);
    }

    private parseStrikethrough(): void {
        this.expectPeek(TokenType.STRIKETHROUGH);
    }

    private parseCode(): void {
        this.expectPeek(TokenType.CODE);
    }

    private parseCodeBlock(): void {
        this.expectPeek(TokenType.CODE_BLOCK);
    }

    private parseCodeBlockLanguage(): void {
        this.expectPeek(TokenType.CODE_BLOCK_LANGUAGE);
    }

    private parseCodeBlockLanguageEnd(): void {
        this.expectPeek(TokenType.CODE_BLOCK_LANGUAGE_END);
    }

    private parseCodeBlockEnd(): void {
        this.expectPeek(TokenType.CODE_BLOCK_END);
    }

    private parseCheckbox(): void {
        this.expectPeek(TokenType.CHECKLIST);
    }

    private parseCheckboxChecked(): void {
        this.expectPeek(TokenType.CHECKLIST_CHECKED);
    }

}
