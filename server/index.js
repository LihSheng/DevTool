require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const PORT = process.env.PORT || 3050;

const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon'
};

// VM Connection function
function connectToVM(vmConfig, callback) {
    const conn = new Client();
    
    conn.on('ready', () => {
        console.log('VM Connection established');
        callback(null, conn);
    }).on('error', (err) => {
        console.error('VM Connection error:', err);
        callback(err, null);
    }).connect({
        host: vmConfig.host,
        username: vmConfig.username,
        password: vmConfig.password, // or use privateKey for key-based auth
        port: vmConfig.port || 22
    });
}

// Get file from VM
function getFileFromVM(conn, remotePath, callback) {
    conn.sftp((err, sftp) => {
        if (err) return callback(err, null);
        
        sftp.readFile(remotePath, 'utf8', (err, data) => {
            if (err) return callback(err, null);
            callback(null, data);
        });
    });
}

// List directory contents from VM
function listDirectoryFromVM(conn, remotePath, callback) {
    conn.sftp((err, sftp) => {
        if (err) {
            console.error('SFTP connection error:', err);
            return callback(new Error(`SFTP connection failed: ${err.message}`), null);
        }
        
        console.log(`Attempting to read directory: ${remotePath}`);
        
        sftp.readdir(remotePath, (err, list) => {
            if (err) {
                console.error('Directory read error:', err);
                // Provide more specific error messages
                if (err.code === 2) {
                    return callback(new Error(`Directory not found: ${remotePath}`), null);
                } else if (err.code === 3) {
                    return callback(new Error(`Permission denied: ${remotePath}`), null);
                } else {
                    return callback(new Error(`Cannot access directory: ${err.message}`), null);
                }
            }
            
            if (!list || list.length === 0) {
                console.log(`Directory ${remotePath} is empty`);
                return callback(null, []);
            }
            
            try {
                // Process the list to add file type information
                const processedList = list.map(item => ({
                    name: item.filename,
                    isDirectory: item.attrs.isDirectory(),
                    isFile: item.attrs.isFile(),
                    size: item.attrs.size || 0,
                    modified: new Date((item.attrs.mtime || 0) * 1000).toISOString(),
                    permissions: item.attrs.mode || 0
                }));
                
                // Sort: directories first, then files, both alphabetically
                processedList.sort((a, b) => {
                    if (a.isDirectory && !b.isDirectory) return -1;
                    if (!a.isDirectory && b.isDirectory) return 1;
                    return a.name.localeCompare(b.name);
                });
                
                console.log(`Successfully listed ${processedList.length} items in ${remotePath}`);
                callback(null, processedList);
            } catch (processError) {
                console.error('Error processing directory list:', processError);
                callback(new Error(`Error processing directory contents: ${processError.message}`), null);
            }
        });
    });
}

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    // Add CORS headers for all requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    console.log(`${req.method} ${url.pathname}`);
    
    // Handle VM defaults request
    if (url.pathname === '/api/vm-defaults' && req.method === 'GET') {
        const vmDefaults = {
            host: process.env.VM_HOST || '',
            port: process.env.VM_PORT || 22,
            username: process.env.VM_USERNAME || '',
            defaultFilePath: process.env.VM_DEFAULT_FILE_PATH || '/var/log/app.log'
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(vmDefaults));
        return;
    }
    
    // Handle VM directory browsing
    if (url.pathname === '/api/vm-browse' && req.method === 'POST') {
        console.log('Received browse request');
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                console.log('Request body:', body);
                const { directoryPath, useDefaults, vmConfig } = JSON.parse(body);
                console.log('Parsed request:', { directoryPath, useDefaults, vmConfig: vmConfig ? 'provided' : 'not provided' });
                
                // Validate directory path
                if (!directoryPath) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Directory path is required' }));
                    return;
                }
                
                // Determine which VM config to use
                let finalVmConfig;
                if (useDefaults) {
                    finalVmConfig = {
                        host: process.env.VM_HOST,
                        username: process.env.VM_USERNAME,
                        password: process.env.VM_PASSWORD,
                        port: process.env.VM_PORT || 22
                    };
                    console.log('Using default VM config:', { host: finalVmConfig.host, username: finalVmConfig.username, port: finalVmConfig.port });
                } else {
                    finalVmConfig = vmConfig;
                    console.log('Using provided VM config:', { host: finalVmConfig?.host, username: finalVmConfig?.username, port: finalVmConfig?.port });
                }
                
                // Validate VM config
                if (!finalVmConfig || !finalVmConfig.host || !finalVmConfig.username || !finalVmConfig.password) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'VM configuration is incomplete' }));
                    return;
                }
                
                connectToVM(finalVmConfig, (err, conn) => {
                    if (err) {
                        console.error('VM connection error:', err);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: `Connection failed: ${err.message}` }));
                        return;
                    }
                    
                    listDirectoryFromVM(conn, directoryPath, (err, directoryList) => {
                        conn.end();
                        
                        if (err) {
                            console.error('Directory listing error:', err);
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: err.message }));
                        } else {
                            console.log(`Successfully listed directory: ${directoryPath} (${directoryList.length} items)`);
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ 
                                path: directoryPath,
                                contents: directoryList 
                            }));
                        }
                    });
                });
            } catch (error) {
                console.error('JSON parsing error:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: `Invalid request: ${error.message}` }));
            }
        });
        return;
    }
    
    // Handle VM file requests
    if (url.pathname === '/api/vm-file' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { vmConfig, filePath, useDefaults } = JSON.parse(body);
                
                // Determine which VM config to use
                let finalVmConfig;
                if (useDefaults) {
                    finalVmConfig = {
                        host: process.env.VM_HOST,
                        username: process.env.VM_USERNAME,
                        password: process.env.VM_PASSWORD,
                        port: process.env.VM_PORT || 22
                    };
                } else {
                    finalVmConfig = vmConfig;
                }
                
                connectToVM(finalVmConfig, (err, conn) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: err.message }));
                        return;
                    }
                    
                    getFileFromVM(conn, filePath, (err, fileContent) => {
                        conn.end();
                        
                        if (err) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: err.message }));
                        } else {
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ content: fileContent }));
                        }
                    });
                });
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }
    
    // Serve static files from dist directory
    let filePath = path.join(__dirname, '../dist', url.pathname);
    
    // If root, serve index.html
    if (url.pathname === '/') {
        filePath = path.join(__dirname, '../dist/index.html');
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // SPA Fallback: serve index.html for non-API routes that don't match a file
                if (!url.pathname.startsWith('/api')) {
                    fs.readFile(path.join(__dirname, '../dist/index.html'), (err, indexContent) => {
                        if (err) {
                            res.writeHead(500);
                            res.end('Error loading index.html');
                        } else {
                            res.writeHead(200, { 'Content-Type': 'text/html' });
                            res.end(indexContent, 'utf-8');
                        }
                    });
                } else {
                    res.writeHead(404);
                    res.end('API endpoint not found');
                }
            } else {
                res.writeHead(500);
                res.end('Server error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': mimeType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`🛠️  Dev Tools server running at http://localhost:${PORT}/`);
    console.log('Press Ctrl+C to stop the server');
});