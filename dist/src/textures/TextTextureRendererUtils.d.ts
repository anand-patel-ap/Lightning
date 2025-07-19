import type { ILineInfo, ILineWord, ISuffixInfo } from "./TextTextureRendererTypes.js";
/**
 * Returns CSS font setting string for use in canvas context.
 *
 * @param fontFace
 * @param fontStyle
 * @param fontSize
 * @param precision
 * @param defaultFontFace
 * @returns
 */
export declare function getFontSetting(fontFace: string | (string | null)[] | null, fontStyle: string, fontSize: number, precision: number, defaultFontFace: string): string;
/**
 * Wrap a single line of text
 */
export declare function wrapText(context: CanvasRenderingContext2D, text: string, wrapWidth: number, letterSpacing: number, textIndent: number, maxLines: number, suffix: string, wordBreak: boolean): ILineInfo[];
/**
 * Determine how to handle overflow, and what suffix (e.g. ellipsis) to render
 */
export declare function getSuffix(maxLinesSuffix: string, textOverflow: string | null, wordWrap: boolean): ISuffixInfo;
/**
 * Measure the width of a string accounting for letter spacing.
 *
 * @param context
 * @param word
 * @param space
 */
export declare function measureText(context: CanvasRenderingContext2D, word: string, space?: number): number;
/**
 * Break a word into smaller parts if it exceeds the maximum width.
 *
 * @param context
 * @param word
 * @param wordWrapWidth
 * @param space
 */
export declare function breakWord(context: CanvasRenderingContext2D, word: string, wordWrapWidth: number, space?: number): ILineWord[];
//# sourceMappingURL=TextTextureRendererUtils.d.ts.map