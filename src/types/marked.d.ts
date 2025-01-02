declare module 'marked' {
    interface MarkedOptions {
        gfm?: boolean;
        breaks?: boolean;
        pedantic?: boolean;
        sanitize?: boolean;
        smartLists?: boolean;
        smartypants?: boolean;
        xhtml?: boolean;
    }
    
    export function marked(markdown: string): string;
    export function setOptions(options: MarkedOptions): void;
} 