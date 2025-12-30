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
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import bidiFactory from "bidi-js";
let bidi;
// https://www.unicode.org/reports/tr9/
const reZeroWidthSpace = /[\u200B\u200E\u200F\u061C]/g;
const reDirectionalFormat = /[\u202A\u202B\u202C\u202D\u202E\u202E\u2066\u2067\u2068\u2069]/g;
const reQuoteStart = /^["""«»]/;
const reQuoteEnd = /["""«»]$/;
const rePunctuationStart = /^[.,،:;!?()"-]+/;
const rePunctuationEnd = /[.,،:;!?()"-]+$/;
// Check if a token looks like a URL or domain
function isUrlOrDomain(token) {
    return (/^(https?:\/\/|www\.|[a-zA-Z0-9-]+\.(com|org|net|edu|gov|io|co|uk|de|fr|jp|cn|in|au|br|ca|es|it|nl|ru|se|no|dk|fi|pl|pt|tr|kr|tw|hk|sg|my|th|vn|id|ph|ae|sa|eg|za|ng|ke|ma|tn|gh|et|ug|tz|mz|dz|ao|cm|ci|sn|bf|ne|ml|mg|cg|zm|zw|bw|na|sz|ls|mw|rw|bi|dj|so|er|km|mu|sc|mv|ly|sd|ss|cf|td|gn|mr|tg|bj|gw|sl|lr|gm|cv|st|gq))/i.test(token) ||
        /\.(com|org|net|edu|gov|io|co|uk|de|fr|jp|cn|in|au|br|ca|es|it|nl|ru|se|no|dk|fi|pl|pt|tr|kr|tw|hk|sg|my|th|vn|id|ph|ae|sa|eg|za|ng|ke|ma|tn|gh|et|ug|tz|mz|dz|ao|cm|ci|sn|bf|ne|ml|mg|cg|zm|zw|bw|na|sz|ls|mw|rw|bi|dj|so|er|km|mu|sc|mv|ly|sd|ss|cf|td|gn|mr|tg|bj|gw|sl|lr|gm|cv|st|gq)(\/|$)/i.test(token) ||
        /^[a-zA-Z0-9.-]+\/[a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=-]*$/.test(token));
}
/**
 * Reverse punctuation characters, mirroring braces
 */
function mirrorPunctuation(punctuation) {
    let result = "";
    for (let i = 0; i < punctuation.length; i++) {
        let c = punctuation.charAt(i);
        if (c === "(")
            c = ")";
        else if (c === ")")
            c = "(";
        result = c + result;
    }
    return result;
}
/**
 * Mirror directional single character
 */
function mirrorSingle(char) {
    if (char === '"')
        return '"';
    else if (char === "“")
        return "”";
    else if (char === "”")
        return "“";
    else if (char === "«")
        return "»";
    else if (char === "»")
        return "«";
    return char;
}
/**
 * Reverse punctuation surrounding a token
 */
function mirrorTokenPunctuation(token) {
    // Don't mirror URLs or domains
    if (isUrlOrDomain(token)) {
        return token;
    }
    // single character could be a punctuation
    if (token.length <= 1) {
        return mirrorSingle(token);
    }
    // extract quotes
    const startQuote = token.match(reQuoteStart);
    const endQuote = token.match(reQuoteEnd);
    if (startQuote) {
        token = token.substring(1);
    }
    if (endQuote) {
        token = token.substring(0, token.length - 1);
    }
    // has punctuation at the start
    const start = token.match(rePunctuationStart);
    if (start) {
        token = token.substring(start[0].length);
    }
    if (token.length > 1) {
        // has punctuation at the end
        const end = token.match(rePunctuationEnd);
        if (end) {
            token = token.substring(0, token.length - end[0].length);
            token = mirrorPunctuation(end[0]) + token;
        }
    }
    if (start) {
        token = token + mirrorPunctuation(start[0]);
    }
    // add quotes back
    if (startQuote) {
        token = token + mirrorSingle(startQuote[0]);
    }
    if (endQuote) {
        token = mirrorSingle(endQuote[0]) + token;
    }
    return token;
}
/**
 * RTL aware tokenizer
 */
export function getBidiTokenizer() {
    if (!bidi) {
        bidi = bidiFactory();
    }
    function tokenize(text) {
        // Add input validation
        if (!text || typeof text !== "string") {
            console.warn("Invalid text input to bidi tokenizer:", text);
            return [
                {
                    rtl: false,
                    tokens: [],
                },
            ];
        }
        const { levels } = bidi.getEmbeddingLevels(text);
        let prevLevel = levels[0];
        let rtl = (prevLevel & 1) > 0;
        let t = "";
        const spans = [];
        let tokens = [];
        spans.push({
            rtl,
            tokens,
        });
        const commit = () => {
            if (!t.length)
                return;
            if (rtl && !isUrlOrDomain(t)) {
                t = mirrorTokenPunctuation(t);
            }
            tokens.push(t);
            t = "";
        };
        const flip = () => {
            rtl = !rtl;
            tokens = [];
            spans.push({
                rtl,
                tokens,
            });
        };
        for (let i = 0; i < text.length; i++) {
            if (levels[i] !== prevLevel) {
                prevLevel = levels[i];
                commit();
                flip();
            }
            const c = text.charAt(i);
            if (c === " ") {
                commit();
                tokens.push(c);
            }
            else if (reZeroWidthSpace.test(c)) {
                commit();
            }
            else if (!reDirectionalFormat.test(c)) {
                t += c;
            }
        }
        commit();
        return spans;
    }
    return tokenize;
}
//# sourceMappingURL=bidiTokenizer.js.map