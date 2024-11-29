var csInterface = new CSInterface();

function init() {
    console.log("Initializing extension...");

    try {
        // Register event listeners
        var createSrcBtn = document.getElementById('createSrcBtn');
        var convertBtn = document.getElementById('convertBtn');
        var syncBtn = document.getElementById('syncBtn');

        if (createSrcBtn) {
            createSrcBtn.addEventListener('click', function() {
                console.log("Create src button clicked");
                createSrcFolder();
            });
        } else {
            console.error("CreateSrcBtn not found");
        }

        if (convertBtn) {
            convertBtn.addEventListener('click', function() {
                console.log("Convert button clicked");
                convertToRelativePath();
            });
        } else {
            console.error("ConvertBtn not found");
        }

        if (syncBtn) {
            syncBtn.addEventListener('click', function() {
                console.log("Sync button clicked");
                syncSrcFolder();
            });
        } else {
            console.error("SyncBtn not found");
        }

        // Start monitoring
        initProjectMonitoring();
        monitorSelection();

        console.log("Initialization complete");
    } catch(e) {
        console.error("Initialization error:", e);
    }
}

// Delay function
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Manage button loading state
function setButtonLoading(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    if (!button) {
        console.error("Button with id " + buttonId + " not found");
        return;
    }
    const spinner = button.querySelector('.loading-spinner');
    if (!spinner) {
        console.error("Spinner element not found in button " + buttonId);
        return;
    }
    button.disabled = isLoading;
    if (isLoading) {
        spinner.classList.remove('hidden');
    } else {
        spinner.classList.add('hidden');
    }
}

// Notification timer
let notificationTimer = null;

// Show notification
function showNotification(message, type) {
    const notification = document.getElementById('notification');
    const overlay = document.getElementById('notificationOverlay');

    if (!notification || !overlay) {
        console.error("Notification elements not found");
        return;
    }

    // Clear any existing timer
    if (notificationTimer) {
        clearTimeout(notificationTimer);
        notification.classList.remove('show');
        overlay.classList.remove('show');
        notificationTimer = null;
    }

    const iconSVG = type === 'success'
        ? '<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>'
        : '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>';

    notification.innerHTML = `
        <div class="icon">${iconSVG}</div>
        <div class="message">${message}</div>
    `;

    notification.className = `notification ${type}`;
    overlay.classList.add('show');

    // Force reflow
    notification.offsetHeight;

    notification.classList.add('show');

    // Set timer to hide notification
    notificationTimer = setTimeout(() => {
        notification.classList.remove('show');
        overlay.classList.remove('show');
        notificationTimer = null;
    }, 780); // Duration
}

function setFileListLoading(isLoading) {
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay) {
        console.error("Loading overlay not found");
        return;
    }
    if (isLoading) {
        overlay.classList.add('show');
    } else {
        overlay.classList.remove('show');
    }
}

