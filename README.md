# Dev Tools - JSON Formatter & VM File Connector

A clean, modern web-based toolkit for developers featuring JSON formatting and remote VM file access.

## Features

### 🔧 JSON Formatter
- Format and beautify JSON data
- Validate JSON syntax
- Minify JSON for production
- Copy formatted output to clipboard

### 📊 Laravel QueryLog Analyzer
- Analyze Laravel query execution times
- Performance statistics and insights
- Query sorting and filtering
- History tracking with localStorage

### 🖥️ VM File Connector
- **Secure SSH connection** to remote VMs
- **Environment-based configuration** with `.env` file
- **Hidden credentials by default** - click "Show Settings" to edit
- **Interactive file browser** - navigate directories visually
- **File type icons** and metadata display
- **File retrieval and display** with syntax highlighting
- **Copy and download** retrieved files

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure VM settings** (copy `.env.example` to `.env`):
   ```env
   VM_HOST=192.168.1.100
   VM_PORT=22
   VM_USERNAME=ubuntu
   VM_PASSWORD=your_password_here
   VM_DEFAULT_FILE_PATH=/var/log/laravel.log
   PORT=3050
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

4. **Access the tools** at `http://localhost:3050`

## VM File Connector Usage

### File Browser Mode (Default)
- **Visual Navigation**: Browse directories with a familiar file explorer interface
- **File Type Icons**: Instantly recognize file types (📄 logs, 🐘 PHP, 🐍 Python, etc.)
- **File Metadata**: See file sizes and modification dates
- **Click to Navigate**: Click folders to enter, click files to select
- **Parent Directory**: Use ".." to go back up the directory tree

### Manual Path Mode
- Toggle off "📁 File Browser" to enter paths manually
- Useful for direct access to known file locations
- Supports tab completion and path validation

### Connection Modes

#### Default Mode (Recommended)
- Configure your VM credentials in `.env` file
- Connection settings are hidden by default for security
- Simply browse and select files, then click "Get Selected File"
- Your credentials are safely stored server-side

#### Manual Mode
- Click "⚙️ Show Settings" to reveal connection fields
- Enter VM credentials manually
- Useful for connecting to different VMs temporarily

### Security Features
- Credentials stored in `.env` file (not in browser)
- `.env` file is gitignored by default
- Settings hidden by default to prevent accidental exposure
- Server-side SSH connection handling

## File Types Supported
- **Logs** (.log) - Laravel logs, system logs
- **JSON** (.json) - Configuration files, API responses  
- **PHP** (.php) - Laravel configuration, application files
- **JavaScript** (.js) - Node.js files, frontend code
- **SQL** (.sql) - Database dumps, queries
- **Text files** - Any plain text content

## Development

The project uses:
- **Node.js** with native HTTP server
- **SSH2** for secure VM connections
- **dotenv** for environment configuration
- **Vanilla JavaScript** (no frameworks)
- **CSS Grid/Flexbox** for responsive design

## Security Notes

- Always use SSH keys instead of passwords in production
- Keep your `.env` file secure and never commit it
- Consider using VPN or firewall rules for additional security
- The VM connector validates all inputs server-side

## License

MIT License - feel free to use and modify as needed.