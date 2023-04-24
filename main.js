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

ipcMain.handle('reload-db', async(event) => {
    server.load_db();
    return 'Finished'
})

ipcMain.handle('count-table', async (event, tableName, filterCol, filterVal) => {
    return await server.count_table(tableName, filterCol, filterVal);
})

ipcMain.handle('fetch-tables', async (event, tableName) => {
    return await server.fetch_tables(tableName);
})

ipcMain.handle('fetch-name-with-ID', async (event, tableName, ID, lanCode) => {
    return await server.fetch_name_with_ID(tableName, ID, lanCode);
})

ipcMain.handle('clear-table', async (event, tableName) => {
    await server.clear_table(tableName);
    return 'Finished';
})

ipcMain.handle('upload-rows', async(event, function_name, rows) => {
    await server[`upload_${function_name}`](rows);
    return 'Finished'
})

ipcMain.handle('upload-index-contents', async(event, lanCode, location, contents) => {
    await server.upload_index_contents(lanCode, location, contents);
    return 'Finished'
})

ipcMain.handle('fetch-lan-contents', async(event, tableName, lanCode, filterCol, filterVal) => {
    return await server.fetch_lan_contents(tableName, lanCode, filterCol, filterVal);
})

ipcMain.handle('clear-lan', async(event, tableName, lanCode) => {
    await server.clear_lan(tableName, lanCode);
    return 'Finished'
})

ipcMain.handle('delete-user-submit', async(event, funcDesc, createTime) => {
    await server.delete_user_submit(funcDesc, createTime);
    return 'Finished'
})