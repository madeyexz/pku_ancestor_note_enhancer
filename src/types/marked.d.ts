declare module 'marked' {
    export function marked(markdown: string): string;
    export function setOptions(options: any): void;
} 