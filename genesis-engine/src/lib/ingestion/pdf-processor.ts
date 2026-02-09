// Robust PDF Processor for Serverless Environments
import * as pdfjs from 'pdfjs-dist';

// Set worker path for pdfjs
// In Node.js, we can usually skip this or point to the legacy build
// but for simple text extraction, we might not need the full worker if we use the library correctly

export async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
    try {
        const loadingTask = pdfjs.getDocument({
            data: arrayBuffer,
            useSystemFonts: true,
            disableFontFace: true, // Often helps in Node environments
        });

        const pdf = await loadingTask.promise;
        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(" ");
            fullText += pageText + "\n";
        }

        return fullText;
    } catch (error) {
        console.error("Primary PDF Parse Failed (pdfjs):", error);
        
        // Fallback to pdf-parse if pdfjs fails
        try {
            const pdfParse = require('pdf-parse');
            const buffer = Buffer.from(arrayBuffer);
            const data = await (typeof pdfParse === 'function' ? pdfParse(buffer) : (pdfParse.default ? pdfParse.default(buffer) : pdfParse(buffer)));
            return data.text;
        } catch (innerError) {
            console.error("Secondary PDF Parse Failed (pdf-parse):", innerError);
            return "Error: Could not parse PDF text. Please ensure the PDF contains selectable text.";
        }
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