// Convert to relative path
async function convertToRelativePath() {
    try {
        setButtonLoading('convertBtn', true);
        setFileListLoading(true);
        await delay(100);

        csInterface.evalScript(`
            (function() {
                try {
                    if (!app.project || !app.project.file) {
                        return JSON.stringify({error: 'NO_PROJECT'});
                    }

                    var projectPath = app.project.file.parent.fsName;
                    var orbitoolsPath = projectPath + '/orbitools';
                    var srcPath = orbitoolsPath + '/src';

                    // Get selected item
                    var activeItem = app.project.activeItem;
                    if (!activeItem || !(activeItem instanceof FootageItem)) {
                        return JSON.stringify({error: 'NO_VALID_ITEM'});
                    }

                    // Check for source file
                    if (!activeItem.mainSource || !activeItem.mainSource.file) {
                        return JSON.stringify({error: 'NO_SOURCE_FILE'});
                    }

                    var sourceFile = activeItem.mainSource.file;
                    var fileName = sourceFile.name;
                    var srcFile = new File(srcPath + '/' + fileName);

                    // Check if file is already in src folder
                    if (sourceFile.fsName.indexOf(srcPath) === 0) {
                        return JSON.stringify({
                            error: 'ALREADY_IN_SRC'
                        });
                    }

                    // Ensure src folder exists
                    var srcFolder = new Folder(srcPath);
                    if (!srcFolder.exists) {
                        if (!srcFolder.create()) {
                            return JSON.stringify({error: 'FAILED_TO_CREATE_SRC'});
                        }
                    }

                    // Copy file to src folder
                    if (!sourceFile.copy(srcFile.fsName)) {
                        return JSON.stringify({error: 'COPY_FAILED'});
                    }

                    // Replace the source with the copied file
                    activeItem.replace(srcFile);

                    return JSON.stringify({
                        success: true,
                        newPath: srcFile.fsName
                    });

                } catch(e) {
                    return JSON.stringify({
                        error: 'SCRIPT_ERROR',
                        message: e.toString()
                    });
                }
            })()
        `, function(result) {
            setButtonLoading('convertBtn', false);
            setFileListLoading(false);

            try {
                const response = JSON.parse(result);

                if (response.error) {
                    switch(response.error) {
                        case 'NO_PROJECT':
                            showNotification('Project is not saved', 'error');
                            break;
                        case 'NO_VALID_ITEM':
                            showNotification('No valid item selected', 'error');
                            break;
                        case 'NO_SOURCE_FILE':
                            showNotification('No source file', 'error');
                            break;
                        case 'ALREADY_IN_SRC':
                            showNotification('File is already in src folder', 'error');
                            break;
                        case 'COPY_FAILED':
                            showNotification('Failed to copy file', 'error');
                            break;
                        case 'FAILED_TO_CREATE_SRC':
                            showNotification('Failed to create src folder', 'error');
                            break;
                        default:
                            showNotification('Error: ' + response.message, 'error');
                    }
                } else if (response.success) {
                    showNotification('Path conversion completed', 'success');
                    setTimeout(() => {
                        updateSelectedItem();
                        checkProjectStatus();
                    }, 100);
                }
            } catch(e) {
                console.error('Error processing result:', e);
                showNotification('Error occurred while processing result', 'error');
            }
        });
    } catch(e) {
        setButtonLoading('convertBtn', false);
        setFileListLoading(false);
        console.error('Conversion error:', e);
        showNotification('Error occurred during conversion', 'error');
    }
}

// Sync src folder
async function syncSrcFolder() {
    setButtonLoading('syncBtn', true);
    setFileListLoading(true);

    csInterface.evalScript(`
        (function() {
            try {
                if (!app.project || !app.project.file) {
                    return JSON.stringify({error: 'NO_PROJECT'});
                }

                var projectPath = app.project.file.parent.fsName;
                var srcPath = projectPath + '/orbitools/src';
                var srcFolder = new Folder(srcPath);

                if (!srcFolder.exists) {
                    return JSON.stringify({error: 'NO_SRC_FOLDER'});
                }

                var files = srcFolder.getFiles();
                var importedCount = 0;

                for (var i = 0; i < files.length; i++) {
                    var file = files[i];
                    if (file instanceof File) {
                        try {
                            var importFile = new File(file.fsName);
                            if (importFile.exists) {
                                app.project.importFile(new ImportOptions(importFile));
                                importedCount++;
                            }
                        } catch(importError) {
                            // Skip files that fail to import
                            continue;
                        }
                    }
                }

                return JSON.stringify({
                    success: true,
                    count: importedCount
                });

            } catch(e) {
                return JSON.stringify({
                    error: 'SCRIPT_ERROR',
                    message: e.toString()
                });
            }
        })()
    `, function(result) {
        setButtonLoading('syncBtn', false);
        setFileListLoading(false);

        try {
            const response = JSON.parse(result);
            if (response.error) {
                switch(response.error) {
                    case 'NO_PROJECT':
                        showNotification('Project is not saved', 'error');
                        break;
                    case 'NO_SRC_FOLDER':
                        showNotification('src folder does not exist', 'error');
                        break;
                    default:
                        showNotification('Error: ' + response.message, 'error');
                }
            } else if (response.success) {
                showNotification(response.count + ' files synchronized', 'success');
                setTimeout(checkProjectStatus, 100);
            }
        } catch(e) {
            console.error('Sync error:', e);
            showNotification('Error occurred during sync', 'error');
        }
    });
}

