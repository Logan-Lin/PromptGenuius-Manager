function gen_stat_list_desc(icon, desc, value) {
    return `
    <li class="mdui-list-item mdui-ripple">
        <i class="mdui-list-item-icon mdui-icon material-icons">${icon}</i>
        <div class="mdui-list-item-content">${desc}</div>
        <div class="mdui-list-item-icon mdui-typo-title mdui-text-color-deep-orange-900">${value}</div>
    </li>
    `
}

function gen_code_name_tr(code, name, name_num_col) {
    if (name_num_col !== undefined) {
        var name_input = `<textarea class="mdui-textfield-input name-input" 
        rows="${name_num_col}" wrap="soft" type="text">${name}</textarea>`;
    } else {
        var name_input = `<input class="mdui-textfield-input name-input" type="text" value="${name}"/>`;
    }
    var row = $(`
        <tr>
            <td>
                <input class="mdui-textfield-input code-input" type="text" value="${code}"/>
            </td>
            <td>
                ${name_input}
            </td>
        </tr>
    `);
    var remove_btn = $(`
        <td><button class="mdui-btn mdui-btn-icon">
            <i class="mdui-icon material-icons">close</i>
        </button></td>
    `);
    remove_btn.on('click', (event) => {
        $(event.target).parents('tr').remove();
    })
    row.prepend(remove_btn);
    return row;
}

function gen_edit_table_card(title) {
    var card = $(`
        <div class="mdui-card edit-card">
            <div class="mdui-card-primary">
                <div class="mdui-card-primary-title">${title}</div>
            </div>
            <div class="mdui-card-content">
                <div class="mdui-table-fiuld">
                    <table class="mdui-table mdui-table-hoverable">
                        <thead>
                            <tr>
                                <th></th>
                                <th>Code</th>
                                <th>Name</th>
                            </tr>
                        </thead>
                        <tbody class="edit-tbody"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `);
    card.append($(`
        <div class="mdui-card-actions mdui-float-right">
    `).append(`
        <button class="mdui-btn mdui-ripple">Add</button>
    `).on('click', (event) => {
        var target_tbody = $(event.target).parents('.mdui-card').find('.edit-tbody');
        var first_name_input = target_tbody.find('.name-input:first');
        if (first_name_input.is('textarea')) {
            var num_rows = first_name_input.attr("rows");
        }
        target_tbody.append(gen_code_name_tr('', '', num_rows));
    }));
    return card;
}

function gen_class_panel_child_row(id, name) {
    var child_row = $(`
        <div class="mdui-row child-row">
            <div class="mdui-col-xs-1">
                <button class="mdui-btn mdui-btn-icon mdui-float-right child-row-remove-btn">
                    <i class="mdui-icon material-icons">close</i>
                </button>
            </div>
            <div class="mdui-col-xs-5">
                <input class="mdui-textfield-input child-id-input" type="text" value="${id}" placeholder="ID"/>
            </div>
            <div class="mdui-col-xs-6">
                <input class="mdui-textfield-input child-name-input" type="text" value="${name}" placeholder="name"/>
            </div>
        </div>
    `);
    child_row.find('.child-row-remove-btn').on('click', () => {
        if (child_row.parent().find('.child-row').length === 1) {
            child_row.parents('.class-panel-body').find('.panel-divider').remove();
        }
        child_row.remove();
    })
    return child_row;
}

