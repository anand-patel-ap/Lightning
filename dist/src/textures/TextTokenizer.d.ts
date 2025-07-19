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
    type ITextTokenizerFunction = (text: string) => ITextTokenizerSpan[];
}
/**
 * Split a text string into an array of words and spaces.
 * e.g. "Hello world!" -> ["Hello", " ", "world!"]
 * @param text
 * @returns
 */
declare class TextTokenizer {
    static _customTokenizer: TextTokenizer.ITextTokenizerFunction | undefined;
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
     * Default tokenizer implementation, suitable for most languages
     * @param text
     * @returns
     */
    static defaultTokenizer(text: string): TextTokenizer.ITextTokenizerSpan[];
}
export default TextTokenizer;
//# sourceMappingURL=TextTokenizer.d.ts.map