// Check project status
function checkProjectStatus() {
    csInterface.evalScript(`
        (function() {
            try {
                if (typeof app === 'undefined' || !app.project) {
                    return JSON.stringify({
                        status: 'NO_PROJECT',
                        message: 'Project is not open'
                    });
                }

                if (!app.project.file) {
                    return JSON.stringify({
                        status: 'UNSAVED',
                        message: 'Project is not saved'
                    });
                }

                var projectPath = app.project.file.parent.fsName;
                var orbitoolsPath = projectPath + '/orbitools';
                var srcPath = orbitoolsPath + '/src';

                var orbitoolsFolder = new Folder(orbitoolsPath);
                var srcFolder = new Folder(srcPath);

                var folderStatus = {
                    orbitools: orbitoolsFolder.exists,
                    src: srcFolder.exists
                };

                // Function to check if all footage items are in src folder
                function checkAllFootageItems(folder) {
                    var allSynced = true;

                    for (var i = 1; i <= folder.numItems; i++) {
                        var item = folder.item(i);

                        if (item instanceof FolderItem) {
                            if (!checkAllFootageItems(item)) {
                                allSynced = false;
                            }
                        } else if (item instanceof FootageItem && item.mainSource && item.mainSource.file) {
                            var filePath = item.mainSource.file.fsName;
                            if (filePath.indexOf(srcPath) !== 0) {
                                allSynced = false;
                                break;
                            }
                        }
                    }

                    return allSynced;
                }

                var isSynced = checkAllFootageItems(app.project.rootFolder);

                return JSON.stringify({
                    status: 'OK',
                    projectName: app.project.file.name,
                    projectPath: projectPath,
                    hasOrbitools: folderStatus.orbitools,
                    hasSrc: folderStatus.src,
                    isSynced: isSynced
                });
            } catch(e) {
                return JSON.stringify({
                    status: 'ERROR',
                    message: e.toString()
                });
            }
        })()
    `, function(result) {
        console.log("Status check result:", result);

        try {
            const status = JSON.parse(result);
            const statusElement = document.getElementById('projectStatus');
            const indicator = document.getElementById('srcStatus');

            if (!statusElement || !indicator) {
                console.error("Status elements not found");
                return;
            }

            if (status.status === 'OK') {
                statusElement.textContent = status.projectName;
                indicator.className = 'status-indicator ' +
                    (status.hasSrc && status.isSynced ? 'active' : 'inactive');
            } else {
                statusElement.textContent = status.message;
                indicator.className = 'status-indicator inactive';
            }
        } catch(e) {
            console.error("Error parsing project status:", e);
            const statusElement = document.getElementById('projectStatus');
            const indicator = document.getElementById('srcStatus');
            if (statusElement && indicator) {
                statusElement.textContent = 'Error';
                indicator.className = 'status-indicator inactive';
            }
        }
    });
}

// Update selected item info
function updateSelectedItem() {
    csInterface.evalScript(`
        (function() {
            try {
                if (typeof app === 'undefined' || !app.project) {
                    return JSON.stringify({error: 'NO_PROJECT'});
                }

                var selectedItems = app.project.selection;
                if (!selectedItems || selectedItems.length === 0) {
                    return JSON.stringify({error: 'NO_SELECTION'});
                }

                var item = selectedItems[0];
                var info = {
                    name: item.name || '',
                    type: 'unknown'
                };

                if (item instanceof FootageItem) {
                    info.type = 'footage';
                    if (item.mainSource) {
                        if (item.mainSource.file) {
                            info.path = item.mainSource.file.fsName;
                            info.format = item.mainSource.file.name.split('.').pop();
                        }
                        info.width = item.width || null;
                        info.height = item.height || null;
                    }
                } else if (item instanceof CompItem) {
                    info.type = 'composition';
                    info.width = item.width || null;
                    info.height = item.height || null;
                    info.duration = item.duration ? item.duration.toFixed(2) : null;
                    info.frameRate = item.frameRate ? item.frameRate.toFixed(2) : null;
                }

                return JSON.stringify(info);
            } catch(e) {
                return JSON.stringify({
                    error: e.toString()
                });
            }
        })()
    `, function(result) {
        try {
            const info = JSON.parse(result);
            updateSelectedItemUI(info);
        } catch(e) {
            console.error("Error updating selection:", e);
            updateSelectedItemUI({error: 'PARSE_ERROR'});
        }
    });
}

