import type { ILineInfo, ILineWord, ILineWordStyle } from "./TextTextureRendererTypes.js";
export interface DirectedSpan {
    rtl?: boolean;
    tokens: string[];
}
export interface WordLayout extends ILineWord {
    rtl: boolean;
}
export interface LineLayout extends ILineInfo {
    rtl: boolean;
    words: WordLayout[];
}
/**
 * Extract HTML tags, replacing them with direction-weak characters, so they don't affect bidi parsing
 */
export declare function extractTags(source: string): {
    tags: string[];
    output: string;
};
/**
 * Style helper
 */
export declare function createLineStyle(tags: string[], baseFont: string, color: number): {
    isStyled: boolean;
    baseStyle: ILineWordStyle;
    updateStyle: (code: number) => boolean;
    getStyle: () => ILineWordStyle;
};
/**
 * Layout text into lines
 */
export declare function layoutSpans(ctx: CanvasRenderingContext2D, spans: DirectedSpan[], lineStyle: ReturnType<typeof createLineStyle>, wrapWidth: number, textIndent: number, maxLines: number, suffix: string, wordBreak: boolean, letterSpacing: number, allowTruncation: boolean): LineLayout[];
export declare function trimWordEnd(text: string, rtl: boolean): string;
export declare function trimWordStart(text: string, rtl: boolean): string;
/**
 * Render text lines
 */
export declare function renderLines(ctx: CanvasRenderingContext2D, lines: LineLayout[], lineStyle: ReturnType<typeof createLineStyle>, align: "left" | "right" | "center", lineHeight: number, wrapWidth: number, indent: number): void;
//# sourceMappingURL=TextTextureRendererAdvancedUtils.d.ts.map