function gen_class_panel(class_id, class_name, class_icon, icon_style, childs) {
    var panel = $(`
        <div class="mdui-panel-item">
            <div class="mdui-panel-item-header">
                <div class="mdui-panel-item-title class-name">${class_name || ''}</div>
                <div class="mdui-panel-item-summary">
                    <i class="class-icon ${icon_style}">${class_icon}</i>
                </div>
                <div class="mdui-panel-item-summary class-id">${class_id}</div>
                <i class="mdui-panel-item-arrow mdui-icon material-icons">keyboard_arrow_down</i>
            </div>
        </div>
    `);
    var panel_body = $(`
        <div class="mdui-panel-item-body class-panel-body">
            <div class="mdui-row">
                <div class="mdui-col-xs-5">
                    <input class="mdui-textfield-input class-id-input" type="text" value="${class_id}" placeholder="ID"/>
                </div>
                <div class="mdui-col-xs-7">
                    <input class="mdui-textfield-input class-name-input" type="text" value="${class_name || ''}" placeholder="name"/>
                </div>
            </div>
            <div class="mdui-row">
                <div class="mdui-col-xs-5">
                    <input class="mdui-textfield-input class-icon-input" type="text" value="${class_icon}" placeholder="ID"/>
                </div>
                <div class="mdui-col-xs-7">
                    <input class="mdui-textfield-input class-icon-style-input" type="text" value="${icon_style}" placeholder="name"/>
                </div>
            </div>
        </div>
    `);
    panel.append(panel_body);

    var child_container = $('<div class="mdui-container-fluid class-child-container"></div>');
    panel_body.append(child_container);

    var class_id_input = panel_body.find('.class-id-input');
    var class_name_input = panel_body.find('.class-name-input');
    var class_icon_input = panel_body.find('.class-icon-input');
    var class_icon_style_input = panel_body.find('.class-icon-style-input');
    var class_icon = panel.find('.class-icon');
    class_id_input.on('input', () => {
        panel.find('.class-id').text(class_id_input.val());
    })
    class_name_input.on('input', () => {
        panel.find('.class-name').text(class_name_input.val());
    });
    class_icon_input.on('input', () => {
        class_icon.text(class_icon_input.val());
    });
    class_icon_style_input.on('input', () => {
        class_icon.removeClass();
        class_icon.addClass(`class-icon ${class_icon_style_input.val()}`)
    })

    let panel_divider = $(`<div class="mdui-typo mdui-m-y-1 panel-divider"> <hr/> </div>`);
    if (childs !== undefined) {
        child_container.append(panel_divider);
        childs.forEach((child) => {
            child_container.append(gen_class_panel_child_row(child.id, child.name || ''));
        });
    }

    var class_delete_btn = $(`<button class="mdui-btn mdui-ripple class-delete-btn mdui-text-color-red">Delete</button>`);
    var class_add_child_btn = $(`<button class="mdui-btn mdui-ripple class-add-child-btn">Add Child</button>`);
    var panel_action = $(`<div class="mdui-panel-item-actions"></div>`).append(class_delete_btn, class_add_child_btn);
    panel_body.append(panel_action);
    class_delete_btn.on('click', () => {
        panel.remove();
    })
    class_add_child_btn.on('click', () => {
        if (panel_body.find('.child-row').length === 0) {
            child_container.append(panel_divider);
        }
        child_container.append(gen_class_panel_child_row('', ''));
    })

    return panel;
}

function gen_class_tag_chip(class_id, class_name) {
    var class_chip = $(`
    <div class="mdui-chip class-tag-chip mdui-m-r-1 mdui-color-grey-300" class-id="${class_id}">
        <span class="mdui-chip-title">${class_name}</span>
        <span class="mdui-chip-delete class-tag-delete-btn">
            <i class="mdui-icon material-icons">cancel</i>
        </span>
    </div>
    `);
    class_chip.find('.class-tag-delete-btn').on('click', () => {
        class_chip.remove();
    });
    return class_chip;
}

