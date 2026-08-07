/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
  readonly hot: {
    accept: (dep: string | string[], cb?: () => void) => void;
  };
}

// SVG module declarations for vite-plugin-svgr
declare module '*.svg?svgr' {
  import React from 'react';
  const SVGComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  export default SVGComponent;
}

declare module '*.svg' {
  const src: string;
  export default src;
}
