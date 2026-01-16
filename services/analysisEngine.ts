import type { CodeFile, CodeSymbol, Dependency, AnalysisResult, ModularityMetrics, RefactoringTask } from '../types';

// Declare acorn, which is loaded from a script tag in index.html
declare const acorn: any;

export class AnalysisEngine {
    private files: CodeFile[];
    private dependencies: Dependency[] = [];
    private symbols: Map<string, CodeSymbol[]> = new Map();
    private usages: Map<string, number> = new Map(); // Map<symbolKey, usageCount>
    private modularityMetrics: Map<string, ModularityMetrics> = new Map();

    constructor(files: CodeFile[]) {
        this.files = files;
    }

    public runFullAnalysis(): AnalysisResult {
        this.reset();
        this.parseAllFiles();
        
        const deadCodeInfo = this.findDeadCode();
        const circularDepsInfo = this.findCircularDependencies();
        const heatScores = this.calculateAllHeatScores();

        return {
            dependencies: this.dependencies,
            symbols: this.symbols,
            deadCodeSymbols: deadCodeInfo.deadSymbols,
            deadCodeFiles: deadCodeInfo.deadFiles,
            circularDependencies: circularDepsInfo.cycles,
            circularDependencyFiles: circularDepsInfo.cycleFiles,
            modularityMetrics: this.modularityMetrics,
            heatScores,
        };
    }

    public generateDynamicTasks(filePath: string): RefactoringTask[] {
        const metrics = this.modularityMetrics.get(filePath);
        const dynamicTasks: RefactoringTask[] = [];

        if (!metrics) return dynamicTasks;

        // Proposal for highly coupled files (many dependents)
        if (metrics.inDegree > 3) {
            dynamicTasks.push({
                id: `REVIEW_ABSTRACTION_${filePath}`,
                type: 'REVIEW_ABSTRACTION',
                titleKey: 'task_dyn_abstraction_title',
                descriptionKey: 'task_dyn_abstraction_desc',
                filesInvolved: [filePath],
                planKeys: ['task_dyn_abstraction_plan_1', 'task_dyn_abstraction_plan_2'],
            });
        }
        
        // Proposal for files with low cohesion (many exports)
        if (metrics.exports > 2) {
             dynamicTasks.push({
                id: `SPLIT_UTILITIES_${filePath}`,
                type: 'SPLIT_UTILITIES',
                titleKey: 'task_dyn_split_utils_title',
                descriptionKey: 'task_dyn_split_utils_desc',
                filesInvolved: [filePath],
                planKeys: ['task_dyn_split_utils_plan_1', 'task_dyn_split_utils_plan_2', 'task_dyn_split_utils_plan_3'],
            });
        }

        return dynamicTasks;
    }

    private reset() {
        this.dependencies = [];
        this.symbols = new Map();
        this.usages = new Map();
        this.modularityMetrics = new Map();
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

        // Pass 2: Calculate modularity metrics
        this.files.forEach(file => {
            const outDegree = this.dependencies.filter(d => d.from === file.path).length;
            const inDegree = this.dependencies.filter(d => d.to === file.path).length;
            const exports = (this.symbols.get(file.path) || []).filter(s => s.exported).length;
            this.modularityMetrics.set(file.path, { inDegree, outDegree, exports });
        });

        // Pass 3: Calculate symbol usages based on parsed dependencies
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

    private calculateAllHeatScores(): Map<string, number> {
        const heatScores = new Map<string, number>();
        let maxInDegree = 0, maxOutDegree = 0, maxExports = 0;

        this.modularityMetrics.forEach(metrics => {
            if (metrics.inDegree > maxInDegree) maxInDegree = metrics.inDegree;
            if (metrics.outDegree > maxOutDegree) maxOutDegree = metrics.outDegree;
            if (metrics.exports > maxExports) maxExports = metrics.exports;
        });
        
        // Avoid division by zero
        maxInDegree = maxInDegree || 1;
        maxOutDegree = maxOutDegree || 1;
        maxExports = maxExports || 1;

        this.files.forEach(file => {
            const metrics = this.modularityMetrics.get(file.path);
            if (!metrics) {
                heatScores.set(file.path, 0);
                return;
            }

            const inDegreeNorm = metrics.inDegree / maxInDegree;
            const outDegreeNorm = metrics.outDegree / maxOutDegree;
            const exportsNorm = metrics.exports / maxExports;
            
            // Weighted score: Coupling (in/out degree) is more critical than cohesion (exports)
            const heat = (inDegreeNorm * 0.45) + (outDegreeNorm * 0.35) + (exportsNorm * 0.2);
            heatScores.set(file.path, Math.min(1, heat)); // Cap at 1
        });

        return heatScores;
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