function gen_prompt_panel(prompt_id, priority, model, content, author, author_link) {
    var panel = $(`
        <div class="mdui-panel-item mdui-color-amber-100">
            <div class="mdui-panel-item-header">
                <button class="mdui-btn mdui-btn-icon mdui-float-right prompt-delete-btn">
                    <i class="mdui-icon material-icons">close</i>
                </button>
                <div class="mdui-panel-item-title prompt-id">${prompt_id}</div>
                <div class="mdui-panel-item-summary prompt-content">${content || ''}</div>
                <i class="mdui-panel-item-arrow mdui-icon material-icons">keyboard_arrow_down</i>
            </div>
        </div>
    `);
    panel.find('.prompt-delete-btn').on('click', () => { panel.remove() });

    var panel_body = $(`
        <div class="mdui-panel-item-body prompt-panel-body">
            <div class="mdui-row">
                <div class="mdui-col-xs-2">
                    <input class="mdui-textfield-input prompt-priority-input" type="number" value="${priority}" placeholder="rank"/>
                </div>
                <div class="mdui-col-xs-10">
                    <input class="mdui-textfield-input prompt-id-input" type="text" value="${prompt_id}" placeholder="semantic ID"/>
                </div>
            </div>
            <div class="mdui-row">
                <div class="mdui-col-xs-4">
                    <input class="mdui-textfield-input prompt-model-input" type="text" value="${model || ''}" placeholder="model"/>
                </div>
                <div class="mdui-col-xs-4">
                    <input class="mdui-textfield-input prompt-author-input" type="text" value="${author || ''}" placeholder="author"/>
                </div>
                <div class="mdui-col-xs-4">
                    <input class="mdui-textfield-input prompt-author-link-input" type="text" value="${author_link || ''}" placeholder="link"/>
                </div>
            </div>
            <div class="mdui-row">
                <div class="mdui-col-xs-12">
                    <textarea class="mdui-textfield-input prompt-content-input" wrap="soft" placeholder="Content">${content || ''}</textarea>
                </div>
            </div>
        </div>
    `);
    panel.append(panel_body);

    var prompt_id_input = panel_body.find('.prompt-id-input');
    var prompt_content_input = panel_body.find('.prompt-content-input');
    prompt_id_input.on('input', () => {
        panel.find('.prompt-id').text(prompt_id_input.val());
    });
    prompt_content_input.on('input', () => {
        panel.find('.prompt-content').text(prompt_content_input.val());
    });

    return panel;
}

function pop_class_choice_dialog(lan_code, class_click_listenser, dialog_close_listener) {
    window.ipcRenderer.invoke('fetch-lan-contents', 'class_names', lan_code).then((classes) => {
        var class_choice_dialog = $(`
                <div class="mdui-dialog">
                    <div class="mdui-dialog-title">
                        <div class="mdui-row">
                            <span class="mdui-typo-title">Choice class</span>
                            <button class="mdui-btn mdui-btn-icon mdui-float-right" 
                                id="class-choice-dialog-close-btn">
                                <i class="mdui-icon material-icons">close</i>
                            </button>
                        </div>
                    </div>
                    <div class="mdui-dialog-content">
                        <ul class="mdui-list mdui-list-dense mdui-row-sm-2 mdui-row-md-3 mdui-row-lg-4 mdui-row-xl-5" 
                            id="class-choice-list"></ul>
                    </div>
                </div>
            `);
        var mdui_dialog = new mdui.Dialog(class_choice_dialog);

        classes.forEach(({ ID, name }) => {
            var class_choice_list_item = $(`
                    <li class="mdui-list-item mdui-ripple mdui-col card-choice-list-item">
                        <div class="mdui-list-item-content card-choice-list-item-content" class-id="${ID}">${name}</div>
                    </li>
                `);
            class_choice_dialog.find('#class-choice-list').append(class_choice_list_item);
            class_choice_list_item.on('click', (event) => {
                var target = $(event.target);
                class_click_listenser(target);
                mdui_dialog.close();
            });
        });

        class_choice_dialog.find('#class-choice-dialog-close-btn').on('click', () => {
            dialog_close_listener();
            mdui_dialog.close()
        });
        mdui_dialog.open();
    });

}