// Update UI with selected item info
function updateSelectedItemUI(info) {
    const selectedItem = document.getElementById('selectedItem');

    if (!selectedItem) {
        console.error("Selected item element not found");
        return;
    }

    if (info.error) {
        selectedItem.innerHTML = `<div class="no-selection">No item selected</div>`;
        return;
    }

    let html = `
        <div class="item-info">
            <div class="item-name">${info.name}</div>
            <div class="item-specs">
    `;

    if (info.type) {
        html += `<div class="spec-item">Type: <span>${info.type}</span></div>`;
    }
    if (info.width && info.height) {
        html += `<div class="spec-item">Size: <span>${info.width}x${info.height}px</span></div>`;
    }
    if (info.duration) {
        html += `<div class="spec-item">Duration: <span>${info.duration}s</span></div>`;
    }
    if (info.frameRate) {
        html += `<div class="spec-item">FPS: <span>${info.frameRate}</span></div>`;
    }
    if (info.format) {
        html += `<div class="spec-item">Format: <span>${info.format}</span></div>`;
    }

    html += `
            </div>
            ${info.path ? `
            <div class="path-info">
                <div class="current-path">
                    <span class="path-label">Path:</span>
                    <span>${info.path}</span>
                </div>
            </div>
            ` : ''}
        </div>
    `;

    selectedItem.innerHTML = html;
}

// Monitor selection changes
function monitorSelection() {
    console.log("Starting selection monitoring...");

    csInterface.addEventListener('com.adobe.csxs.events.SelectionChanged', function() {
        console.log("Selection changed event received");
        updateSelectedItem();
    });

    // As a backup, check selection periodically
    setInterval(updateSelectedItem, 1000);

    // Initial update
    updateSelectedItem();
}

// Create src folder
function createSrcFolder() {
    csInterface.evalScript(`
        (function() {
            try {
                if (!app.project.file) return JSON.stringify({error: 'NO_PROJECT'});

                var projectPath = app.project.file.parent.fsName;
                var orbitoolsPath = projectPath + '/orbitools';
                var srcPath = orbitoolsPath + '/src';

                var orbitoolsFolder = new Folder(orbitoolsPath);
                var srcFolder = new Folder(srcPath);

                // Create orbitools folder if it doesn't exist
                if (!orbitoolsFolder.exists) {
                    if (!orbitoolsFolder.create()) {
                        return JSON.stringify({error: 'FAILED_TO_CREATE_ORBITOOLS'});
                    }
                }

                // Create src folder if it doesn't exist
                if (!srcFolder.exists) {
                    if (!srcFolder.create()) {
                        return JSON.stringify({error: 'FAILED_TO_CREATE_SRC'});
                    }
                }

                return JSON.stringify({
                    success: true,
                    path: srcPath,
                    orbitoolsExists: orbitoolsFolder.exists,
                    srcExists: srcFolder.exists
                });
            } catch(e) {
                return JSON.stringify({error: e.toString()});
            }
        })()
    `, function(result) {
        try {
            const response = JSON.parse(result);
            if (response.error) {
                switch(response.error) {
                    case 'NO_PROJECT':
                        showNotification('Project is not saved', 'error');
                        break;
                    case 'FAILED_TO_CREATE_ORBITOOLS':
                        showNotification('Failed to create orbitools folder', 'error');
                        break;
                    case 'FAILED_TO_CREATE_SRC':
                        showNotification('Failed to create src folder', 'error');
                        break;
                    default:
                        showNotification('Error: ' + response.error, 'error');
                }
            } else {
                if (response.success && response.srcExists) {
                    showNotification('Folders created successfully', 'success');
                    // Update status after a slight delay
                    setTimeout(() => {
                        checkProjectStatus();
                    }, 100);
                } else {
                    showNotification('Failed to verify folder creation status', 'error');
                }
            }
        } catch(e) {
            console.error('Error creating folders:', e);
            showNotification('Error occurred while creating folders', 'error');
        }
    });
}

// Initialize project monitoring
function initProjectMonitoring() {
    console.log("Initializing project monitoring...");

    // Periodic status check as backup
    setInterval(checkProjectStatus, 2000);

    // Initial status check
    checkProjectStatus();
}

init();
