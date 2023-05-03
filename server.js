const sqlite3 = require('sqlite3');
const Client = require('ssh2-sftp-client');
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

async function download_file(server_conf, remoteFilePath) {
    const sftp = new Client();
    try {
        await sftp.connect(server_conf);
        await sftp.fastGet(remoteFilePath, local_db_path);
    } catch (err) {
        console.error(err.message);
        throw err;
    } finally {
        await sftp.end();
    }
}

async function upload_file(server_conf, remoteFilePath) {
    const sftp = new Client();
    try {
        await sftp.connect(server_conf);
        await sftp.put(local_db_path, remoteFilePath);
    } catch (err) {
        console.error(err.message);
        throw err;
    } finally {
        await sftp.end();
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
    insert_rows: insert_rows,
    upload_file,
    download_file
};