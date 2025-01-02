declare module 'pdf-text-extract' {
  function extract(path: string, callback: (error: Error | null, pages: string[]) => void): void;
  export default extract;
} 