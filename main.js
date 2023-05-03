const { app, BrowserWindow } = require('electron');
const { ipcMain } = require('electron');
const path = require('path');
const server = require('./server.js');

if (process.env.NODE_ENV === 'development') {
    require('electron-reload')(__dirname, {
        electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
        hardResetMethod: 'exit',
    });
}

function createWindow() {
    const window = new BrowserWindow({
        width: 1100,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        }
    });
    window.loadFile('index.html');
};

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });
});

ipcMain.handle('reload-db', async (event) => {
    server.load_db();
    return 'Finished'
})

ipcMain.handle('count-rows', async (event, tableName, filterCols, filterVals) => {
    return await server.count_rows(tableName, filterCols, filterVals);
})

ipcMain.handle('fetch-rows', async (event, tableName, fetchCols, filterCol, filterVal) => {
    return await server.fetch_rows(tableName, fetchCols, filterCol, filterVal);
})

ipcMain.handle('delete-rows', async (event, tableName, filterCols, filterVals) => {
    await server.delete_rows(tableName, filterCols, filterVals);
    return 'Finished';
})

ipcMain.handle('insert-rows', async (event, tableName, colNames, rows) => {
    var sql = `INSERT INTO ${tableName} (${colNames.join(', ')}) VALUES (${Array(colNames.length).fill('?').join(', ')})`
    await server.insert_rows(sql, rows);
    return 'Finished';
})

ipcMain.handle('upload-file', async (event, host, port, username, password, remote) => {
    var server_conf = {
        host: host,
        port: port,
        username: username,
        password: password
    }
    await server.upload_file(server_conf, remote);
    return 'Finished'
})

ipcMain.handle('download-file', async (event, host, port, username, password, remote) => {
    var server_conf = {
        host: host,
        port: port,
        username: username,
        password: password
    }
    await server.download_file(server_conf, remote);
    return 'Finished';
})