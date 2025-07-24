/*
 * If not stated otherwise in this file or this component's LICENSE file the
 * following copyright and licenses apply:
 *
 * Copyright 2020 Metrological
 *
 * Licensed under the Apache License, Version 2.0 (the License);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

namespace TextTokenizer {
  /**
   * Tokenizer may produce one or more spans of tokens with different writing directions.
   */
  export interface ITextTokenizerSpan {
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
  export type ITextTokenizerFunction = (text: string) => ITextTokenizerSpan[];
}

/**
 * Split a text string into an array of words and spaces.
 * e.g. "Hello world!" -> ["Hello", " ", "world!"]
 * @param text
 * @returns
 */
class TextTokenizer {
  // current custom tokenizer
  static _customTokenizer: TextTokenizer.ITextTokenizerFunction | undefined;

  // bidi tokenizer getter - will be set by external code
  static _getBidiTokenizer:
    | (() => TextTokenizer.ITextTokenizerFunction)
    | undefined;

  // Flag to track if we've tried to load the bidi tokenizer
  static _bidiLoadAttempted: boolean = false;

  /**
   * Set the bidi tokenizer getter function
   * This should be called during app initialization
   */
  static setBidiTokenizerGetter(
    getter: () => TextTokenizer.ITextTokenizerFunction
  ): void {
    this._getBidiTokenizer = getter;
  }

  /**
   * Get the active tokenizer function
   * @returns
   */
  static getTokenizer(): TextTokenizer.ITextTokenizerFunction {
    return this._customTokenizer || ((text) => this.bidiAwareTokenizer(text));
  }

  /**
   * Inject or clears the custom text tokenizer.
   * @param tokenizer
   * @param detectASCII - when 100% ASCII text is tokenized, the default tokenizer should be used
   */
  static setCustomTokenizer(
    tokenizer?: TextTokenizer.ITextTokenizerFunction,
    detectASCII: boolean = false
  ): void {
    if (!tokenizer || !detectASCII) {
      this._customTokenizer = tokenizer;
    } else {
      this._customTokenizer = (text) =>
        TextTokenizer.containsOnlyASCII(text)
          ? this.defaultTokenizer(text)
          : tokenizer(text);
    }
  }

  /**
   * Returns true when `text` contains only ASCII characters.
   **/
  static containsOnlyASCII(text: string): boolean {
    // It checks the first char to fail fast for most non-English strings
    // The regex will match any character that is not in ASCII
    // - first, matching all characters between space (32) and ~ (127)
    // - second, matching all unicode quotation marks
    return text.charAt(0) <= "z" && !/[^ -~'-›]/.test(text);
  }

  /**
   * Check if text contains RTL characters
   */
  static containsRTL(text: string): boolean {
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0590-\u05FF]/.test(
      text
    );
  }

  /**
   * Check if text contains mixed directional content
   */
  static isMixedDirectional(text: string): boolean {
    const hasRTL = this.containsRTL(text);
    const hasLTR = /[a-zA-Z0-9]/.test(text);
    return hasRTL && hasLTR;
  }

  /**
   * Check if the starting word/character indicates RTL or LTR layout
   * @param text - The text to analyze
   * @returns 'rtl' if the first significant character is RTL, 'ltr' otherwise
   */
  static getStartingDirection(text: string): "rtl" | "ltr" {
    if (!text || text.length === 0) {
      return "ltr"; // Default to LTR for empty text
    }

    // Find the first non-neutral character
    for (let i = 0; i < text.length; i++) {
      const char = text.charAt(i);
      const codePoint = text.codePointAt(i);

      if (!codePoint) continue;

      // Skip neutral characters (spaces, punctuation, numbers)
      if (TextTokenizer.isNeutralCharacter(char)) {
        continue;
      }

      // Check if it's an RTL character
      if (TextTokenizer.isRTLCharacter(codePoint)) {
        return "rtl";
      }

      // Check if it's an LTR character
      if (TextTokenizer.isLTRCharacter(codePoint)) {
        return "ltr";
      }
    }

    // If no directional characters found, default to LTR
    return "ltr";
  }

  /**
   * Check if a character is neutral (doesn't have strong directional properties)
   */
  static isNeutralCharacter(char: string): boolean {
    const code = char.charCodeAt(0);

    // Spaces, tabs, line breaks
    if (code <= 0x20 || code === 0x7f) return true;

    // Common punctuation and symbols
    if (
      (code >= 0x21 && code <= 0x2f) || // !"#$%&'()*+,-./
      (code >= 0x3a && code <= 0x40) || // :;<=>?@
      (code >= 0x5b && code <= 0x60) || // [\]^_`
      (code >= 0x7b && code <= 0x7e)
    ) {
      // {|}~
      return true;
    }

    // Numbers (0-9)
    if (code >= 0x30 && code <= 0x39) return true;

    // Additional Unicode neutral characters
    if (code >= 0x2000 && code <= 0x206f) return true; // General punctuation
    if (code >= 0x20a0 && code <= 0x20cf) return true; // Currency symbols
    if (code >= 0x2100 && code <= 0x214f) return true; // Letterlike symbols

    return false;
  }

