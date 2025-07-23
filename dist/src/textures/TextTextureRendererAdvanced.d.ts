import TextTextureRenderer from "./TextTextureRenderer.js";
import type { IDrawLineInfo, ILinesInfo } from "./TextTextureRendererTypes.js";
export default class TextTextureRendererAdvanced extends TextTextureRenderer {
    wrapText(text: string, wordWrapWidth: number): ILinesInfo;
    _drawLines(drawLines: IDrawLineInfo[], letterSpacing: number): void;
}
//# sourceMappingURL=TextTextureRendererAdvanced.d.ts.map