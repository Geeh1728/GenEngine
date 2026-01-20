'use client';

let pyodideInstance: any = null;

export async function getPyodide() {
  if (pyodideInstance) return pyodideInstance;

  if (typeof window === 'undefined') return null;

  // Load Pyodide from CDN
  if (!(window as any).loadPyodide) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js';
    document.head.appendChild(script);

    await new Promise((resolve) => {
      script.onload = resolve;
    });
  }

  pyodideInstance = await (window as any).loadPyodide();
  return pyodideInstance;
}

export async function runPython(code: string) {
  const pyodide = await getPyodide();
  if (!pyodide) return null;

  try {
    // Redirect stdout to capture print() calls
    pyodide.runPython(`
      import sys
      import io
      sys.stdout = io.String()
    `);
    
    const result = await pyodide.runPythonAsync(code);
    
    const stdout = pyodide.runPython('sys.stdout.getvalue()');
    
    return {
      result,
      stdout,
      error: null
    };
  } catch (error: any) {
    console.error("Pyodide Error:", error);
    return {
      result: null,
      stdout: null,
      error: error.message
    };
  }
}
