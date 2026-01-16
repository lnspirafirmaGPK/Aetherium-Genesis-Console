import type { CodeFile, RefactoringTask } from '../types';

export class RefactoringEngine {
    public static execute(files: CodeFile[], task: RefactoringTask): CodeFile[] {
        if (task.id.startsWith('SPLIT_UTILITIES')) {
            return this.splitUtilities(files, task.filesInvolved[0]);
        }

        switch (task.type) {
            case 'BREAK_CIRCULAR_DEPENDENCY':
                return this.breakCircularDependencyAuthClient(files);
            case 'REMOVE_DEAD_CODE':
                return this.removeDeadCode(files, task.filesInvolved[0]);
            case 'REVIEW_ABSTRACTION':
                 return files;
            default:
                return files;
        }
    }

    private static removeDeadCode(files: CodeFile[], filePath: string): CodeFile[] {
        const newFiles = files.map(f => ({ ...f }));
        const fileToModify = newFiles.find(f => f.path === filePath);

        if (fileToModify) {
            const originalContent = fileToModify.content;
            fileToModify.content = `// This file contained deprecated functions or functions that were not used.\n` +
                                  `// The dead code has been commented out by the AI agent.\n\n` +
                                  `/*\n${originalContent.trim()}\n*/\n`;
        }
        return newFiles;
    }

    private static breakCircularDependencyAuthClient(files: CodeFile[]): CodeFile[] {
        let newFiles = files.map(f => ({ ...f })); 

        const authFile = newFiles.find(f => f.path === 'src/services/auth.ts');
        const clientFile = newFiles.find(f => f.path === 'src/api/client.ts');

        const tokenProviderFile: CodeFile = {
            path: 'src/services/tokenProvider.ts',
            content: `
let authToken = 'secret-token-123';

export function getAuthToken() {
    return authToken;
}

export function setAuthToken(token) {
    authToken = token;
}
`
        };

        if (authFile) {
            authFile.content = `import { setAuthToken as setProviderToken } from './tokenProvider.ts';

// This function now uses the provider to set the token,
// removing the need for a direct dependency on ApiClient.
export function setAuthToken(token) {
    console.log('Setting auth token via provider.');
    setProviderToken(token);
}
`;
        }
        
        if (clientFile) {
            clientFile.content = `import { getAuthToken } from '../services/tokenProvider.ts';

export class ApiClient {
    constructor() {
        console.log('API Client initialized');
    }

    fetchData(endpoint) {
        const token = getAuthToken();
        console.log(\`Fetching \${endpoint} with token \${token}\`);
        return { success: true };
    }
}
`;
        }

        // Add the new file and ensure auth.ts still exists
        newFiles = newFiles.filter(f => f.path !== 'src/services/auth.ts' || authFile);
        if (authFile) {
            const index = newFiles.findIndex(f => f.path === 'src/services/auth.ts');
            if (index !== -1) {
                newFiles[index] = authFile;
            }
        }
        
        return [...newFiles, tokenProviderFile];
    }

    private static splitUtilities(files: CodeFile[], filePath: string): CodeFile[] {
        let newFiles = files.map(f => ({ ...f }));
        const sourceFile = newFiles.find(f => f.path === filePath);

        if (!sourceFile || !sourceFile.content.includes('formatCurrency')) return newFiles;

        // Simulate splitting formatters.ts
        const newFormattersFile: CodeFile = {
            path: 'src/utils/formatters-date.ts',
            content: `
export function formatDate(date) {
    return date.toLocaleDateString('en-US');
}
`
        };
        
        const newCurrencyFile: CodeFile = {
            path: 'src/utils/formatters-currency.ts',
            content: `
export function formatCurrency(amount) {
    return \`$\${amount.toFixed(2)}\`;
}
`
        };

        // Update files that import from the original file
        const userProfileFile = newFiles.find(f => f.path === 'src/components/UserProfile.tsx');
        if (userProfileFile) {
            userProfileFile.content = userProfileFile.content.replace(`from '../utils/formatters.ts'`, `from '../utils/formatters-date.ts'`);
        }

        const settingsFile = newFiles.find(f => f.path === 'src/components/Settings.tsx');
        if (settingsFile) {
            settingsFile.content = settingsFile.content.replace(`from '../utils/formatters.ts'`, `from '../utils/formatters-currency.ts'`);
        }
        
        // Remove the original file and add the new ones
        newFiles = newFiles.filter(f => f.path !== filePath);
        newFiles.push(newFormattersFile, newCurrencyFile);

        return newFiles;
    }
}