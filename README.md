# Dev Tools - JSON Formatter & QueryLog Analyzer

A clean, modern web-based toolkit for developers featuring JSON formatting and Laravel QueryLog analysis capabilities.

## Features

### 🎨 JSON Formatter
- **Format & Beautify**: Convert minified JSON into readable, indented format
- **Minify**: Compress JSON by removing unnecessary whitespace
- **Validate**: Check JSON syntax and get detailed validation feedback
- **Auto-format**: Real-time formatting as you type (with debounce)
- **Copy to Clipboard**: One-click copying of formatted results
- **Statistics**: Get object, array, and property counts

### ⚡ Laravel QueryLog Analyzer
- **Performance Analysis**: Calculate total, average, and slowest query times
- **Query Categorization**: Automatically categorize queries as fast/medium/slow
- **Multiple Input Formats**: Supports both JSON and PHP array formats
- **Detailed Breakdown**: View individual query performance with syntax highlighting
- **Visual Stats**: Clean dashboard with key performance metrics

## Usage

### JSON Formatter
1. Paste your JSON data into the input area
2. Click "Format JSON" to beautify, "Minify" to compress, or "Validate" to check syntax
3. Copy the result using the "Copy to Clipboard" button

### QueryLog Analyzer
1. Paste Laravel QueryLog data (from `DB::getQueryLog()` or similar)
2. Click "Analyze Queries" to process the data
3. View performance statistics and detailed query breakdown

#### Supported QueryLog Formats

**JSON Format:**
```json
[
  {
    "query": "select * from users where id = ?",
    "bindings": [1],
    "time": 1.23
  }
]
```

**PHP Array Format:**
```php
array:2 [
  0 => array:3 [
    "query" => "select * from users"
    "bindings" => []
    "time" => 1.23
  ]
  1 => array:3 [
    "query" => "select * from posts where user_id = ?"
    "bindings" => [1]
    "time" => 15.67
  ]
]
```

## Performance Categories

- **Fast Queries**: ≤ 10ms (Green)
- **Medium Queries**: 10-100ms (Orange)  
- **Slow Queries**: > 100ms (Red)

## Getting Started

1. Clone this repository
2. Open `index.html` in your web browser
3. Start using the tools immediately - no installation required!

## Browser Compatibility

- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge
- Mobile responsive design

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - feel free to use this in your projects.