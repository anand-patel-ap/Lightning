/**
 * @internal
 * Text overflow settings
 */
export interface ISuffixInfo {
    suffix: string;
    nowrap: boolean;
}
/**
 * @internal
 * Text layout information
 */
export interface ILinesInfo {
    l: ILineInfo[];
    r?: string[];
}
/**
 * @internal
 * Word styling
 */
export interface ILineWordStyle {
    font: string;
    color: string;
}
/**
 * @internal
 * Layed out word information
 */
export interface ILineWord {
    text: string;
    width: number;
    style?: ILineWordStyle;
}
/**
 * @internal
 * Layed out line information
 */
export interface ILineInfo {
    text: string;
    words?: ILineWord[];
    width: number;
}
/**
 * @internal
 * Complete text layout information
 */
export interface IRenderInfo {
    lines: ILineInfo[];
    remainingText: string;
    moreTextLines: boolean;
    precision: number;
    w: number;
    h: number;
    width: number;
    innerWidth: number;
    height: number;
    fontSize: number;
    cutSx: number;
    cutSy: number;
    cutEx: number;
    cutEy: number;
    lineHeight: number;
    lineWidths: number[];
    offsetY: number;
    paddingLeft: number;
    paddingRight: number;
    letterSpacing: number;
    textIndent: number;
}
/**
 * @internal
 * Individual line render info
 */
export interface IDrawLineInfo {
    info: ILineInfo;
    x: number;
    y: number;
    w: number;
}
//# sourceMappingURL=TextTextureRendererTypes.d.ts.map