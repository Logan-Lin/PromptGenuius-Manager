const left_drawer = new mdui.Drawer('#left-drawer');
var lan_code = localStorage.getItem('lan') || 'eng';
var cur_page = localStorage.getItem('page') || 'settings';
const local_db_path = './instance/PromptGenius.db'
const download_confirm_dialog = new mdui.Dialog($('#download-confirm-dialog'));
const upload_confirm_dialog = new mdui.Dialog($('#upload-confirm-dialog'));

// Functions for render main containers.
function render_overview_page() {
    // Render statistic lists.
    Promise.all(
        // Create a list of promises, so that the list will only render when all queries are fulfilled.
        [
            ['translate', 'Languages', 'languages'],
            ['apps', 'Class labels', 'class_names', 'lanCode', lan_code],
            ['functions', 'Functions', 'function_names', 'lanCode', lan_code],
            ['lightbulb_outline', 'Prompts', 'function_prompts', 'lanCode', lan_code],
            ['account_circle', 'Pending user submits', 'user_submit_function']
        ].map(async ([icon, desc, table, col, val]) => {
            return gen_stat_list_desc(icon, desc, await window.ipcRenderer.invoke('count-table', table, col, val));
        })
    ).then((stat_lists) => {
        render_language_selects();
        stat_lists.forEach((list) => {
            $('#overview-stat-list').append(list);
        })
    });
}

function render_languages_page() {
    window.ipcRenderer.invoke('fetch-tables', 'languages').then(languages => {
        $('#languages-row').append(gen_edit_table_card('Manage Website Languages'));
        languages.forEach((row) => {
            $('#languages-row .edit-tbody').append(gen_code_name_tr(row.code, row.name));
        });
    })
}

function render_index_page() {
    Promise.all(
        [['Site', 'site'], ['Search Inputs', 'search'],
        ['Cards', 'cards'], ['Inputs', 'input'],
        ['Submit Dialog', 'submit_dialog'],
        ['Tools Dialog', 'tools_dialog']].map(async ([title, location]) => {
            var card = gen_edit_table_card(`Contents in ${title}`);
            card.attr('edit-target', location);
            (await window.ipcRenderer.invoke('fetch-lan-contents', 'index_contents', lan_code, 'location', location)).forEach((row) => {
                card.find('.edit-tbody').append(gen_code_name_tr(row.ID, row.content, 2));
            })
            return card;
        })
    ).then((cards) => {
        render_language_selects();
        cards.forEach((card) => {
            $('#index-container').append($(`<div class="mdui-row index-content-edit-row mdui-m-y-2">`).append(card));
        })
    })
}

function render_classes_page() {
    window.ipcRenderer.invoke('fetch-tables', 'classes').then((classes) => {
        Promise.all(classes.map(async ({ ID, icon, icon_style, childrens }) => {
            var class_name = await window.ipcRenderer.invoke('fetch-name-with-ID', 'class_names', ID, lan_code);
            var childs = undefined;
            if (childrens !== null) {
                childs = await Promise.all(childrens.split(',').map(async (child_id) => {
                    return {
                        id: child_id,
                        name: await window.ipcRenderer.invoke('fetch-name-with-ID', 'class_names', child_id, lan_code)
                    }
                }))
            }
            return gen_class_panel(ID, class_name, icon, icon_style, childs);
        })).then((panels) => {
            render_language_selects();
            panels.forEach((list) => {
                $('#classes-panel').append(list);
            });
            $('#classes-panel').sortable();
            mdui.mutation();
        })
    })
}

function render_functions_page() {
    window.ipcRenderer.invoke('fetch-tables', 'functions').then((functions) => {
        Promise.all(functions.map(async ({ ID, classes }) => {
            var function_name = await window.ipcRenderer.invoke('fetch-name-with-ID', 'function_names', ID, lan_code);
            var class_tags = await Promise.all(classes.split(',').map(async (class_id) => {
                return {
                    id: class_id,
                    name: await window.ipcRenderer.invoke('fetch-name-with-ID', 'class_names', class_id, lan_code)
                }
            }));
            return gen_function_panel(ID, function_name, class_tags);
        })).then((panels) => {
            render_language_selects();
            panels.forEach((panels) => {
                $('#function-panel').append(panels);
            });
            $('#function-panel').sortable();
            mdui.mutation();
        })
    })
}

function render_tools_page() {
    window.ipcRenderer.invoke('fetch-lan-contents', 'tools', lan_code).then((tools) => {
        tools.forEach(({ name, desc, url, icon_src, tags }) => {
            $('#tools-panel').append(gen_tool_panel(name, desc, url, icon_src, tags));
        });
        $('#tools-panel').sortable();
    })
}

function render_submits_page() {
    window.ipcRenderer.invoke('fetch-tables', 'user_submit_function').then((submits) => {
        submits.forEach(({ funcDesc, createTime, promptContent, userName }) => {
            $('#submit-panel').append(gen_submit_panel(funcDesc, createTime, promptContent, userName));
        })
    })
}