  /**
   * Check if a character code point is RTL
   */
  static isRTLCharacter(codePoint: number): boolean {
    // Arabic script ranges
    if (
      (codePoint >= 0x0600 && codePoint <= 0x06ff) || // Arabic
      (codePoint >= 0x0750 && codePoint <= 0x077f) || // Arabic Supplement
      (codePoint >= 0x08a0 && codePoint <= 0x08ff) || // Arabic Extended-A
      (codePoint >= 0xfb50 && codePoint <= 0xfdff) || // Arabic Presentation Forms-A
      (codePoint >= 0xfe70 && codePoint <= 0xfeff)
    ) {
      // Arabic Presentation Forms-B
      return true;
    }

    // Hebrew script ranges
    if (
      (codePoint >= 0x0590 && codePoint <= 0x05ff) || // Hebrew
      (codePoint >= 0xfb1d && codePoint <= 0xfb4f)
    ) {
      // Hebrew Presentation Forms
      return true;
    }

    // Other RTL scripts
    if (
      (codePoint >= 0x07c0 && codePoint <= 0x07ff) || // NKo
      (codePoint >= 0x0800 && codePoint <= 0x083f) || // Samaritan
      (codePoint >= 0x0840 && codePoint <= 0x085f) || // Mandaic
      (codePoint >= 0x10800 && codePoint <= 0x1083f) || // Cypriot Syllabary
      (codePoint >= 0x10840 && codePoint <= 0x1085f) || // Imperial Aramaic
      (codePoint >= 0x10860 && codePoint <= 0x1087f) || // Palmyrene
      (codePoint >= 0x10880 && codePoint <= 0x108af) || // Nabataean
      (codePoint >= 0x108e0 && codePoint <= 0x108ff) || // Hatran
      (codePoint >= 0x10900 && codePoint <= 0x1091f) || // Phoenician
      (codePoint >= 0x10920 && codePoint <= 0x1093f) || // Lydian
      (codePoint >= 0x10980 && codePoint <= 0x1099f) || // Meroitic Hieroglyphs
      (codePoint >= 0x109a0 && codePoint <= 0x109ff) || // Meroitic Cursive
      (codePoint >= 0x10a00 && codePoint <= 0x10a5f) || // Kharoshthi
      (codePoint >= 0x10a60 && codePoint <= 0x10a7f) || // Old South Arabian
      (codePoint >= 0x10a80 && codePoint <= 0x10a9f) || // Old North Arabian
      (codePoint >= 0x10ac0 && codePoint <= 0x10aff) || // Manichaean
      (codePoint >= 0x10b00 && codePoint <= 0x10b3f) || // Avestan
      (codePoint >= 0x10b40 && codePoint <= 0x10b5f) || // Inscriptional Parthian
      (codePoint >= 0x10b60 && codePoint <= 0x10b7f) || // Inscriptional Pahlavi
      (codePoint >= 0x10b80 && codePoint <= 0x10baf) || // Psalter Pahlavi
      (codePoint >= 0x10c00 && codePoint <= 0x10c4f) || // Old Turkic
      (codePoint >= 0x10e60 && codePoint <= 0x10e7f) || // Rumi Numeral Symbols
      (codePoint >= 0x1e800 && codePoint <= 0x1e8df) || // Mende Kikakui
      (codePoint >= 0x1e900 && codePoint <= 0x1e95f) || // Adlam
      (codePoint >= 0x1ec70 && codePoint <= 0x1ecbf) || // Indic Siyaq Numbers
      (codePoint >= 0x1ed00 && codePoint <= 0x1ed4f)
    ) {
      // Ottoman Siyaq Numbers
      return true;
    }

    return false;
  }

  /**
   * Check if a character code point is LTR
   */
  static isLTRCharacter(codePoint: number): boolean {
    // Basic Latin
    if (
      (codePoint >= 0x0041 && codePoint <= 0x005a) || // A-Z
      (codePoint >= 0x0061 && codePoint <= 0x007a)
    ) {
      // a-z
      return true;
    }

    // Latin Extended ranges
    if (
      (codePoint >= 0x00c0 && codePoint <= 0x024f) || // Latin Extended-A & B
      (codePoint >= 0x1e00 && codePoint <= 0x1eff)
    ) {
      // Latin Extended Additional
      return true;
    }

    // Greek
    if (codePoint >= 0x0370 && codePoint <= 0x03ff) return true;

    // Cyrillic
    if (
      (codePoint >= 0x0400 && codePoint <= 0x04ff) || // Cyrillic
      (codePoint >= 0x0500 && codePoint <= 0x052f)
    ) {
      // Cyrillic Supplement
      return true;
    }

    // Other common LTR scripts
    if (
      (codePoint >= 0x0100 && codePoint <= 0x017f) || // Latin Extended-A
      (codePoint >= 0x0180 && codePoint <= 0x024f) || // Latin Extended-B
      (codePoint >= 0x1e00 && codePoint <= 0x1eff) || // Latin Extended Additional
      (codePoint >= 0x2c60 && codePoint <= 0x2c7f) || // Latin Extended-C
      (codePoint >= 0xa720 && codePoint <= 0xa7ff) || // Latin Extended-D
      (codePoint >= 0xab30 && codePoint <= 0xab6f)
    ) {
      // Latin Extended-E
      return true;
    }

    return false;
  }

