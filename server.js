const { dialog } = require('electron');
const sqlite3 = require('sqlite3');
const fs = require('fs');
const path = require('path');

var db;
const local_db_path = path.join(__dirname, 'instance', 'PromptGenius.db');

function load_db() {
    db = new sqlite3.Database(local_db_path, (err) => {
        if (err) {
            console.error('Error connecting to SQLite database:', err);
            return;
        }
    });
}

async function open_file() {
    const result = await dialog.showOpenDialog({
        properties: ['openFile']
    })
    if (!result.canceled) {
        const filePath = result.filePaths[0];
        const fileContent = fs.readFileSync(filePath);
        fs.writeFileSync(local_db_path, fileContent);
        load_db();
        return 'Success';
    } else {
        return 'Canceled';
    }
}

async function save_file() {
    const savePath = await dialog.showSaveDialog({defaultPath: 'PromptGenius.db'});
    if (!savePath.canceled) {
        const fileContent = fs.readFileSync(local_db_path);
        fs.writeFile(savePath.filePath, fileContent, (err) => {
            if (err) {
                console.error(err);
                return err;
            }
        })
        return 'Success';
    } else {
        return 'Canceled';
    }
}

async function count_rows(tableName, filterCols, filterVals) {
    if (filterCols === undefined) {
        var sql = `SELECT COUNT(*) as count FROM ${tableName}`;
    } else {
        var filterStrs = filterCols.map(col => `${col} = ?`);
        var sql = `SELECT COUNT(*) as count FROM ${tableName} WHERE ${filterStrs.join(' AND ')}`;
    }
    return new Promise((resolve, reject) => {
        db.get(sql, filterVals, (err, row) => {
            resolve(row.count);
        });
    });
}

async function fetch_rows(tableName, fetchCols, filterCols, filterVals) {
    if (fetchCols !== undefined) {
        var fetchStr = `(${fetchCols.join(', ')})`;
    } else {
        var fetchStr = '*';
    }
    if (filterCols !== undefined) {
        var filterStrs = filterCols.map(col => `${col} = ?`);
        var sql = `SELECT ${fetchStr} FROM ${tableName} WHERE ${filterStrs.join(' AND ')}`;
    } else {
        var sql = `SELECT ${fetchStr} FROM ${tableName}`;
    }

    return new Promise((resolve, reject) => {
        db.all(sql, filterVals, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        })
    })
}

async function delete_rows(tableName, filterCols, filterVals) {
    if (filterCols !== undefined) {
        var filterStrs = filterCols.map(col => `${col} = ?`);
        var sql = `DELETE FROM ${tableName} WHERE ${filterStrs.join(' AND ')}`;
    } else {
        var sql = `DELETE FROM ${tableName}`;
    }

    return new Promise((resolve, reject) => {
        db.run(sql, filterVals, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        })
    })
}

async function insert_rows(sql, rows) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(sql);
        let i = 0;
        function next() {
            if (i < rows.length) {
                var row = rows[i++];
                stmt.run(...row, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        next();
                    }
                })
            } else {
                stmt.finalize();
                resolve();
            }
        }
        next();
    })
}

module.exports = {
    load_db,
    count_rows,
    fetch_rows,
    delete_rows,
    insert_rows,
    open_file,
    save_file
};