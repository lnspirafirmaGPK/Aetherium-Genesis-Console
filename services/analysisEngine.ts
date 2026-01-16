
import type { CodeFile, CodeSymbol, Dependency, AnalysisResult } from '../types';

// Declare acorn, which is loaded from a script tag in index.html
declare const acorn: any;

export class AnalysisEngine {
    private files: CodeFile[];
    private dependencies: Dependency[] = [];
    private symbols: Map<string, CodeSymbol[]> = new Map();
    private usages: Map<string, number> = new Map(); // Map<symbolKey, usageCount>

    constructor(files: CodeFile[]) {
        this.files = files;
    }

    public runFullAnalysis(): AnalysisResult {
        this.reset();
        this.parseAllFiles();
        
        const deadCodeInfo = this.findDeadCode();
        const circularDepsInfo = this.findCircularDependencies();

        return {
            dependencies: this.dependencies,
            symbols: this.symbols,
            deadCodeSymbols: deadCodeInfo.deadSymbols,
            deadCodeFiles: deadCodeInfo.deadFiles,
            circularDependencies: circularDepsInfo.cycles,
            circularDependencyFiles: circularDepsInfo.cycleFiles,
        };
    }

    private reset() {
        this.dependencies = [];
        this.symbols = new Map();
        this.usages = new Map();
    }

    private parseAllFiles() {
        const asts = new Map<string, any>();
        this.files.forEach(file => {
            try {
                const ast = acorn.parse(file.content, { ecmaVersion: 'latest', sourceType: 'module' });
                asts.set(file.path, ast);
            } catch (e) {
                console.error(`[AnalysisEngine] Failed to parse AST for ${file.path}. Analysis may be incomplete.`, e);
                asts.set(file.path, { body: [] }); // Use an empty AST on failure
            }
        });

        // Pass 1: Parse all symbols and dependencies from ASTs
        this.files.forEach(file => {
            const ast = asts.get(file.path);
            if (ast) {
                this.symbols.set(file.path, this.parseSymbols(ast));
                this.dependencies.push(...this.parseDependencies(file.path, ast));
            }
        });

        // Pass 2: Calculate symbol usages based on parsed dependencies
        this.files.forEach(file => {
            const ast = asts.get(file.path);
            if (ast) {
                const importedSymbols = this.getImportedSymbols(ast);
                importedSymbols.forEach(symbolName => {
                    const exportingFile = this.files.find(f => {
                        const fileSymbols = this.symbols.get(f.path) || [];
                        return fileSymbols.some(s => s.exported && s.name === symbolName);
                    });

                    if (exportingFile) {
                        const key = `${exportingFile.path}::${symbolName}`;
                        this.usages.set(key, (this.usages.get(key) || 0) + 1);
                    }
                });
            }
        });
    }

    private parseSymbols(ast: any): CodeSymbol[] {
        const symbols: CodeSymbol[] = [];
        if (!ast.body) return symbols;

        ast.body.forEach((node: any) => {
            if (node.type === 'ExportNamedDeclaration' && node.declaration) {
                const declaration = node.declaration;
                let type: 'function' | 'class' | 'variable' = 'variable';
                let name = '';

                if (declaration.type === 'FunctionDeclaration' || declaration.type === 'ClassDeclaration') {
                    name = declaration.id.name;
                    type = declaration.type === 'FunctionDeclaration' ? 'function' : 'class';
                } else if (declaration.type === 'VariableDeclaration') {
                    if (declaration.declarations[0] && declaration.declarations[0].id.type === 'Identifier') {
                        name = declaration.declarations[0].id.name;
                        type = 'variable';
                    }
                }
                
                if (name) {
                    symbols.push({ name, type, exported: true });
                }
            }
        });
        return symbols;
    }

    private parseDependencies(filePath: string, ast: any): Dependency[] {
        const deps: Dependency[] = [];
        if (!ast.body) return deps;

        const basePath = filePath.substring(0, filePath.lastIndexOf('/'));

        ast.body.forEach((node: any) => {
            if (node.type === 'ImportDeclaration' && node.source.value) {
                const importPath = node.source.value.replace(/\.ts(x)?/, '');
                
                // Resolve relative path
                const pathParts = basePath.split('/');
                const importParts = importPath.split('/');
                
                importParts.forEach(part => {
                    if (part === '..') {
                        pathParts.pop();
                    } else if (part !== '.') {
                        pathParts.push(part);
                    }
                });
                const resolvedPath = pathParts.join('/') + '.ts';
                
                const targetFile = this.files.find(f => f.path === resolvedPath || f.path === resolvedPath + 'x');
                if(targetFile) {
                    deps.push({ from: filePath, to: targetFile.path });
                }
            }
        });
        return deps;
    }

    private getImportedSymbols(ast: any): string[] {
        const symbols: string[] = [];
        if (!ast.body) return symbols;

        ast.body.forEach((node: any) => {
            if (node.type === 'ImportDeclaration') {
                node.specifiers.forEach((specifier: any) => {
                    if (specifier.type === 'ImportSpecifier') {
                        symbols.push(specifier.imported.name);
                    }
                });
            }
        });
        return symbols;
    }

    private findDeadCode(): { deadSymbols: { path: string, symbolName: string }[], deadFiles: string[] } {
        const deadSymbols: { path: string, symbolName: string }[] = [];
        this.symbols.forEach((symbols, path) => {
            symbols.forEach(symbol => {
                if (symbol.exported) {
                    const key = `${path}::${symbol.name}`;
                    if (!this.usages.has(key)) {
                        deadSymbols.push({ path, symbolName: symbol.name });
                    }
                }
            });
        });
        
        const deadFiles = this.files.filter(file => {
            const fileSymbols = this.symbols.get(file.path) || [];
            if (fileSymbols.length === 0) return false;
            return fileSymbols.every(symbol => deadSymbols.some(ds => ds.path === file.path && ds.symbolName === symbol.name));
        }).map(f => f.path);


        return { deadSymbols, deadFiles };
    }

    private findCircularDependencies(): { cycles: string[][], cycleFiles: string[][] } {
        const graph: { [key: string]: string[] } = {};
        this.files.forEach(f => graph[f.path] = []);
        this.dependencies.forEach(dep => {
            if (graph[dep.from]) {
                graph[dep.from].push(dep.to);
            }
        });

        const cycles: string[][] = [];
        const visiting = new Set<string>();
        const visited = new Set<string>();

        const dfs = (node: string, path: string[]) => {
            visiting.add(node);
            path.push(node);

            for (const neighbor of (graph[node] || [])) {
                if (visiting.has(neighbor)) {
                    const cycle = path.slice(path.indexOf(neighbor));
                    const sortedCycle = [...cycle].sort();
                    if (!cycles.some(c => JSON.stringify([...c].sort()) === JSON.stringify(sortedCycle))) {
                       cycles.push(cycle);
                    }
                } else if (!visited.has(neighbor)) {
                    dfs(neighbor, [...path]);
                }
            }
            visiting.delete(node);
            visited.add(node);
        };
        
        this.files.forEach(file => {
            if (!visited.has(file.path)) {
                dfs(file.path, []);
            }
        });
        
        const cycleFiles = cycles;

        return { cycles: cycles.map(cycle => cycle.map(path => this.getFileName(path))), cycleFiles };
    }

    private getFileName(path: string): string {
        return path.split('/').pop() || path;
    }
}