function render_settings_page() {
    $('#host-input').val(localStorage.getItem('host'));
    $('#port-input').val(localStorage.getItem('port'));
    $('#path-input').val(localStorage.getItem('path'));
    $('#username-input').val(localStorage.getItem('username'));
    $('#password-input').val(localStorage.getItem('password'));
}

function clear_all_pages() {
    $('#overview-stat-list').text('');
    $('#languages-row').text('');
    $('.index-content-edit-row').remove();
    $('#classes-panel').text('');
    $('#function-panel').text('');
    $('#tools-panel').text('');
    $('#submit-panel').text('');
}

function render_language_selects() {
    window.ipcRenderer.invoke('fetch-tables', 'languages').then(languages => {
        $('.language-select').text('');
        languages.forEach((row) => {
            var option = $(`<option value="${row.code}">`).text(row.name);
            if (row.code == lan_code) {
                option.attr('selected', 'selected');
            }
            $('.language-select').append(option);
        });
    })
}

function render_left_drawer() {
    $('#left-drawer ul').text('');
    // Append all list items into the left drawer.
    [['Overview', 'search', 'overview'],
    ['Manage Languages', 'language', 'languages'],
    ['Edit Index Contents', 'home', 'index'],
    ['Manage Classes', 'list', 'classes'],
    ['Manage Functions', 'functions', 'functions'],
    ['Manage Tools', 'apps', 'tools'],
    ['User Submits', 'file_upload', 'submits'],
    ['System Settings', 'settings', 'settings']
    ].forEach((item) => {
        var list = $(`
        <li class="mdui-list-item mdui-ripple" container-target="${item[2]}">
            <i class="mdui-icon material-icons mdui-list-item-icon">${item[1]}</i>
            <div class="mdui-list-item-content">${item[0]}</div>
        </li>`);
        list.on('click', (event) => {
            cur_page = $(event.target).parents('.mdui-list-item').attr('container-target');;
            if (cur_page === undefined) {
                cur_page = $(event.target).attr('container-target');
            }
            localStorage.setItem('page', cur_page);
            switch_displayed_page();
        });
        $('#left-drawer ul').append(list);
    });
}

// Control functions
function switch_displayed_page() {
    $('.switch-containers').hide();
    clear_all_pages();
    window[`render_${cur_page}_page`]();
    $(`#${cur_page}-container`).show();
}

// Listeners
function saved_listener() {
    mdui.snackbar('Saved to cache DB.');
}

function downloaded_listener() {
    mdui.snackbar('Downloaded from remote DB.');
}

function uploaded_listener() {
    mdui.snackbar('Uploaded to remote DB.');
}

// Save listeners
async function save_languages_listener() {
    var languages = [];
    $('#languages-row .edit-tbody').find('tr').each((index, tr) => {
        var code = $(tr).find('.code-input').val();
        var name = $(tr).find('.name-input').val();
        languages.push([code, name]);
    });
    await window.ipcRenderer.invoke('clear-table', 'languages');
    await window.ipcRenderer.invoke('upload-multi-rows', 'languages',
        ['code', 'name'], languages);
}

async function save_index_listener() {
    var contents = [];
    $('#index-container .edit-card').each((index, card) => {
        var location = $(card).attr('edit-target');
        $(card).find('.edit-tbody tr').each((index, tr) => {
            var ID = $(tr).find('.code-input').val();
            var content = $(tr).find('.name-input').val();
            contents.push([lan_code, location, ID, content]);
        })
    })
    await window.ipcRenderer.invoke('clear-lan', 'index_contents', lan_code);
    await window.ipcRenderer.invoke('upload-multi-rows', 'index_contents',
        ['lanCode', 'location', 'ID', 'content'], contents);
}

function hasDuplicates(array) {
    for (let i = 0; i < array.length; i++) {
        if (array.indexOf(array[i]) !== i) {
            return true;
        }
    }
    return false;
}

async function save_classes_listener() {
    var _class_IDs = [];
    var classes = [];
    var class_names = [];
    $('#classes-panel .class-panel-item').each((index, item) => {
        var ID = $(item).find('.class-id-input').val();
        var name = $(item).find('.class-name-input').val();
        var icon = $(item).find('.class-icon-input').val();
        var icon_style = $(item).find('.class-icon-style-input').val();
        if ($(item).find('.child-row').length === 0) {
            var childrens = null;
        } else {
            var childrens = [];
            $(item).find('.child-row').each((index, row) => {
                var child_ID = $(row).find('.child-id-input').val();
                var child_name = $(row).find('.child-name-input').val();
                childrens.push(child_ID);
                if (!_class_IDs.includes(child_ID)) {
                    class_names.push([child_ID, lan_code, child_name])
                    _class_IDs.push(child_ID);
                }
            });
            childrens = childrens.join(',');
        }
        classes.push([ID, icon, icon_style, childrens]);
        if (!_class_IDs.includes(ID)) {
            class_names.push([ID, lan_code, name]);
            _class_IDs.push(ID);
        }
    });
    await window.ipcRenderer.invoke('clear-table', 'classes');
    await window.ipcRenderer.invoke('upload-multi-rows', 'classes',
        ['ID', 'icon', 'icon_style', 'childrens'], classes);
    await window.ipcRenderer.invoke('clear-lan', 'class_names', lan_code);
    await window.ipcRenderer.invoke('upload-multi-rows', 'class_names',
        ['ID', 'lanCode', 'name'], class_names);
}

