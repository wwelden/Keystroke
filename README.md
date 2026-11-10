# Keystroke
A markdown parser and compiler written in TypeScript

**Live demo:** https://keystroke-xi.vercel.app — type Markdown and watch the rendered output, generated HTML, token stream, and AST update as you go.

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

- Run tests with `bun run test`
- Run with `ts-node src/index.ts`
- Build the browser playground with `bun run build:web` (outputs `public/js/keystroke.js`)

## Testing

Tests are written in TypeScript and use Jest with ts-jest. The full suite covers
the Markdown parser and renderer, HTML-to-LaTeX conversion, and LaTeX-to-HTML
conversion, including lexers, tokens, AST nodes, parsers, and renderers.

To reproduce CI locally, use Node.js 24 and Bun 1.3.13:

```bash
bun install --frozen-lockfile
bun run test --ci --runInBand
```

Bun imports the committed `package-lock.json` for the install. Keep that lockfile
in sync with `package.json` when changing dependencies (for example, with
`npm install`). Remove any locally generated `bun.lock` before reinstalling so Bun
continues to use `package-lock.json`; this project does not maintain `bun.lock`.

The [unit test workflow](.github/workflows/unit-tests.yml) runs on every push and
pull request. It removes the repository's tracked `node_modules` before installing
locked dependencies, then runs every `tests/**/*.test.ts` suite through Jest.
Install errors or failing tests fail the job. `--ci` prevents interactive behavior
and automatic snapshot updates; `--runInBand` runs suites serially.

## Architecture

The parser follows a traditional compiler architecture:

1. **Lexer** (`src/Lexer.ts`): Tokenizes markdown input
2. **Parser** (`src/Parser.ts`): Builds an Abstract Syntax Tree (AST)
3. **AST** (`src/Ast.ts`): Node types representing markdown elements
4. **Renderer** (`src/Renderer.ts`): Converts AST to HTML output

## Development

```bash
# Install dependencies
bun install --frozen-lockfile

# Run tests
bun run test

# Run the parser
ts-node src/index.ts

# Compile TypeScript
npx tsc
```