function gen_function_panel(function_id, function_name, class_tags) {
    var panel = $(`
        <div class="mdui-panel-item">
            <div class="mdui-panel-item-header">
                <div class="mdui-panel-item-title function-name">${function_name || ''}</div>
                <div class="mdui-panel-item-summary function-id">${function_id}</div>
                <i class="mdui-panel-item-arrow mdui-icon material-icons">keyboard_arrow_down</i>
            </div>
        </div>
    `);
    var panel_body = $(`
        <div class="mdui-panel-item-body function-panel-body">
            <div class="mdui-row">
                <div class="mdui-col-xs-5">
                    <input class="mdui-textfield-input function-id-input" type="text" value="${function_id}" placeholder="ID"/>
                </div>
                <div class="mdui-col-xs-7">
                    <input class="mdui-textfield-input function-name-input" type="text" value="${function_name || ''}" placeholder="name"/>
                </div>
            </div>
        </div>
    `);
    panel.append(panel_body);

    // Function ID and name inputs.
    var function_id_input = panel_body.find('.function-id-input');
    var function_name_input = panel_body.find('.function-name-input');
    function_id_input.on('input', () => {
        panel.find('.function-id').text(function_id_input.val());
    });
    function_name_input.on('input', () => {
        panel.find('.function-name').text(function_name_input.val());
    });

    // Container for the class tag.
    var class_tag_container = $(`
        <div class="mdui-container-fluid class-tag-container mdui-m-y-1 mdui-p-y-1 mdui-color-yellow-100 mdui-shadow-1"></div>
    `);
    class_tags.forEach(({ id, name }) => {
        class_tag_container.append(gen_class_tag_chip(id, name));
    });
    var add_class_tag_chip = $(`
        <div class="mdui-chip mdui-color-yellow-a700">
            <span class="mdui-chip-title">Add Class</span>
        </div>
    `);
    class_tag_container.append(add_class_tag_chip);
    panel_body.append(class_tag_container);

    // Open a dialog for adding class tags.
    add_class_tag_chip.on('click', () => {
        pop_class_choice_dialog(
            lan_code,
            (target) => {
                gen_class_tag_chip(target.attr('class-id'), target.text()).insertBefore(add_class_tag_chip);
            },
            () => { })
    });

    var prompt_panels = $(`
        <div class="mdui-panel mdui-panel-gapless prompt-panel" mdui-panel></div>
    `).sortable();
    window.ipcRenderer.invoke('fetch-lan-contents', 'function_prompts', lan_code, 'functionID', function_id).then((prompts) => {
        prompts.forEach(({ semanticID, priority, model, content, author, author_link }) => {
            prompt_panels.append(gen_prompt_panel(semanticID, priority, model, content, author, author_link));
        })
    })
    panel_body.append(prompt_panels);

    var function_delete_btn = $(`<button class="mdui-btn mdui-ripple function-delete-btn mdui-text-color-red">Delete</button>`);
    var prompt_add_btn = $(`<button class="mdui-btn mdui-ripple prompt-add-btn">Add Prompt</button>`)
    var panel_action = $(`<div class="mdui-panel-item-actions"></div>`).append(function_delete_btn, prompt_add_btn);
    panel_body.append(panel_action);
    function_delete_btn.on('click', () => {
        panel.remove();
    });
    prompt_add_btn.on('click', () => {
        prompt_panels.append(gen_prompt_panel('', 0, '', '', '', ''));
    })

    return panel;
}

function pop_function_choice_dialog(lan_code, function_click_listener, dialog_close_listener) {
    window.ipcRenderer.invoke('fetch-tables', 'functions').then((functions) => {
        var function_choice_dialog = $(`
                    <div class="mdui-dialog">
                        <div class="mdui-dialog-title">
                            <div class="mdui-row">
                                <span class="mdui-typo-title">Choice functions</span>
                                <button class="mdui-btn mdui-btn-icon mdui-float-right" 
                                    id="function-choice-dialog-close-btn">
                                    <i class="mdui-icon material-icons">close</i>
                                </button>
                            </div>
                        </div>
                        <div class="mdui-dialog-content">
                            <ul class="mdui-list mdui-list-dense mdui-row-sm-2 mdui-row-md-3 mdui-row-lg-4 mdui-row-xl-5" 
                                id="function-choice-list"></ul>
                        </div>
                    </div>
                `);
        var mdui_dialog = new mdui.Dialog(function_choice_dialog);

        Promise.all(functions.map(async ({ ID }) => {
            return {
                id: ID,
                name: await window.ipcRenderer.invoke('fetch-name-with-ID', 'function_names', ID, lan_code)
            }
        })).then((function_names) => {
            function_names.forEach(({ id, name }) => {
                var function_list = $(`
                            <li class="mdui-list-item mdui-ripple mdui-col card-choice-list-item">
                                <div class="mdui-list-item-content" function-id="${id}">${name || id}</div>
                            </li>
                        `);
                function_choice_dialog.find('#function-choice-list').append(function_list);

                function_list.on('click', (event) => {
                    function_click_listener($(event.target));
                    mdui_dialog.close();
                });
            })
            mdui_dialog.open();
        })

        function_choice_dialog.find('#function-choice-dialog-close-btn').on('click', () => {
            dialog_close_listener();
            mdui_dialog.close();
        });
    })
}

