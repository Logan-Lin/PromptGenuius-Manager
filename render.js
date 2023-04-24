const left_drawer = new mdui.Drawer('#left-drawer');
var lan_code = localStorage.getItem('lan') || 'eng';
var cur_page = localStorage.getItem('page') || 'overview';

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
        $('#overview-stat-list').text('');
        stat_lists.forEach((list) => {
            $('#overview-stat-list').append(list);
        })
    });
}

function render_languages_page() {
    window.ipcRenderer.invoke('fetch-tables', 'languages').then(languages => {
        $('#languages-row').text('');
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
        $('.index-content-edit-row').remove();
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
            $('#classes-panel').text('');
            panels.forEach((list) => {
                $('#classes-panel').append(list);
            })
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
            $('#function-panel').text('');
            panels.forEach((panels) => {
                $('#function-panel').append(panels);
            })
            mdui.mutation();
        })
    })
}

function render_submits_page() {
    window.ipcRenderer.invoke('fetch-tables', 'user_submit_function').then((submits) => {
        $('#submit-panel').text('');
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
    ['Manage Classes', 'apps', 'classes'],
    ['Manage Functions', 'functions', 'functions'],
    ['User Submits', 'file_upload', 'submits'],
    ['System settings', 'settings', 'settings']
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
    $('.switch-containers').addClass('mdui-hidden');
    $(`#${cur_page}-container`).removeClass('mdui-hidden');
    window[`render_${cur_page}_page`]();
}

// Listeners
function saved_listener() {
    mdui.snackbar('Saved to cache DB.');
}

function downloaded_listener() {
    mdui.snackbar('Downloaded from remote DB.');
}

// Save listeners
function save_languages_listener() {
    var languages = [];
    $('#languages-row .edit-tbody').find('tr').each((index, tr) => {
        var code = $(tr).find('.code-input').val();
        var name = $(tr).find('.name-input').val();
        languages.push({ 'code': code, 'name': name });
    });
    window.ipcRenderer.invoke('clear-table', 'languages').then(() => {
        window.ipcRenderer.invoke('upload-rows', 'languages', languages).then(() => {
            saved_listener();
            render_language_selects();
        });
    });
}

function save_index_listener() {
    var entries = {};
    $('#index-container .edit-card').each((index, card) => {
        var location = $(card).attr('edit-target');
        var contents = [];
        $(card).find('.edit-tbody tr').each((index, tr) => {
            var ID = $(tr).find('.code-input').val();
            var content = $(tr).find('.name-input').val();
            contents.push({ 'ID': ID, 'content': content })
        })
        entries[location] = contents;
    })
    window.ipcRenderer.invoke('clear-lan', 'index_contents', lan_code).then(() => {
        Promise.all(
            Object.entries(entries).map(async ([location, contents]) => {
                return await window.ipcRenderer.invoke('upload-index-contents', lan_code, location, contents);
            })
        ).then(() => {
            saved_listener();
        })
    })
}

// Render pages.
render_left_drawer();
switch_displayed_page();

// Link listeners.
$('#drawer-btn').on('click', () => { left_drawer.toggle(); });
$('.language-select').on('change', (event) => {
    lan_code = $(event.target).find(':selected').val();
    render_language_selects();
    window[`render_${cur_page}_page`]();

    localStorage.setItem('lan', lan_code);
});
$('#save-cache-btn').on('click', () => {
    try {
        window[`save_${cur_page}_listener`]();
    } catch (error) {
        mdui.snackbar('This page do not contain data to save.');
    }
});
$('#download-db-btn').on('click', () => {
    mdui.confirm('Download from DB will discard all changes so far.',
        () => {
            window.ipcRenderer.invoke('reload-db').then(() => {
                init_render_all();
                downloaded_listener();
            })
        })
});
$('#upload-db-btn').on('click', () => {
    mdui.confirm('Upload changes will overwrite current database.',
        () => {
        });
});

$('#add-class-btn').on('click', () => {
    $('#classes-panel').append(gen_class_panel('', '', '', '', undefined));
})

$('#add-function-btn').on('click', () => {
    $('#function-panel').append(gen_function_panel('', '', []));
    mdui.mutation();
})

$('#settings-container input').on('input', () => {
    localStorage.setItem('host', $('#host-input').val());
    localStorage.setItem('port', $('#port-input').val());
    localStorage.setItem('path', $('#path-input').val());
    localStorage.setItem('username', $('#username-input').val());
    localStorage.setItem('password', $('#password-input').val());
})