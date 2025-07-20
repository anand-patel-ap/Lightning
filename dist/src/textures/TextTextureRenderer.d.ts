import type Stage from "../tree/Stage.mjs";
import type TextTexture from "./TextTexture.mjs";
import type { IRenderInfo, ILinesInfo, ILineInfo, IDrawLineInfo } from "./TextTextureRendererTypes.js";
export default class TextTextureRenderer {
    protected _stage: Stage;
    protected _canvas: HTMLCanvasElement;
    protected _context: CanvasRenderingContext2D;
    protected _settings: Required<TextTexture.Settings>;
    protected prevShadowSettings: [string, number, number, number] | null;
    renderInfo: IRenderInfo | undefined;
    constructor(stage: Stage, canvas: HTMLCanvasElement, settings: Required<TextTexture.Settings>);
    setFontProperties(): void;
    _load(): Promise<void>;
    draw(): void | Promise<void>;
    _calculateRenderInfo(): IRenderInfo;
    _draw(): void;
    protected _drawLines(drawLines: IDrawLineInfo[], letterSpacing: number): void;
    protected _fillTextWithLetterSpacing(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, letterSpacing: number): void;
    protected _restoreShadow(): void;
    protected _drawShadow(precision: number): void;
    protected _drawHighlight(precision: number, renderInfo: IRenderInfo, drawLines: IDrawLineInfo[]): void;
    /**
     * Simple line measurement
     */
    measureLines(lines: string[]): ILineInfo[];
    /**
     * Simple text wrapping
     */
    wrapText(text: string, wordWrapWidth: number): ILinesInfo;
}
//# sourceMappingURL=TextTextureRenderer.d.ts.map