function gen_submit_panel(func_desc, create_time, prompt_content, user_name) {
    var panel = $(`
        <div class="mdui-panel-item">
            <div class="mdui-panel-item-header">
                <div class="mdui-panel-item-title submit-funcdesc">${func_desc}</div>
                <div class="mdui-panel-item-summary submit-prompt-content">${prompt_content}</div>
                <i class="mdui-panel-item-arrow mdui-icon material-icons">keyboard_arrow_down</i>
            </div>
        </div>
    `);

    var datetime = create_time.split('_')
    datetime = `${datetime[0]}.${datetime[1]}.${datetime[2]} ${datetime[3]}:${datetime[4]}`;
    var panel_body = $(`
        <div class="mdui-panel-item-body submit-panel-body">
            <div class="mdui-container-fluid mdui-p-y-1 mdui-m-b-1">
                <div class="mdui-chip mdui-m-r-1 mdui-color-blue-200">
                    <span class="mdui-chip-icon mdui-color-blue-600">
                        <i class="mdui-icon material-icons">access_time</i>
                    </span>
                    <span class="mdui-chip-title">${datetime}</span>
                </div>
                <div class="mdui-chip mdui-color-deep-purple-200">
                    <span class="mdui-chip-icon mdui-color-deep-purple-600">
                        <i class="mdui-icon material-icons">account_circle</i>
                    </span>
                    <span class="mdui-chip-title">${user_name || 'Anonymous'}</span>
                </div>
            </div>
            <div class="mdui-row">
                <div class="mdui-col-xs-7">
                    <input class="mdui-textfield-input submit-funcdesc-input" type="text" value="${func_desc}" placeholder="Function"/>
                </div>
                <div class="mdui-col-xs-5">
                    <input class="mdui-textfield-input submit-funcid-input" type="text" placeholder="Function ID"/>
                </div>
            </div>
            <div class="mdui-row">
                <div class="mdui-col-xs-12">
                    <textarea class="mdui-textfield-input submit-content-input" wrap="soft" 
                        rows="2" type="text" placeholder="Prompt content">${prompt_content}</textarea>
                </div>
            </div>
            <div class="mdui-container-fluid mdui-color-amber-100 mdui-p-y-1 mdui-m-y-1">
                <form class="language-form"></form>
            </div>
        </div>
    `);
    panel.append(panel_body);

    var language_form = panel_body.find('.language-form');
    window.ipcRenderer.invoke('fetch-tables', 'languages').then(languages => {
        language_form.text('');
        languages.forEach(({ code, name }) => {
            language_form.append(`
                <label class="mdui-radio">
                    <input type="radio" name="language-ratio-group" value="${code}" checked/>
                    <i class="mdui-radio-icon"></i>
                    ${name}
                </label>
            `)
        });
    })

    var new_function_check = $(`
        <span>
            <span class="mdui-typo-body-2">Create new function</span>
            <label class="mdui-switch">
                <input type="checkbox" checked/>
                <i class="mdui-switch-icon"></i>
            </label>
        </span>
    `)
    var discard_btn = $(`<button class="mdui-btn mdui-ripple discard-btn mdui-text-color-red">Discard</button>`);
    var adopt_btn = $(`<button class="mdui-btn mdui-ripple adopt-btn">Adopt</button>`)
    var panel_action = $(`<div class="mdui-panel-item-actions"></div>`).append(new_function_check, discard_btn, adopt_btn);
    panel_action.append(discard_btn);
    panel_body.append(panel_action);

    var submit_funcdesc_input = panel_body.find('.submit-funcdesc-input');
    var submit_funcid_input = panel_body.find('.submit-funcid-input');
    var submit_funcdesc;
    var submit_funcid;
    new_function_check.find('input').on('change', (event) => {
        submit_funcdesc_input.prop('disabled', !event.target.checked);
        submit_funcid_input.prop('disabled', !event.target.checked);

        if (!event.target.checked) {
            var checked_lan_code = language_form.find('input[name=language-ratio-group]:checked').val();
            pop_function_choice_dialog(
                checked_lan_code,
                (target) => {
                    submit_funcid = submit_funcid_input.val();
                    submit_funcdesc = submit_funcdesc_input.val();
                    submit_funcid_input.val(target.attr('function-id'));
                    submit_funcdesc_input.val(target.text());
                },
                () => {
                    $(event.target).prop('checked', true);
                    panel_body.find('.submit-funcdesc-input').prop('disabled', false);
                    panel_body.find('.submit-funcid-input').prop('disabled', false);
                });
        } else {
            submit_funcdesc_input.val(submit_funcdesc);
            submit_funcid_input.val(submit_funcid);
        }
    })

    discard_btn.on('click', () => {
        window.ipcRenderer.invoke('delete-user-submit', func_desc, create_time).then(() => {
            panel.remove();
            mdui.snackbar('Deleted user submission from database.');
        })
    })

    return panel;
}

