# Keystroke
A markdown parser and compiler written in TypeScript

## Features

- **Complete Markdown Parser**: Supports headers, bold, italic, strikethrough, lists, blockquotes, links, and more
- **Math Expressions**: Parse mathematical notation with superscript (`^`) and subscript (`~`) support
- **Checklists**: Support for GitHub-style task lists with `- [ ]` and `- [x]`
- **TypeScript**: Fully typed codebase with comprehensive test coverage
- **Modular Architecture**: Separate lexer, parser, AST, and renderer components

## Supported Markdown Elements

- **Headers**: `# H1` through `###### H6`
- **Text Formatting**: `**bold**`, `*italic*`, `~~strikethrough~~`
- **Lists**:
  - Unordered: `* item` or `- item`
  - Checklists: `- [ ] todo` and `- [x] done`
- **Blockquotes**: `> quoted text`
- **Links**: `[text](url)`
- **Code**: `` `inline code` ``
- **Math**: `$x^2 + y~1$` with superscript and subscript
- **Horizontal Rules**: `---`

## Usage

- Run tests with `npm test`
- Run with `ts-node src/index.ts`

## Testing

The project includes comprehensive test coverage with 103 tests across all components:

- **Token Tests**: 56 tests covering lexical analysis
- **AST Tests**: 35 tests for abstract syntax tree nodes
- **Lexer Tests**: 10 tests for tokenization
- **Renderer Tests**: 15 tests for HTML output generation
- **Interpreter Tests**: 9 tests for end-to-end processing
- **Parser Tests**: 13 tests for syntax parsing

All tests are written in TypeScript and use Jest as the testing framework.

## Architecture

The parser follows a traditional compiler architecture:

1. **Lexer** (`src/Lexer.ts`): Tokenizes markdown input
2. **Parser** (`src/Parser.ts`): Builds an Abstract Syntax Tree (AST)
3. **AST** (`src/Ast.ts`): Node types representing markdown elements
4. **Renderer** (`src/Renderer.ts`): Converts AST to HTML output

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run the parser
ts-node src/index.ts

# Compile TypeScript
npx tsc
```
