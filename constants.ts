
import type { CodeFile } from './types';

export const MOCK_FILE_SYSTEM: CodeFile[] = [
    {
        path: 'src/api/client.ts',
        content: `import { getAuthToken } from '../services/auth.ts';

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
`,
    },
    {
        path: 'src/services/auth.ts',
        content: `import { ApiClient } from '../api/client.ts'; // Oh no! Circular dependency

let authToken = 'secret-token-123';

export function getAuthToken() {
    // This function creates a tight coupling
    const client = new ApiClient(); 
    console.log('Auth service is using the API client...');
    return authToken;
}

export function setAuthToken(token) {
    authToken = token;
}
`,
    },
    {
        path: 'src/utils/formatters.ts',
        content: `
export function formatDate(date) {
    return date.toLocaleDateString('en-US');
}

export function formatCurrency(amount) {
    return \`$\${amount.toFixed(2)}\`;
}
`,
    },
    {
        path: 'src/components/UserProfile.tsx',
        content: `import { ApiClient } from '../api/client.ts';
import { formatDate } from '../utils/formatters.ts';

export const UserProfile = ({ userId }) => {
    const client = new ApiClient();
    const user = client.fetchData(\`/users/\${userId}\`);
    const joinDate = new Date();

    return (
        '<div>' +
        '<h2>User Profile</h2>' +
        '<p>Joined on: ' + formatDate(joinDate) + '</p>' +
        '</div>'
    );
};
`,
    },
    {
        path: 'src/components/Settings.tsx',
        content: `import { ApiClient } from '../api/client.ts';
import { formatCurrency } from '../utils/formatters.ts';

export const Settings = () => {
    const client = new ApiClient();
    const settings = client.fetchData('/settings');
    const balance = 123.45;

    return (
        '<div>' +
        '<h2>Settings</h2>' +
        '<p>Balance: ' + formatCurrency(balance) + '</p>' +
        '</div>'
    );
};
`,
    },
    {
        path: 'src/legacy/old-utils.ts',
        content: `// This file contains deprecated functions.

export function oldUnusedFunction() {
    console.log("I am never called.");
    return true;
}

export function anotherOldOne() {
    return 'still here';
}
`,
    },
];
