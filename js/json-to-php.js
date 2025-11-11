// JSON ⇄ PHP Array Converter
class JsonToPhpConverter {
    constructor() {
        this.mode = 'json-to-php'; // or 'php-to-json'
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.jsonInput = document.getElementById('json-to-php-input');
        this.phpOutput = document.getElementById('php-output');
        this.convertBtn = document.getElementById('convert-to-php');
        this.swapBtn = document.getElementById('swap-direction');
        this.clearBtn = document.getElementById('clear-json-php');
        this.copyBtn = document.getElementById('copy-php');
        this.inputLabel = document.getElementById('input-label');
        this.outputLabel = document.getElementById('output-label');
    }

    bindEvents() {
        this.convertBtn.addEventListener('click', () => this.convert());
        this.swapBtn.addEventListener('click', () => this.swapDirection());
        this.clearBtn.addEventListener('click', () => this.clearAll());
        this.copyBtn.addEventListener('click', () => this.copyToClipboard());

        // Keyboard shortcuts
        this.jsonInput.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.convert();
            }
        });
    }

    convert() {
        if (this.mode === 'json-to-php') {
            this.convertToPhp();
        } else {
            this.convertToJson();
        }
    }

    swapDirection() {
        if (this.mode === 'json-to-php') {
            // Switch to PHP to JSON mode
            this.mode = 'php-to-json';
            this.inputLabel.textContent = 'PHP Array Input';
            this.outputLabel.textContent = 'JSON Output';
            this.convertBtn.textContent = 'Convert →';
            this.jsonInput.placeholder = "['name' => 'John', 'age' => 30, 'active' => true]";

            // Swap content if both have values
            if (this.jsonInput.value && this.phpOutput.value) {
                const temp = this.jsonInput.value;
                this.jsonInput.value = this.phpOutput.value;
                this.phpOutput.value = temp;
            }
        } else {
            // Switch to JSON to PHP mode
            this.mode = 'json-to-php';
            this.inputLabel.textContent = 'JSON Input';
            this.outputLabel.textContent = 'PHP Array Output';
            this.convertBtn.textContent = 'Convert →';
            this.jsonInput.placeholder = '{"name": "John", "age": 30, "active": true}';

            // Swap content if both have values
            if (this.jsonInput.value && this.phpOutput.value) {
                const temp = this.jsonInput.value;
                this.jsonInput.value = this.phpOutput.value;
                this.phpOutput.value = temp;
            }
        }

        window.notify?.info(`Switched to ${this.mode === 'json-to-php' ? 'JSON → PHP' : 'PHP → JSON'} mode`);
    }

    convertToPhp() {
        const input = this.jsonInput.value.trim();

        if (!input) {
            window.notify?.error('Please enter JSON data');
            return;
        }

        try {
            // Parse JSON
            const jsonData = JSON.parse(input);

            // Convert to PHP array syntax
            const phpArray = this.jsonToPhpArray(jsonData, 0);

            this.phpOutput.value = phpArray;
            window.notify?.success('Successfully converted to PHP array!');
        } catch (error) {
            window.notify?.error(`Invalid JSON: ${error.message}`);
            this.phpOutput.value = '';
        }
    }

    convertToJson() {
        const input = this.jsonInput.value.trim();

        if (!input) {
            window.notify?.error('Please enter PHP array data');
            return;
        }

        try {
            // Parse PHP array syntax and convert to JSON
            const jsonData = this.phpArrayToJson(input);

            // Format JSON with indentation
            const formattedJson = JSON.stringify(jsonData, null, 4);

            this.phpOutput.value = formattedJson;
            window.notify?.success('Successfully converted to JSON!');
        } catch (error) {
            window.notify?.error(`Invalid PHP array: ${error.message}`);
            this.phpOutput.value = '';
        }
    }

    phpArrayToJson(phpString) {
        // Remove PHP opening/closing tags if present
        phpString = phpString.replace(/<\?php/g, '').replace(/\?>/g, '');

        // Remove trailing semicolons
        phpString = phpString.trim().replace(/;+$/, '');

        // Step 1: Remove trailing commas before closing parentheses (PHP allows this)
        phpString = phpString.replace(/,(\s*)\)/g, '$1)');

        // Step 2: Balance parentheses - count array( and ) to auto-fix missing closing parens
        const arrayCount = (phpString.match(/array\s*\(/gi) || []).length;
        const closeParenCount = (phpString.match(/\)/g) || []).length;
        if (arrayCount > closeParenCount) {
            // Add missing closing parentheses
            phpString += ')'.repeat(arrayCount - closeParenCount);
        }

        // Step 3: Replace array() with temporary placeholder
        phpString = phpString.replace(/array\s*\(/gi, 'ARRAY_START');

        // Step 4: Quote numeric keys BEFORE converting quotes
        // Match patterns like: 0 =>, 1 =>, 123 => (pure numeric keys)
        phpString = phpString.replace(/([{,\[\s])(\d+)(\s*=>)/g, '$1\'$2\'$3');

        // Step 5: Convert single quotes to double quotes for strings
        phpString = this.convertQuotes(phpString);

        // Step 6: Replace => with :
        phpString = phpString.replace(/\s*=>\s*/g, ':');

        // Step 7: Replace ARRAY_START placeholders and balance brackets
        phpString = this.replaceArrayPlaceholders(phpString);

        // Step 8: Convert PHP constants to JSON
        phpString = phpString.replace(/\bTRUE\b/gi, 'true');
        phpString = phpString.replace(/\bFALSE\b/gi, 'false');
        phpString = phpString.replace(/\bNULL\b/gi, 'null');

        // Step 9: Remove trailing commas (multiple passes to catch all)
        // Remove commas before closing brackets/braces with any whitespace
        while (phpString.match(/,\s*[\]}]/)) {
            phpString = phpString.replace(/,\s*([\]}])/g, '$1');
        }

        // Try to parse as JSON
        try {
            return JSON.parse(phpString);
        } catch (e) {
            // Only show debug info in development
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.error('Failed to parse converted string:', phpString);
                const errorMatch = e.message.match(/position (\d+)/);
                if (errorMatch) {
                    const pos = parseInt(errorMatch[1]);
                    const start = Math.max(0, pos - 50);
                    const end = Math.min(phpString.length, pos + 50);
                    const context = phpString.substring(start, end);
                    console.error('Context around error:', context);
                }
            }
            throw new Error(`Failed to parse PHP array: ${e.message}`);
        }
    }

    replaceArrayPlaceholders(str) {
        // Replace all ARRAY_START and matching parentheses
        // Strategy: Replace each ARRAY_START...() pair individually
        let result = str;
        let finalResult = '';
        let i = 0;
        let arrayStack = []; // Track whether each level should be {} or []

        while (i < result.length) {
            if (result.substr(i, 11) === 'ARRAY_START') {
                // Look ahead to determine if this specific array is associative
                let bracketDepth = 1;
                let j = i + 11;
                let hasColon = false;

                // Scan this array's content only (not nested arrays)
                while (j < result.length && bracketDepth > 0) {
                    if (result.substr(j, 11) === 'ARRAY_START') {
                        bracketDepth++;
                        j += 11;
                        continue;
                    }
                    if (result[j] === ')') {
                        bracketDepth--;
                        if (bracketDepth === 0) break;
                    }
                    if (result[j] === ':' && bracketDepth === 1) {
                        hasColon = true;
                    }
                    j++;
                }

                // Push the bracket type for this level
                const useObject = hasColon;
                arrayStack.push(useObject);
                finalResult += useObject ? '{' : '[';
                i += 11;
            } else if (result[i] === ')') {
                // Pop and close with the appropriate bracket
                const useObject = arrayStack.pop() || false;
                finalResult += useObject ? '}' : ']';
                i++;
            } else {
                finalResult += result[i];
                i++;
            }
        }

        return finalResult;
    }

    convertQuotes(str) {
        let result = '';
        let inString = false;
        let stringDelimiter = null;
        let i = 0;

        while (i < str.length) {
            const char = str[i];

            // Check for escape sequence
            if (char === '\\' && i + 1 < str.length) {
                const nextChar = str[i + 1];
                if (inString && (nextChar === stringDelimiter || nextChar === '\\')) {
                    // Keep the escape for the string delimiter or backslash
                    result += '\\' + nextChar;
                    i += 2;
                    continue;
                }
            }

            // Check for string delimiters
            if (char === "'" || char === '"') {
                if (!inString) {
                    // Start of string
                    inString = true;
                    stringDelimiter = char;
                    result += '"'; // Always use double quotes
                } else if (char === stringDelimiter) {
                    // End of string
                    inString = false;
                    stringDelimiter = null;
                    result += '"';
                } else {
                    // Different quote inside string - escape if it's a double quote
                    if (char === '"') {
                        result += '\\"';
                    } else {
                        result += char;
                    }
                }
            } else {
                result += char;
            }

            i++;
        }

        return result;
    }



    jsonToPhpArray(data, indentLevel = 0) {
        const indent = '    '.repeat(indentLevel);
        const nextIndent = '    '.repeat(indentLevel + 1);

        if (data === null) {
            return 'null';
        }

        if (typeof data === 'boolean') {
            return data ? 'true' : 'false';
        }

        if (typeof data === 'number') {
            return String(data);
        }

        if (typeof data === 'string') {
            // Escape single quotes and backslashes
            const escaped = data.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
            return `'${escaped}'`;
        }

        if (Array.isArray(data)) {
            if (data.length === 0) {
                return '[]';
            }

            // Check if it's a simple array (all primitives)
            const isSimple = data.every(item =>
                typeof item !== 'object' || item === null
            );

            if (isSimple && data.length <= 5) {
                // Inline format for short simple arrays
                const items = data.map(item => this.jsonToPhpArray(item, 0));
                return `[${items.join(', ')}]`;
            }

            // Multi-line format
            const items = data.map(item =>
                `${nextIndent}${this.jsonToPhpArray(item, indentLevel + 1)}`
            );
            return `[\n${items.join(',\n')}\n${indent}]`;
        }

        if (typeof data === 'object') {
            const keys = Object.keys(data);

            if (keys.length === 0) {
                return '[]';
            }

            // Check if it's a simple object (all values are primitives)
            const isSimple = keys.every(key => {
                const value = data[key];
                return typeof value !== 'object' || value === null;
            });

            if (isSimple && keys.length <= 3) {
                // Inline format for short simple objects
                const items = keys.map(key =>
                    `'${key}' => ${this.jsonToPhpArray(data[key], 0)}`
                );
                return `[${items.join(', ')}]`;
            }

            // Multi-line format
            const items = keys.map(key => {
                const value = this.jsonToPhpArray(data[key], indentLevel + 1);
                return `${nextIndent}'${key}' => ${value}`;
            });
            return `[\n${items.join(',\n')}\n${indent}]`;
        }

        return 'null';
    }

    async copyToClipboard() {
        const text = this.phpOutput.value;

        if (!text) {
            window.notify?.warning('Nothing to copy');
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            window.notify?.success('PHP array copied to clipboard!');
        } catch (error) {
            // Fallback for older browsers
            this.phpOutput.select();
            document.execCommand('copy');
            window.notify?.success('PHP array copied to clipboard!');
        }
    }

    clearAll() {
        this.jsonInput.value = '';
        this.phpOutput.value = '';
        this.jsonInput.focus();
        window.notify?.info('Cleared');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new JsonToPhpConverter();
});
