
import type { CodeFile, RefactoringTask } from '../types';

export class RefactoringEngine {
    public static execute(files: CodeFile[], task: RefactoringTask): CodeFile[] {
        switch (task.id) {
            case 'CIRCULAR_DEP_AUTH_CLIENT':
                return this.breakCircularDependencyAuthClient(files);
            case 'DEAD_CODE_OLD_UTILS':
                return this.removeDeadCodeOldUtils(files);
            default:
                return files;
        }
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

    private static removeDeadCodeOldUtils(files: CodeFile[]): CodeFile[] {
        const newFiles = files.map(f => ({ ...f }));
        const oldUtilsFile = newFiles.find(f => f.path === 'src/legacy/old-utils.ts');

        if (oldUtilsFile) {
            oldUtilsFile.content = `// This file contained deprecated functions.
// The dead code has been removed by the AI agent.

/*
export function oldUnusedFunction() {
    console.log("I am never called.");
    return true;
}

export function anotherOldOne() {
    return 'still here';
}
*/
`;
        }
        return newFiles;
    }
}