async function save_settings_listener() {
    localStorage.setItem('host', $('#host-input').val());
    localStorage.setItem('port', $('#port-input').val());
    localStorage.setItem('path', $('#path-input').val());
    localStorage.setItem('username', $('#username-input').val());
    localStorage.setItem('password', $('#password-input').val());
}

// Render pages.
window.ipcRenderer.invoke('reload-db', local_db_path).then(() => {
    render_left_drawer();
    render_language_selects();
    switch_displayed_page();
})

// Link listeners.
$('#drawer-btn').on('click', () => { left_drawer.toggle(); });
$('.language-select').on('change', (event) => {
    lan_code = $(event.target).find(':selected').val();
    render_language_selects();
    switch_displayed_page();

    localStorage.setItem('lan', lan_code);
});
$('#save-cache-btn').on('click', () => {
    try {
        window[`save_${cur_page}_listener`]().then(saved_listener);
    } catch (error) {
        mdui.snackbar('This page do not contain data to save.');
    }
});
$('#download-db-btn').on('click', () => { download_confirm_dialog.open() });
$('#upload-db-btn').on('click', () => { upload_confirm_dialog.open() });

$('#download-cancel-btn').on('click', () => { download_confirm_dialog.close() });
$('#download-confirm-btn').on('click', () => {
    $('#download-confirm-dialog .mdui-dialog-actions').addClass('mdui-invisible');
    $('#download-confirm-dialog-prompt').addClass('mdui-hidden');
    $('#download-confirm-dialog-progress').removeClass('mdui-hidden');
    window.ipcRenderer.invoke('download-file',
        localStorage.getItem('host'), localStorage.getItem('port'),
        localStorage.getItem('username'), localStorage.getItem('password'),
        local_db_path, localStorage.getItem('path')).then(() => {
            window.ipcRenderer.invoke('reload-db', local_db_path).then(() => {
                download_confirm_dialog.close();
                $('#download-confirm-dialog .mdui-dialog-actions').removeClass('mdui-invisible');
                $('#download-confirm-dialog-prompt').removeClass('mdui-hidden');
                $('#download-confirm-dialog-progress').addClass('mdui-hidden');
                switch_displayed_page();
                downloaded_listener();
            })
        })
});
$('#upload-cancel-btn').on('click', () => { upload_confirm_dialog.close() });
$('#upload-confirm-btn').on('click', () => {
    $('#upload-confirm-dialog .mdui-dialog-actions').addClass('mdui-hidden');
    $('#upload-confirm-dialog-prompt').addClass('mdui-hidden');
    $('#upload-confirm-dialog-progress').removeClass('mdui-hidden');
    window.ipcRenderer.invoke('upload-file',
        localStorage.getItem('host'), localStorage.getItem('port'),
        localStorage.getItem('username'), localStorage.getItem('password'),
        local_db_path, localStorage.getItem('path')).then(() => {
            upload_confirm_dialog.close();
            $('#upload-confirm-dialog .mdui-dialog-actions').removeClass('mdui-hidden');
            $('#upload-confirm-dialog-prompt').removeClass('mdui-hidden');
            $('#upload-confirm-dialog-progress').addClass('mdui-hidden');
            uploaded_listener();
        })
})

$('#add-class-btn').on('click', () => {
    $('#classes-panel').append(gen_class_panel('', '', '', '', undefined));
})

$('#add-function-btn').on('click', () => {
    $('#function-panel').append(gen_function_panel('', '', []));
    mdui.mutation();
})

$('#function-search-input').on('input', () => {
    var search_content = $("#function-search-input").val().toLowerCase();
    $('#function-panel').children('.mdui-panel-item').each((i, item) => {
        var contains_content = $(item).find('.function-id-input').val().toLowerCase().includes(search_content) |
            $(item).find('.function-name-input').val().toLowerCase().includes(search_content)

        if (!contains_content) {
            $(item).find('.class-tag-chip').each((j, chip) => {
                if ($(chip).children('.mdui-chip-title').text().toLowerCase().includes(search_content)) {
                    contains_content = true;
                }
            })
        }

        setTimeout(() => {
            if (contains_content) {
                $(item).show();
            } else {
                $(item).hide();
            }
        }, 10)
    });
    mdui.mutation();
})

$('#add-tool-btn').on('click', () => {
    $('#tools-panel').append(gen_tool_panel('', '', '', '', ''));
})