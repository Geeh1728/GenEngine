import { NextRequest } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 60;

/**
 * THE IRON SHIELD PROXY (v21.0 MCP Hardened)
 * Objective: Securely proxy Gemini Live WebSockets without exposing keys to the client.
 */
export async function GET(req: NextRequest) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const origin = req.headers.get('origin');
    const host = req.headers.get('host');

    // SECURITY: Prevent Cross-Site WebSocket Hijacking (CSWSH)
    if (origin && !origin.includes(host || '')) {
        return new Response("Forbidden: Potential CSWSH Detected.", { 
            status: 403,
            headers: { 
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
            }
        });
    }

    if (!apiKey) {
        return new Response("Astra: GEMINI_API_KEY is missing from server environment.", { 
            status: 500,
            headers: { 
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY'
            }
        });
    }

    // 1. Validate WebSocket Upgrade
    if (req.headers.get('upgrade') !== 'websocket') {
        return new Response("Iron Shield: Upgrade Required.", { 
            status: 426,
            headers: { 
                'Upgrade': 'websocket',
                'X-Content-Type-Options': 'nosniff'
            }
        });
    }

    const GOOGLE_WS_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BiDiGenerateContent?key=${apiKey}`;

    try {
        // 2. Initialize Tunnel to Google
        // Using the native WebSocket support in Vercel Edge Runtime (v16+)
        const googleSocket = new WebSocket(GOOGLE_WS_URL);

        // 3. Establish the Bi-Directional Bridge
        // Note: This relies on the 'webSocket' field in Response, which is part of the 
        // WinterCG standard and supported in modern Edge runtimes.
        const [clientSocket, serverSocket] = (new (globalThis as any).WebSocketPair() as any);

        // A. Handle Server-Side Socket (The Proxy Logic)
        serverSocket.accept();

        // Relay: Client -> Google
        serverSocket.addEventListener('message', (event: any) => {
            if (googleSocket.readyState === WebSocket.OPEN) {
                googleSocket.send(event.data);
            }
        });

        // Relay: Google -> Client
        googleSocket.onmessage = (event) => {
            serverSocket.send(event.data);
        };

        // B. Handle Lifecycle & Errors
        googleSocket.onclose = () => serverSocket.close();
        serverSocket.addEventListener('close', () => googleSocket.close());

        googleSocket.onerror = (err) => console.error("[IronShield] Google WS Error:", err);
        serverSocket.addEventListener('error', (err: any) => console.error("[IronShield] Client WS Error:", err));

        return new Response(null, {
            status: 101,
            webSocket: clientSocket,
        } as any);

    } catch (error) {
        console.error("[IronShield] Critical Proxy Failure:", error);
        return new Response("Astra: Failed to initialize secure tunnel. Check Vercel WebSocket configuration.", { status: 500 });
    }
}