  /**
   * Default tokenizer implementation, suitable for most languages
   * @param text
   * @returns
   */
  static defaultTokenizer(text: string): TextTokenizer.ITextTokenizerSpan[] {
    const words: string[] = [];
    const len = text.length;
    let startIndex = 0;
    let i = 0;
    for (; i < len; i++) {
      const c = text.charAt(i);
      if (c === " " || c === "\u200B") {
        if (i - startIndex > 0) {
          words.push(text.substring(startIndex, i));
        }
        startIndex = i + 1;
        if (c === " ") {
          words.push(" ");
        }
      }
    }
    if (i - startIndex > 0) {
      words.push(text.substring(startIndex, len));
    }
    return [
      {
        tokens: words,
        rtl: this.containsRTL(text),
      },
    ];
  }

  /**
   * Bidi-aware tokenizer that properly handles mixed directional text
   * @param text
   * @returns
   */
  static bidiAwareTokenizer(text: string): TextTokenizer.ITextTokenizerSpan[] {
    // For pure ASCII text, use the simple tokenizer
    if (this.containsOnlyASCII(text)) {
      return this.defaultTokenizer(text);
    }

    // For text without RTL characters, use default tokenizer
    if (!this.containsRTL(text)) {
      return this.defaultTokenizer(text);
    }

    // Check if it's mixed directional content
    const isMixed = this.isMixedDirectional(text);
    if (isMixed && this._getBidiTokenizer) {
      // For mixed content, use bidi tokenizer
      const bidiTokenizer = this._getBidiTokenizer();

      // Add this null check:
      if (typeof bidiTokenizer === "function") {
        return bidiTokenizer(text);
      } else {
        console.warn(
          "Bidi tokenizer is not properly initialized, falling back to advanced RTL tokenizer"
        );
        return this.advancedRTLTokenizer(text);
      }
    } else {
      // For pure RTL, use the existing advancedRTLTokenizer
      return this.advancedRTLTokenizer(text);
    }
  }

  /**
   * Advanced tokenizer for RTL text with punctuation separation
   * @param text
   * @returns
   */
  static advancedRTLTokenizer(
    text: string
  ): TextTokenizer.ITextTokenizerSpan[] {
    // Check if it's mixed content - if so, use bidi tokenizer
    if (this.isMixedDirectional(text) && this._getBidiTokenizer) {
      const bidiTokenizer = this._getBidiTokenizer();
      return bidiTokenizer(text);
    }

    // For pure RTL text, use the original logic
    const hasRTL =
      /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(
        text
      );

    const words: string[] = [];
    const len = text.length;
    let startIndex = 0;
    let i = 0;

    for (; i < len; i++) {
      const c = text.charAt(i);
      if (c === " " || c === "\u200B") {
        if (i - startIndex > 0) {
          const word = text.substring(startIndex, i);

          // For RTL text, separate punctuation marks
          if (hasRTL) {
            const separatedTokens = TextTokenizer.separateRTLPunctuation(word);

            words.push(...separatedTokens);
          } else {
            words.push(word);
          }
        }
        startIndex = i + 1;
        if (c === " ") {
          words.push(" ");
        }
      }
    }

    if (i - startIndex > 0) {
      const word = text.substring(startIndex, len);

      // Handle final word with punctuation
      if (hasRTL) {
        const separatedTokens = TextTokenizer.separateRTLPunctuation(word);
        words.push(...separatedTokens);
      } else {
        words.push(word);
      }
    }

    return [
      {
        tokens: words,
        rtl: hasRTL,
      },
    ];
  }

  /**
   * Separate punctuation marks from words for proper RTL handling
   */
  static separateRTLPunctuation(word: string): string[] {
    const punctuationRegex = /[.,،:;!?؟()"""«»\-]/g;
    const result: string[] = [];
    let lastIndex = 0;
    let match;

    while ((match = punctuationRegex.exec(word)) !== null) {
      // Add text before punctuation
      if (match.index > lastIndex) {
        result.push(word.substring(lastIndex, match.index));
      }

      // Add the punctuation mark as separate token
      result.push(match[0]);
      lastIndex = match.index + 1;
    }

    // Add remaining text after last punctuation
    if (lastIndex < word.length) {
      result.push(word.substring(lastIndex));
    }

    // If no punctuation found, return the original word
    return result.length > 0
      ? result.filter((token) => token.length > 0)
      : [word];
  }
}

export default TextTokenizer;