/// <reference types="vite/client" />

// Add Plotly global namespace declaration for TypeScript
declare global {
  interface Window {
    Plotly: {
      downloadImage: (
        gd: HTMLElement, 
        opts: {
          format: string;
          width: number;
          height: number;
          filename: string;
        }
      ) => void;
    }
    GOVUKFrontend?: {
      initAll: () => void;
    };
  }
}
