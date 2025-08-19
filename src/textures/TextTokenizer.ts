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
  export type ITextTokenizerFunction = (
    text: string,
    rtl: boolean
  ) => ITextTokenizerSpan[];
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
    return (
      this._customTokenizer ||
      ((text, rtl) => this.bidiAwareTokenizer(text, rtl))
    );
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
      this._customTokenizer = (text, rtl) =>
        TextTokenizer.containsOnlyASCII(text)
          ? this.defaultTokenizer(text, rtl)
          : tokenizer(text, rtl);
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

  // Check if a token looks like a time range (e.g., "16:30 - 18:30" or "16:30-18:30")
  static _isTimeRange(token: string): boolean {
    // Match time ranges like "HH:MM - HH:MM" or "HH:MM-HH:MM" or "H:MM - H:MM"
    return /^\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}$/.test(token.trim());
  }

  // Reverse time range for RTL display
  static _reverseTimeRange(token: string): string {
    const trimmed = token.trim();
    const match = trimmed.match(/^(\d{1,2}:\d{2})\s*(-)\s*(\d{1,2}:\d{2})$/);

    if (match) {
      const [, startTime, separator, endTime] = match;
      // Preserve the original spacing around the separator
      const hasSpacesBefore = / -/.test(token);
      const hasSpacesAfter = /- /.test(token);

      let reversedSeparator = separator;
      if (hasSpacesBefore && hasSpacesAfter) {
        reversedSeparator = " - ";
      } else if (hasSpacesBefore) {
        reversedSeparator = " -";
      } else if (hasSpacesAfter) {
        reversedSeparator = "- ";
      }

      return `${endTime}${reversedSeparator}${startTime}`;
    }

    return token;
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
   * Default tokenizer implementation, suitable for most languages
   * @param text
   * @returns
   */
  static defaultTokenizer(
    text: string,
    rtl: boolean = false
  ): TextTokenizer.ITextTokenizerSpan[] {
    if (this._isTimeRange(text) && rtl) {
      const word = this._reverseTimeRange(text);
      return [
        {
          tokens: [word],
          rtl: false,
        },
      ];
    }
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
  static bidiAwareTokenizer(
    text: string,
    rtl: boolean = false
  ): TextTokenizer.ITextTokenizerSpan[] {
    // For text without RTL characters, use default tokenizer
    if (!this.containsRTL(text) && !this._isTimeRange(text)) {
      return this.defaultTokenizer(text, rtl);
    }

    if (this._isTimeRange(text) && rtl) {
      const word = this._reverseTimeRange(text);
      return [
        {
          tokens: [word],
          rtl: false,
        },
      ];
    }

    // Check if it's mixed directional content
    const isMixed = this.isMixedDirectional(text);
    if (isMixed && this._getBidiTokenizer) {
      // For mixed content, use bidi tokenizer
      const bidiTokenizer = this._getBidiTokenizer();

      // Add this null check:
      if (typeof bidiTokenizer === "function") {
        return bidiTokenizer(text, rtl);
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
      return bidiTokenizer(text, true);
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
