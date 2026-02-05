// Robust PDF Processor for Serverless Environments
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

export async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
    try {
        // 1. Try pdf-parse (Stable in Node.js)
        const buffer = Buffer.from(arrayBuffer);
        const data = await pdfParse(buffer);
        return data.text;
    } catch (error) {
        console.error("Primary PDF Parse Failed:", error);
        // Fallback or Graceful Failure
        return "Error: Could not parse PDF text. Please ensure the PDF contains selectable text.";
    }
}

export function chunkText(text: string, chunkSize = 1000): string[] {
    const chunks: string[] = [];
    // Simple naive chunking for now, can be improved to semantic chunking later
    for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
}
