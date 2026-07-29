declare namespace TextTokenizer {
    /**
     * Tokenizer may produce one or more spans of tokens with different writing directions.
     */
    interface ITextTokenizerSpan {
        /** Hints the primary direction of this group of tokens (default LTR) */
        rtl?: boolean;
        /** Text separated into tokens, with individual tokens for spaces */
        tokens: string[];
    }
    /**
     * Signature of text tokenizer function
     *
     * Note: space characters should be their own token.
     */
    type ITextTokenizerFunction = (text: string, rtl: boolean) => ITextTokenizerSpan[];
}
/**
 * Split a text string into an array of words and spaces.
 * e.g. "Hello world!" -> ["Hello", " ", "world!"]
 * @param text
 * @returns
 */
declare class TextTokenizer {
    static _customTokenizer: TextTokenizer.ITextTokenizerFunction | undefined;
    static _getBidiTokenizer: (() => TextTokenizer.ITextTokenizerFunction) | undefined;
    static _bidiLoadAttempted: boolean;
    /**
     * Set the bidi tokenizer getter function
     * This should be called during app initialization
     */
    static setBidiTokenizerGetter(getter: () => TextTokenizer.ITextTokenizerFunction): void;
    /**
     * Get the active tokenizer function
     * @returns
     */
    static getTokenizer(): TextTokenizer.ITextTokenizerFunction;
    /**
     * Inject or clears the custom text tokenizer.
     * @param tokenizer
     * @param detectASCII - when 100% ASCII text is tokenized, the default tokenizer should be used
     */
    static setCustomTokenizer(tokenizer?: TextTokenizer.ITextTokenizerFunction, detectASCII?: boolean): void;
    /**
     * Returns true when `text` contains only ASCII characters.
     **/
    static containsOnlyASCII(text: string): boolean;
    /**
     * Check if text contains RTL characters
     */
    static containsRTL(text: string): boolean;
    /**
     * Mirror map for directional punctuation in RTL context
     */
    static readonly RTL_MIRROR_MAP: Record<string, string>;
    /** Digits that form a number run: ASCII, Arabic-Indic and extended Arabic-Indic */
    static readonly RE_DIGIT: RegExp;
    /** Symbols that attach to an adjacent number instead of standing on their own */
    static readonly RE_NUMBER_TERMINATOR: RegExp;
    /**
     * True when the character at `index` belongs to a number rather than to the
     * surrounding text, per the bidi numeric rules (W4/W5): a separator between
     * two digits ("3.14", "1,000", "16:30", "1+2") or a terminator next to a
     * digit ("50%", "$20"). Such characters must stay attached to the number,
     * otherwise reversing the RTL token order would scramble it.
     */
    static _isNumericContext(word: string, index: number): boolean;
    /**
     * Separate punctuation marks from words for proper RTL handling
     */
    static separateRTLPunctuation(word: string): string[];
    static _isTimeRange(token: string): boolean;
    static _reverseTimeRange(token: string): string;
    /**
     * Check if text contains mixed directional content
     */
    static isMixedDirectional(text: string): boolean;
    /**
     * Default tokenizer implementation, suitable for most languages
     * @param text
     * @returns
     */
    static defaultTokenizer(text: string, rtl?: boolean): TextTokenizer.ITextTokenizerSpan[];
    /**
     * Bidi-aware tokenizer that properly handles mixed directional text
     * @param text
     * @returns
     */
    static bidiAwareTokenizer(text: string, rtl?: boolean): TextTokenizer.ITextTokenizerSpan[];
    /**
     * Advanced tokenizer for RTL text with punctuation separation
     * @param text
     * @returns
     */
    static advancedRTLTokenizer(text: string): TextTokenizer.ITextTokenizerSpan[];
}
export default TextTokenizer;
//# sourceMappingURL=TextTokenizer.d.ts.map