// Monaco Editor configuration for Vite
// This configures Monaco to use workers from public directory

export const setupMonacoEnvironment = () => {
  // Only run in browser
  if (typeof window === 'undefined') return;

  const monacoBaseUrl = '/monaco-editor/vs/';

  (window as any).MonacoEnvironment = {
    baseUrl: monacoBaseUrl,
    getWorkerUrl: (workerId: string, label: string) => {
      // Use inline worker to avoid CORS issues
      return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
        self.MonacoEnvironment = {
          baseUrl: '${monacoBaseUrl}'
        };
        importScripts('${monacoBaseUrl}${workerId}.worker.js');
      `)}`;
    },
  };
};
