import path from 'path';
import fs from 'fs';

function checkEnv() {
    console.log("Checking environment...");
    console.log("CWD:", process.cwd());
    
    const envPaths = [
        path.resolve(process.cwd(), '.env.local'),
        path.resolve(process.cwd(), 'genesis-engine', '.env.local')
    ];

    for (const p of envPaths) {
        if (fs.existsSync(p)) {
            console.log(`Found .env.local at: ${p}`);
            const content = fs.readFileSync(p, 'utf-8');
            const lines = content.split(/\r?\n/);
            for (const line of lines) {
                if (line.includes('API_KEY')) {
                    const parts = line.split('=');
                    const key = parts[0]?.trim();
                    const value = parts[1]?.trim();
                    console.log(`- ${key}: ${value && value.length > 0 ? 'PRESENT' : 'EMPTY'}`);
                }
            }
        } else {
            console.log(`Not found: ${p}`);
        }
    }
}

checkEnv();
