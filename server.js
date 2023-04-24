const sqlite3 = require('sqlite3').verbose();
const Client = require('ssh2').Client;
const fs = require('fs');
const path = require('path');

const dbFilePath = path.join(__dirname, 'instance', 'PromptGenius.db');
var db;

function load_db() {
    db = new sqlite3.Database(dbFilePath, (err) => {
        if (err) {
            console.error('Error connecting to SQLite database:', err);
            return;
        }
    });
}

load_db();

var server_conf = {
    host: 'your_host',
    port: 22,
    username: 'your_username',
    password: 'your_password',
}

async function upload_file(localFilePath, remoteFilePath) {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => {
            conn.sftp((err, sftp) => {
                if (err) {
                    conn.end();
                    reject(err);
                    return;
                }

                const readStream = fs.createReadStream(localFilePath);
                const writeStream = sftp.createWriteStream(remoteFilePath);

                writeStream.on('close', () => {
                    conn.end();
                    resolve();
                });

                readStream.pipe(writeStream);
            });
        }).connect(server_conf);
    });
}

async function download_file(localFilePath, remoteFilePath) {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => {
            conn.sftp((err, sftp) => {
                if (err) {
                    conn.end();
                    reject(err);
                    return;
                }

                const readStream = sftp.createReadStream(remoteFilePath);
                const writeStream = fs.createWriteStream(localFilePath);

                writeStream.on('close', () => {
                    console.log('File downloaded successfully');
                    conn.end();
                    resolve();
                });

                readStream.pipe(writeStream);
            });
        }).connect(server_conf);
    });
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

async function upload_index_contents(lanCode, location, contents) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare('INSERT INTO index_contents (lanCode, location, ID, content) VALUES (?, ?, ?, ?)');
        let i = 0;
        function next() {
            if (i < contents.length) {
                var content = contents[i++];
                stmt.run(lanCode, location, content.ID, content.content, (err) => {
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
    upload_languages,
    upload_index_contents,
    delete_user_submit
};