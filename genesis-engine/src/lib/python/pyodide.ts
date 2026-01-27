'use client';

let pyodideInstance: unknown = null;

export async function getPyodide() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (pyodideInstance) return pyodideInstance as any;

  if (typeof window === 'undefined') return null;

  // Load Pyodide from CDN
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(window as any).loadPyodide) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js';
    document.head.appendChild(script);

    await new Promise((resolve) => {
      script.onload = resolve;
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pyodideInstance = await (window as any).loadPyodide();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return pyodideInstance as any;
}

import { checkPythonSafety } from '../security/armor';

export async function runPython(code: string) {
  const pyodide = await getPyodide();
  if (!pyodide) return null;

  // 1. Security Check (Pre-execution)
  const safetyResult = checkPythonSafety(code);
  if (!safetyResult.isSafe) {
    return {
      result: null,
      stdout: null,
      error: `Security Block: ${safetyResult.reason}`
    };
  }

  try {
    // Redirect stdout to capture print() calls
    pyodide.runPython(`
      import sys
      import io
      sys.stdout = io.StringIO()
    `);
    
    const result = await pyodide.runPythonAsync(code);
    
    const stdout = pyodide.runPython('sys.stdout.getvalue()');
    
    return {
      result,
      stdout,
      error: null
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Pyodide Error:", errorMessage);
    return {
      result: null,
      stdout: null,
      error: errorMessage
    };
  }
}
