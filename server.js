const sqlite3 = require('sqlite3').verbose();
const Client = require('ssh2-sftp-client');
const fs = require('fs');
const path = require('path');

var db;

function load_db(db_path) {
    db = new sqlite3.Database(db_path, (err) => {
        if (err) {
            console.error('Error connecting to SQLite database:', err);
            return;
        }
    });
}

async function download_file(server_conf, localFilePath, remoteFilePath) {
    const sftp = new Client();
    try {
        await sftp.connect(server_conf);
        await sftp.fastGet(remoteFilePath, localFilePath);
    } catch (err) {
        console.error(err.message);
        throw err;
    } finally {
        await sftp.end();
    }
}

async function upload_file(server_conf, localFilePath, remoteFilePath) {
    const sftp = new Client();
    try {
        await sftp.connect(server_conf);
        await sftp.put(localFilePath, remoteFilePath);
    } catch (err) {
        console.error(err.message);
        throw err;
    } finally {
        await sftp.end();
    }
}

async function count_table(tableName, filterCol, filterVal) {
    if (filterCol === undefined) {
        var sql = `SELECT COUNT(*) as count FROM ${tableName}`;
    } else {
        var sql = `SELECT COUNT(*) as count FROM ${tableName} WHERE ${filterCol} = ?`;
    }
    return new Promise((resolve, reject) => {
        db.get(sql, [filterVal], (err, row) => {
            resolve(row.count);
        });
    });
}

async function fetch_tables(tableName) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        })
    })
}

async function fetch_lan_contents(tableName, lanCode, filterCol, filterVal) {
    var sql = `SELECT * FROM ${tableName} WHERE lanCode = ?`;
    if (filterCol !== undefined) {
        sql = `SELECT * FROM ${tableName} WHERE lanCode = ? AND ${filterCol} = ?`;
    }
    return new Promise((resolve, reject) => {
        db.all(sql, [lanCode, filterVal], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        })
    })
}

async function fetch_name_with_ID(tableName, ID, lanCode) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT name FROM ${tableName} WHERE ID = ? AND lanCode = ?`,
            [ID, lanCode], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row?.name);
                }
            })
    })
}

async function clear_table(tableName) {
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM ${tableName}`, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

async function clear_lan(tableName, lanCode) {
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM ${tableName} where lanCode = ?`, lanCode, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        })
    })
}

async function upload_languages(languages) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare('INSERT INTO languages (code, name) VALUES (?, ?)');
        let i = 0;
        function next() {
            if (i < languages.length) {
                var language = languages[i++];
                stmt.run(language.code, language.name, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        next();
                    }
                });
            } else {
                stmt.finalize();
                resolve();
            }
        }
        next();
    });
}

async function upload_multi_rows(sql, rows) {
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

async function delete_user_submit(funcDesc, createTime) {
    return new Promise((resolve, reject) => {
        db.run(`DELETE from user_submit_function WHERE funcDesc = ? AND createTime = ?`, [funcDesc, createTime], (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        })
    })
}

module.exports = {
    load_db,
    count_table,
    clear_table,
    clear_lan,
    fetch_tables,
    fetch_lan_contents,
    fetch_name_with_ID,
    upload_multi_rows,
    upload_languages,
    delete_user_submit,
    upload_file,
    download_file
};