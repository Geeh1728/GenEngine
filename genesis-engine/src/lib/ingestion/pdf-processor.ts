import * as pdfjsLib from 'pdfjs-dist';
// Set the worker source - this usually needs to point to a public file in Next.js or CDN
// For local-first, the worker should be bundled. We'll set it dynamically or assume standard setup.
// pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'; 

export async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const doc = await loadingTask.promise;

    let fullText = '';

    for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            .map((item) => {
                const textItem = item as { str?: string };
                return textItem.str || '';
            })
            .join(' ');
        fullText += pageText + '\n\n';
    }

    return fullText;
}

export function chunkText(text: string, chunkSize = 1000): string[] {
    const chunks: string[] = [];
    // Simple naive chunking for now, can be improved to semantic chunking later
    for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
}
