import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
    DEFAULT_INPUT_PATH,
    compileFile,
    compileMarkdown,
    main,
    resolveInputPath,
} from '../src/index';

describe('CLI entry point', () => {
    describe('resolveInputPath', () => {
        it('defaults to tests/test-files/file1.md when no argument is given', () => {
            expect(resolveInputPath(undefined, '/somewhere/else')).toBe(DEFAULT_INPUT_PATH);
            expect(DEFAULT_INPUT_PATH).toBe(
                path.resolve(__dirname, 'test-files', 'file1.md')
            );
            expect(fs.existsSync(DEFAULT_INPUT_PATH)).toBe(true);
        });

        it('resolves a relative argument against the working directory', () => {
            expect(resolveInputPath('./notes.md', '/home/user/docs')).toBe(
                path.resolve('/home/user/docs', 'notes.md')
            );
            expect(resolveInputPath('sub/notes.md', '/home/user/docs')).toBe(
                path.resolve('/home/user/docs', 'sub', 'notes.md')
            );
        });

        it('keeps an absolute argument as-is', () => {
            const absolute = path.resolve('/tmp', 'notes.md');
            expect(resolveInputPath(absolute, '/home/user/docs')).toBe(absolute);
        });
    });

    describe('compileFile', () => {
        let tmpDir: string;

        beforeEach(() => {
            tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'keystroke-cli-'));
        });

        afterEach(() => {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        });

        it('compiles a Markdown file outside tests/test-files', () => {
            const inputPath = path.join(tmpDir, 'notes.md');
            fs.writeFileSync(inputPath, '# Notes\n');
            const outputDir = path.join(tmpDir, 'out');

            const outputPath = compileFile(inputPath, outputDir);

            expect(outputPath).toBe(path.join(outputDir, 'notes.html'));
            expect(fs.readFileSync(outputPath, 'utf8')).toBe(compileMarkdown('# Notes\n'));
            expect(fs.readFileSync(outputPath, 'utf8')).toContain('<h1>Notes</h1>');
        });

        it('throws when the input file does not exist', () => {
            expect(() => compileFile(path.join(tmpDir, 'missing.md'), tmpDir)).toThrow();
        });
    });

    describe('main', () => {
        let tmpDir: string;

        beforeEach(() => {
            tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'keystroke-cli-'));
            jest.spyOn(console, 'log').mockImplementation(() => {});
            jest.spyOn(console, 'error').mockImplementation(() => {});
        });

        afterEach(() => {
            jest.restoreAllMocks();
            fs.rmSync(tmpDir, { recursive: true, force: true });
        });

        it('compiles the path given relative to the working directory', () => {
            fs.mkdirSync(path.join(tmpDir, 'docs'));
            fs.writeFileSync(path.join(tmpDir, 'docs', 'notes.md'), '**bold**\n');
            const outputDir = path.join(tmpDir, 'out');

            expect(main(['docs/notes.md'], tmpDir, outputDir)).toBe(0);
            expect(fs.readFileSync(path.join(outputDir, 'notes.html'), 'utf8')).toContain('<b>bold</b>');
        });

        it('compiles tests/test-files/file1.md when no path is given', () => {
            const outputDir = path.join(tmpDir, 'out');

            expect(main([], tmpDir, outputDir)).toBe(0);
            expect(fs.readFileSync(path.join(outputDir, 'file1.html'), 'utf8')).toBe(
                compileMarkdown(fs.readFileSync(DEFAULT_INPUT_PATH, 'utf8'))
            );
        });

        it('returns 1 and reports the resolved path when the file is missing', () => {
            expect(main(['missing.md'], tmpDir, tmpDir)).toBe(1);
            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining(path.join(tmpDir, 'missing.md'))
            );
        });

        it('runs as `bun src/index.ts <path>` and resolves the path from the cwd', () => {
            const result = spawnSync('bun', [path.resolve(__dirname, '..', 'src', 'index.ts'), 'missing.md'], {
                cwd: tmpDir,
                encoding: 'utf8',
            });

            expect(result.error).toBeUndefined();
            expect(result.status).toBe(1);
            expect(result.stderr).toContain(path.join(fs.realpathSync(tmpDir), 'missing.md'));
        });
    });
});
