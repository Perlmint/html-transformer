var ts = require("typescript");
var fs = require('fs');
var Path = require('path');
var glob = require('glob');

function compile(fileNames, outDir) {
    const tsconfig = JSON.parse(fs.readFileSync(Path.resolve(__dirname, '../tsconfig.json'), 'utf8'));

    fileNames = fileNames.map(n => glob.sync(n, {absolute:true})).reduce((a, b) => a.concat(b), []);
    const commonRoot = fileNames.map(p => p.split("/")).reduce((prev, p) => {
        if (prev == null) {
            return p;
        } else {
            for (var i = 0; i < p.length; ++i) {
                if (p[i] != prev[i]) {
                    return p.slice(0, i);
                }
            }
        }
    }, null).join("/");
    if (fileNames.length > 1) {
        tsconfig.compilerOptions.rootDir = commonRoot;
    }
    tsconfig.compilerOptions.rootDirs = [Path.resolve(__dirname, '../node_modules')];
    outDir = Path.isAbsolute(outDir) ? outDir : Path.join(__dirname, '..', outDir);
    tsconfig.compilerOptions.outDir = outDir;
    if (tsconfig.compilerOptions.declaration) {
        tsconfig.compilerOptions.declarationDir = outDir;
    }
    tsconfig.compilerOptions.target = {
        ES3: ts.ScriptTarget.ES3,
        ES5: ts.ScriptTarget.ES5,
        ES6: ts.ScriptTarget.ES2015,
        ES2015: ts.ScriptTarget.ES2015,
        ES7: ts.ScriptTarget.ES2016,
        ES2016: ts.ScriptTarget.ES2016,
        ES8: ts.ScriptTarget.ES2017,
        ES2017: ts.ScriptTarget.ES2017,
        ESNEXT: ts.ScriptTarget.ESNext,
        NEXT: ts.ScriptTarget.ESNext,
        LATEST: ts.ScriptTarget.Latest
    }[tsconfig.compilerOptions.target.toUpperCase()];
    tsconfig.compilerOptions.moduleResolution = {
        NODE: ts.ModuleResolutionKind.NodeJs,
        CLASSIC: ts.ModuleResolutionKind.Classic
    }[tsconfig.compilerOptions.moduleResolution.toUpperCase()];

    let program = ts.createProgram(fileNames, tsconfig.compilerOptions);
    let emitResult = program.emit();

    let allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

    allDiagnostics.forEach(diagnostic => {
        let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
        if (diagnostic.file != null) {
            let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
            console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
        } else {
            console.log(message);
        }
    });

    let exitCode = emitResult.emitSkipped ? 1 : 0;
    console.log(`Process exiting with code '${exitCode}'.`);
    process.exit(exitCode);
}

compile(process.argv.slice(3), process.argv[2]);