function gen_tool_panel(tool_name, tool_desc, tool_url, tool_icon, tool_tags) {
    var panel = $(`
        <div class="mdui-panel-item">
            <div class="mdui-panel-item-header">
                <div class="mdui-panel-item-title tool-name">${tool_name}</div>
                <div class="mdui-panel-item-summary tool-desc">${tool_desc}</div>
                <i class="mdui-panel-item-arrow mdui-icon material-icons">keyboard_arrow_down</i>
            </div>
        </div>
    `);

    var panel_body = $(`
        <div class="mdui-panel-item-body prompt-panel-body">
            <div class="mdui-row">
                <div class="mdui-col-xs-6">
                    <input class="mdui-textfield-input tool-name-input" type="text" value="${tool_name}" placeholder="name"/>
                </div>
                <div class="mdui-col-xs-6">
                    <input class="mdui-textfield-input tool-icon-input" type="text" value="${tool_icon}" placeholder="icon"/>
                </div>
            </div>
            <div class="mdui-row">
                <div class="mdui-col-xs-12">
                    <input class="mdui-textfield-input tool-url-input" type="text" value="${tool_url}" placeholder="URL"/>
                </div>
            </div>
            <div class="mdui-row">
                <div class="mdui-col-xs-12">
                    <textarea class="mdui-textfield-input tool-desc-input" wrap="soft" rows=3 type="text" placeholder="Description">${tool_desc}</textarea>
                </div>
            </div>
            <div class="mdui-row">
                <div class="mdui-col-xs-12">
                    <input class="mdui-textfield-input tool-tags-input" type="text" value="${tool_tags}" placeholder="Tags"/>
                </div>
            </div>
        </div>
    `);
    panel.append(panel_body);

    panel_body.find('.tool-name-input').on('input', (event) => {
        panel.find('.tool-name').text($(event.target).val());
    });
    panel_body.find('.tool-desc-input').on('input', (event) => {
        panel.find('.tool-desc').text($(event.target).val());
    });

    var tool_delete_btn = $(`<button class="mdui-btn mdui-ripple function-delete-btn mdui-text-color-red">Delete</button>`);
    var panel_action = $(`<div class="mdui-panel-item-actions"></div>`).append(tool_delete_btn);
    panel_body.append(panel_action);

    tool_delete_btn.on('click', () => {
        panel.remove();
    })

    return panel;
}