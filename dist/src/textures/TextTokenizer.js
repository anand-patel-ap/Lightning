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
/**
 * Split a text string into an array of words and spaces.
 * e.g. "Hello world!" -> ["Hello", " ", "world!"]
 * @param text
 * @returns
 */
class TextTokenizer {
    // current custom tokenizer
    static _customTokenizer;
    /**
     * Get the active tokenizer function
     * @returns
     */
    static getTokenizer() {
        return this._customTokenizer || this.defaultTokenizer;
    }
    /**
     * Inject or clears the custom text tokenizer.
     * @param tokenizer
     * @param detectASCII - when 100% ASCII text is tokenized, the default tokenizer should be used
     */
    static setCustomTokenizer(tokenizer, detectASCII = false) {
        if (!tokenizer || !detectASCII) {
            this._customTokenizer = tokenizer;
        }
        else {
            this._customTokenizer = (text) => TextTokenizer.containsOnlyASCII(text) ? tokenizer(text) : this.defaultTokenizer(text);
        }
    }
    /**
     * Returns true when `text` contains only ASCII characters.
     **/
    static containsOnlyASCII(text) {
        // It checks the first char to fail fast for most non-English strings
        // The regex will match any character that is not in ASCII
        // - first, matching all characters between space (32) and ~ (127)
        // - second, matching all unicode quotation marks (see https://hexdocs.pm/ex_unicode/Unicode.Category.QuoteMarks.html)
        return text.charAt(0) <= 'z' && !/[^ -~'-›]/.test(text);
    }
    /**
     * Default tokenizer implementation, suitable for most languages
     * @param text
     * @returns
     */
    static defaultTokenizer(text) {
        const words = [];
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
            },
        ];
    }
}
export default TextTokenizer;
//# sourceMappingURL=TextTokenizer.js.map