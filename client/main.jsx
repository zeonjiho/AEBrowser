var csInterface = null;

function initializeCSInterface() {
    try {
        if (csInterface !== null && csInterface.hostEnvironment) {
            return true;
        }

        if (typeof CSInterface === 'undefined') {
            console.error('CSInterface is not loaded yet');
            return false;
        }

        csInterface = new CSInterface();
        
        if (!csInterface.hostEnvironment) {
            console.error('Host environment not available');
            csInterface = null;
            return false;
        }

        csInterface.evalScript('app.version', function(result) {
            console.log('AE Version:', result || 'Not available');
        });

        console.log('CSInterface initialized successfully');
        return true;
    } catch(e) {
        console.error('CSInterface initialization failed:', e);
        csInterface = null;
        return false;
    }
}

window.addEventListener('load', function() {
    console.log('Window loaded');
    setTimeout(function() {
        if (initializeCSInterface()) {
            console.log('CSInterface initialized successfully');
            init();
        } else {
            console.error('Failed to initialize CSInterface');
        }
    }, 100);
});

function init() {
    console.log("Initializing extension...");

    try {
        // Register event listeners
        var createSrcBtn = document.getElementById('createSrcBtn');
        var convertBtn = document.getElementById('convertBtn');
        var syncBtn = document.getElementById('syncBtn');
        var openOrbitBtn = document.getElementById('openOrbitBtn');

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

        if (openOrbitBtn) {
            openOrbitBtn.addEventListener('click', function() {
                console.log("Open orbit button clicked");
                openOrbitFolder();
            });
        } else {
            console.error("OpenOrbitBtn not found");
        }

        // Start monitoring
        initProjectMonitoring();
        monitorSelection();

        console.log("Initialization complete");
    } catch(e) {
        console.error("Initialization error:", e);
    }

    // 디버그 버튼 이벤트 리스너 추가
    var debugBtn = document.getElementById('debugBtn');
    if (debugBtn) {
        debugBtn.addEventListener('click', function() {
            collectDebugInfo();
        });
    }
}

// Delay function - Promise 대신 콜백 기반으로 수정
function delay(ms, callback) {
    setTimeout(callback, ms);
}

// Manage button loading state
function setButtonLoading(buttonId, isLoading) {
    try {
        console.log("setButtonLoading called with:", buttonId, isLoading);
        const button = document.getElementById(buttonId);
        if (!button) {
            console.error("Button with id " + buttonId + " not found");
            return;
        }
        
        // 버튼 상태 업데이트
        button.disabled = isLoading;
        button.classList.toggle('loading', isLoading);
        
        // spinner 요소 찾기
        const spinner = button.querySelector('.loading-spinner');
        const textSpan = button.querySelector('.button-text');
        
        if (spinner && textSpan) {
            if (isLoading) {
                spinner.classList.remove('hidden');
                textSpan.style.opacity = '0.7';
            } else {
                spinner.classList.add('hidden');
                textSpan.style.opacity = '1';
            }
        }
    } catch(e) {
        console.error("Error in setButtonLoading:", e);
    }
}

// Notification timer 및 관련 상태 관리
const notificationState = {
    timer: null,
    isShowing: false
};

// Show notification
function showNotification(message, type) {
    const notification = document.getElementById('notification');
    const overlay = document.getElementById('notificationOverlay');

    if (!notification || !overlay) {
        console.error("Notification elements not found");
        return;
    }

    // Clear any existing timer
    if (notificationState.timer) {
        clearTimeout(notificationState.timer);
        notification.classList.remove('show');
        overlay.classList.remove('show');
        notificationState.timer = null;
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
    notificationState.isShowing = true;

    // Set timer to hide notification
    notificationState.timer = setTimeout(() => {
        notification.classList.remove('show');
        overlay.classList.remove('show');
        notificationState.timer = null;
        notificationState.isShowing = false;
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
function convertToRelativePath() {
    try {
        setButtonLoading('convertBtn', true);
        setFileListLoading(true);
        
        delay(100, function() {
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
                            return JSON.stringify({error: 'ALREADY_IN_SRC'});
                        }

                        // Create src folder if it doesn't exist
                        var srcFolder = new Folder(srcPath);
                        if (!srcFolder.exists) {
                            if (!srcFolder.create()) {
                                return JSON.stringify({error: 'FAILED_TO_CREATE_SRC'});
                            }
                        }

                        // Copy file to src folder
                        if (!sourceFile.copy(srcFile.fsName)) {
                            return JSON.stringify({error: 'FAILED_TO_COPY'});
                        }

                        // Update footage path
                        activeItem.replace(srcFile);
                        
                        return JSON.stringify({
                            success: true,
                            oldPath: sourceFile.fsName,
                            newPath: srcFile.fsName
                        });
                    } catch(e) {
                        $.writeln("Error: " + e.toString());  // 로그 추가
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
                    console.log("Received result:", result);  // 디버깅용 로그
                    const response = JSON.parse(result);
                    
                    if (response.error) {
                        switch(response.error) {
                            case 'NO_PROJECT':
                                showNotification('The project is not saved.', 'error');
                                break;
                            case 'NO_VALID_ITEM':
                                showNotification('No valid item selected', 'error');
                                break;
                            case 'NO_SOURCE_FILE':
                                showNotification('No source file', 'error');
                                break;
                            case 'ALREADY_IN_SRC':
                                showNotification('Already in src folder', 'error');
                                break;
                            case 'FAILED_TO_CREATE_SRC':
                                showNotification('Failed to create src folder', 'error');
                                break;
                            case 'FAILED_TO_COPY':
                                showNotification('Failed to copy file', 'error');
                                break;
                            case 'SCRIPT_ERROR':
                                showNotification('Script error: ' + response.message, 'error');
                                break;
                            default:
                                showNotification('Error: ' + response.error, 'error');
                        }
                    } else if (response.success) {  // success 체크 추가
                        showNotification('Path converted successfully', 'success');
                        setTimeout(() => {
                            checkProjectStatus();
                        }, 100);
                    }
                } catch(e) {
                    console.error('Path conversion error:', e, 'Result:', result);
                    showNotification('An error occurred during path conversion', 'error');
                }
            });
        });
    } catch(e) {
        setButtonLoading('convertBtn', false);
        setFileListLoading(false);
        console.error('Conversion error:', e);
        showNotification('An error occurred during conversion', 'error');
    }
}

// 프로그레스바 업데이트 함수 추가
function updateProgress(progress, text) {
    const overlay = document.getElementById('loadingOverlay');
    const progressBar = document.getElementById('progressBarFill');
    const progressText = document.getElementById('progressText');
    
    overlay.classList.add('with-progress');
    progressBar.style.width = `${progress}%`;
    if (text) {
        progressText.textContent = text;
    }
}

// syncSrcFolder 함수 내부의 processFolder 함수 수정
function processFolder(folder, projectFolder) {
    var files = folder.getFiles();
    var totalFiles = files.length;
    var processedFiles = 0;
    
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        processedFiles++;
        var progress = (processedFiles / totalFiles) * 100;
        
        updateProgress(progress, '파일 처리 중... (' + processedFiles + '/' + totalFiles + ')');
        
        if (file instanceof Folder) {
            var subFolder = findOrCreateFolder(file.name, projectFolder);
            processFolder(file, subFolder);
        } else if (file instanceof File) {
            // 시퀀스 처리 시도
            if (!processSequence(file, projectFolder)) {
                // 일반 파일 처리
                try {
                    var filePath = file.fsName;
                    var existingItem = findProjectItemByPath(filePath);
                    
                    if (existingItem) {
                        if (existingItem.parentFolder !== projectFolder) {
                            existingItem.parentFolder = projectFolder;
                            movedCount++;
                        }
                        skippedCount++;
                        continue;
                    }

                    var importFile = new File(filePath);
                    if (importFile.exists) {
                        var importOptions = new ImportOptions(importFile);
                        var importedItem = app.project.importFile(importOptions);
                        importedItem.parentFolder = projectFolder;
                        importedItem.comment = "synced_file:" + (new Date()).getTime();
                        importedCount++;
                    }
                } catch(importError) {
                    failedCount++;
                }
            }
        }
    }
}

// 작업 완료 시 프로그레스바 초기화
function resetProgress() {
    const overlay = document.getElementById('loadingOverlay');
    const progressBar = document.getElementById('progressBarFill');
    const progressText = document.getElementById('progressText');
    
    overlay.classList.remove('with-progress');
    progressBar.style.width = '0%';
    progressText.textContent = 'work in progress...';
}

// Sync src folder
function syncSrcFolder() {
    setButtonLoading('syncBtn', true);
    setFileListLoading(true);
    
    const script = `
        try {
            if (!app.project || !app.project.file) {
                '{"error": "NO_PROJECT"}';
            } else {
                var projectPath = app.project.file.parent.fsName;
                var srcPath = projectPath + '/orbitools/src';
                var srcFolder = new Folder(srcPath);

                if (!srcFolder.exists) {
                    '{"error": "NO_SRC_FOLDER"}';
                } else {
                    var importedCount = 0;
                    var skippedCount = 0;
                    var failedCount = 0;
                    var movedCount = 0;
                    var sequenceCount = 0;

                    // 파일명에서 시퀀스 번호를 추출하는 함수
                    function getSequenceInfo(filename) {
                        var match = filename.match(/(.*?)(\\d+)([^\\d]*?)$/);
                        if (match) {
                            return {
                                baseName: match[1],
                                number: match[2],
                                extension: match[3],
                                isSequence: true
                            };
                        }
                        return {
                            baseName: filename,
                            isSequence: false
                        };
                    }

                    // 폴더 찾기 또는 생성
                    function findOrCreateFolder(folderName, parentFolder) {
                        for (var i = 1; i <= parentFolder.numItems; i++) {
                            var item = item(i);
                            if (item instanceof FolderItem && item.name === folderName) {
                                return item;
                            }
                        }
                        var newFolder = app.project.items.addFolder(folderName);
                        newFolder.parentFolder = parentFolder;
                        return newFolder;
                    }

                    // 시퀀스 파일들을 처리하는 함수
                    function processSequence(file, projectFolder) {
                        var sequenceInfo = getSequenceInfo(file.name);
                        if (!sequenceInfo.isSequence) return false;

                        var sequenceFolderName = sequenceInfo.baseName.replace(/[\\s._-]+$/, '');
                        var sequencePath = srcPath + '/' + sequenceFolderName;
                        var sequenceFolder = new Folder(sequencePath);

                        if (!sequenceFolder.exists) {
                            sequenceFolder.create();
                        }

                        // 같은 시퀀스의 모든 파일 찾기
                        var sourceFolder = file.parent;
                        var allFiles = sourceFolder.getFiles();
                        var sequencePattern = new RegExp(
                            '^' + 
                            sequenceInfo.baseName.replace(/([.?*+^$[\\]\\\\(){}|-])/g, "\\\\$1") + 
                            '\\\\d+' + 
                            sequenceInfo.extension.replace(/([.?*+^$[\\]\\\\(){}|-])/g, "\\\\$1") + 
                            '$'
                        );

                        var sequenceFiles = [];
                        for (var i = 0; i < allFiles.length; i++) {
                            if (sequencePattern.test(allFiles[i].name)) {
                                sequenceFiles.push(allFiles[i]);
                            }
                        }

                        // 각 시퀀스 파일 복사
                        for (var j = 0; j < sequenceFiles.length; j++) {
                            var targetPath = sequencePath + '/' + sequenceFiles[j].name;
                            if (!(new File(targetPath)).exists) {
                                sequenceFiles[j].copy(targetPath);
                                importedCount++;
                            } else {
                                skippedCount++;
                            }
                        }

                        // 프로젝트에 시퀀스 임포트
                        var importFile = new File(sequencePath + '/' + file.name);
                        if (importFile.exists) {
                            var importOptions = new ImportOptions(importFile);
                            importOptions.sequence = true; // 시퀀스로 임포트
                            var importedItem = app.project.importFile(importOptions);
                            importedItem.parentFolder = projectFolder;
                            importedItem.comment = "synced_sequence:" + (new Date()).getTime();
                            sequenceCount++;
                        }

                        return true;
                    }

                    // 기본 폴더 구조 생성
                    var orbitoolsFolder = findOrCreateFolder('orbitools', app.project.rootFolder);
                    var srcProjectFolder = findOrCreateFolder('src', orbitoolsFolder);

                    function processFolder(folder, projectFolder) {
                        var files = folder.getFiles();
                        var totalFiles = files.length;
                        var processedFiles = 0;
                        
                        for (var i = 0; i < files.length; i++) {
                            var file = files[i];
                            processedFiles++;
                            var progress = (processedFiles / totalFiles) * 100;
                            
                            updateProgress(progress, '파일 처리 중... (' + processedFiles + '/' + totalFiles + ')');
                            
                            if (file instanceof Folder) {
                                var subFolder = findOrCreateFolder(file.name, projectFolder);
                                processFolder(file, subFolder);
                            } else if (file instanceof File) {
                                // 시퀀스 처리 시도
                                if (!processSequence(file, projectFolder)) {
                                    // 일반 파일 처리
                                    try {
                                        var filePath = file.fsName;
                                        var existingItem = findProjectItemByPath(filePath);
                                        
                                        if (existingItem) {
                                            if (existingItem.parentFolder !== projectFolder) {
                                                existingItem.parentFolder = projectFolder;
                                                movedCount++;
                                            }
                                            skippedCount++;
                                            continue;
                                        }

                                        var importFile = new File(filePath);
                                        if (importFile.exists) {
                                            var importOptions = new ImportOptions(importFile);
                                            var importedItem = app.project.importFile(importOptions);
                                            importedItem.parentFolder = projectFolder;
                                            importedItem.comment = "synced_file:" + (new Date()).getTime();
                                            importedCount++;
                                        }
                                    } catch(importError) {
                                        failedCount++;
                                    }
                                }
                            }
                        }
                    }

                    // 전체 폴더 구조 처리 시작
                    processFolder(srcFolder, srcProjectFolder);

                    '{"success": true, "imported": ' + importedCount + 
                    ', "skipped": ' + skippedCount + 
                    ', "moved": ' + movedCount +
                    ', "failed": ' + failedCount +
                    ', "sequences": ' + sequenceCount + '}';
                }
            }
        } catch(e) {
            '{"error": "SCRIPT_ERROR", "message": "' + e.toString().replace(/"/g, '\\"') + '"}';
        }
    `;

    csInterface.evalScript(script, function(result) {
        setButtonLoading('syncBtn', false);
        setFileListLoading(false);
        resetProgress();
        
        try {
            const response = JSON.parse(result);
            if (response.error) {
                switch(response.error) {
                    case 'NO_PROJECT':
                        showNotification('프로젝트가 저장되지 않았습니다.', 'error');
                        break;
                    case 'NO_SRC_FOLDER':
                        showNotification('src 폴더가 존재하지 않습니다', 'error');
                        break;
                    default:
                        showNotification('에러: ' + response.message, 'error');
                }
            } else if (response.success) {
                const message = `${response.imported}개 파일 동기화 완료` + 
                              (response.sequences > 0 ? ` (${response.sequences}개 시퀀스)` : '') +
                              (response.skipped > 0 ? ` (${response.skipped}개 스킵)` : '') +
                              (response.moved > 0 ? ` (${response.moved}개 이동됨)` : '') +
                              (response.failed > 0 ? ` (${response.failed}개 실패)` : '');
                showNotification(message, response.failed > 0 ? 'warning' : 'success');
                setTimeout(checkProjectStatus, 100);
            }
        } catch(e) {
            console.error('Sync error:', e);
            showNotification('동기화 중 오류가 발생했습니다', 'error');
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
    const script = `
        try {
            if (!app.project || !app.project.file) {
                '{"error": "NO_PROJECT"}';
            } else {
                var projectPath = app.project.file.parent.fsName;
                var orbitoolsPath = projectPath + '/orbitools';
                var srcPath = orbitoolsPath + '/src';
                
                var orbitoolsFolder = new Folder(orbitoolsPath);
                var srcFolder = new Folder(srcPath);
                
                if (!orbitoolsFolder.exists) {
                    if (!orbitoolsFolder.create()) {
                        '{"error": "FAILED_TO_CREATE_ORBITOOLS"}';
                    }
                }
                
                if (!srcFolder.exists) {
                    if (!srcFolder.create()) {
                        '{"error": "FAILED_TO_CREATE_SRC"}';
                    }
                }
                
                '{"success": true, "srcExists": ' + srcFolder.exists + '}';
            }
        } catch(e) {
            '{"error": "SCRIPT_ERROR", "message": "' + e.toString().replace(/"/g, '\\"') + '"}';
        }
    `;
    
    csInterface.evalScript(script, function(result) {
        try {
            const response = JSON.parse(result);
            if (response.error) {
                switch(response.error) {
                    case 'NO_PROJECT':
                        showNotification('The project is not saved.', 'error');
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
                    showNotification('Folder created successfully', 'success');
                    setTimeout(() => {
                        checkProjectStatus();
                    }, 100);
                } else {
                    showNotification('Folder creation failed', 'error');
                }
            }
        } catch(e) {
            console.error('Folder creation error:', e);
            showNotification('An error occurred during folder creation', 'error');
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

// 버버그 정보 수집 및 표시 함수
function collectDebugInfo() {
    setButtonLoading('debugBtn', true);

    csInterface.evalScript(`
        (function() {
            // 즉시 로그 출력 테스트
            $.writeln("=== Debug Information ===");
            alert("Debug: Function Started");

            try {
                // 프로젝트 체크
                if (!app.project) {
                    $.writeln("No project found");
                    alert("Debug: No project found");
                    return JSON.stringify({error: 'NO_PROJECT'});
                }

                if (!app.project.file) {
                    $.writeln("Project not saved");
                    alert("Debug: Project not saved");
                    return JSON.stringify({error: 'NO_PROJECT'});
                }

                // 프로젝트 경로 확인
                var projectPath = app.project.file.parent.fsName;
                $.writeln("Project Path: " + projectPath);
                alert("Debug: Project Path: " + projectPath);

                // 아이템 수 확인
                $.writeln("Number of items: " + app.project.numItems);
                alert("Debug: Number of items: " + app.project.numItems);

                var debugInfo = {
                    project: {
                        exists: !!app.project,
                        saved: !!app.project.file,
                        path: projectPath,
                        items: app.project.numItems
                    },
                    items: []
                };

                // 각 아이템 정보 출력
                for (var i = 1; i <= app.project.numItems; i++) {
                    var item = app.project.item(i);
                    $.writeln("Item " + i + " type: " + item.typeName);
                    
                    if (item instanceof FootageItem) {
                        $.writeln("FootageItem found: " + item.name);
                        var itemInfo = {
                            index: i,
                            name: item.name,
                            type: item.typeName
                        };

                        if (item.file) {
                            $.writeln("File path: " + item.file.fsName);
                            itemInfo.filePath = item.file.fsName;
                            itemInfo.fileExists = item.file.exists;
                        } else {
                            $.writeln("No file associated");
                            itemInfo.filePath = "No file associated";
                        }
                        
                        debugInfo.items.push(itemInfo);
                    }
                }

                return JSON.stringify(debugInfo, null, 2);

            } catch(e) {
                $.writeln("Error occurred: " + e.toString());
                alert("Debug Error: " + e.toString());
                return JSON.stringify({
                    error: 'SCRIPT_ERROR',
                    message: e.toString()
                });
            }
        })()
    `, function(result) {
        setButtonLoading('debugBtn', false);
        console.log("ExtendScript Result:", result);
        
        try {
            const debugInfo = JSON.parse(result);
            const debugElement = document.getElementById('debugInfo');
            
            if (debugInfo.error) {
                showNotification('Error: ' + debugInfo.message, 'error');
                debugElement.innerHTML = `<div class="error">Error: ${debugInfo.message}</div>`;
                return;
            }

            // 디버그 정보 포맷팅
            let htmlContent = `
                <h3>Project Information:</h3>
                <ul>
                    <li>Project Exists: ${debugInfo.project.exists}</li>
                    <li>Project Saved: ${debugInfo.project.saved}</li>
                    <li>Project Path: ${debugInfo.project.path}</li>
                    <li>Total Items: ${debugInfo.project.items}</li>
                </ul>
                <h3>Footage Items:</h3>
                <ul>
            `;

            debugInfo.items.forEach(item => {
                htmlContent += `
                    <li>
                        <strong>${item.name}</strong> (${item.type})
                        <br>Index: ${item.index}
                        <br>Path: ${item.filePath || 'N/A'}
                        ${item.fileExists !== undefined ? `<br>File Exists: ${item.fileExists}` : ''}
                    </li>
                `;
            });

            htmlContent += '</ul>';
            debugElement.innerHTML = htmlContent;
            debugElement.classList.remove('hidden');
            
            showNotification('Debug information updated', 'success');
        } catch(e) {
            console.error('Debug info parse error:', e);
            showNotification('An error occurred during debug info processing', 'error');
        }
    });
}

// Orbit 폴 여는 함수
function openOrbitFolder() {
    setButtonLoading('openOrbitBtn', true);
    
    const script = `
        try {
            if (!app.project || !app.project.file) {
                '{"error": "NO_PROJECT"}';
            } else {
                var projectPath = app.project.file.parent.fsName;
                var orbitoolsPath = projectPath + '/orbitools';
                
                var orbitFolder = new Folder(orbitoolsPath);
                
                if (!orbitFolder.exists) {
                    '{"error": "NO_ORBIT_FOLDER"}';
                } else {
                    // 운영체제 확인 및 명령어 실행
                    if ($.os.indexOf('Windows') !== -1) {
                        system.callSystem('explorer "' + orbitoolsPath.replace(/\\//g, '\\\\') + '"');
                    } else {
                        system.callSystem('open "' + orbitoolsPath + '"');
                    }
                    
                    // 폴더 존재 여부 재확인
                    '{"success": true, "folderExists": ' + orbitFolder.exists + '}';
                }
            }
        } catch(e) {
            '{"error": "SCRIPT_ERROR", "message": "' + e.toString().replace(/"/g, '\\"') + '"}';
        }
    `;

    csInterface.evalScript(script, function(result) {
        try {
            const response = JSON.parse(result);
            if (response.error) {
                switch(response.error) {
                    case 'NO_PROJECT':
                        showNotification('The project is not saved.', 'error');
                        break;
                    case 'NO_ORBIT_FOLDER':
                        showNotification('The Orbit folder does not exist.', 'error');
                        break;
                    default:
                        showNotification('Error: ' + response.error, 'error');
                }
            } else {
                if (response.success && response.folderExists) {
                    showNotification('Folder opened successfully', 'success');
                    setTimeout(() => {
                        checkProjectStatus();
                    }, 100);
                } else {
                    showNotification('Failed to open folder', 'error');
                }
            }
        } catch(e) {
            console.error('Error in openOrbitFolder:', e);
            showNotification('An error occurred while opening the folder', 'error');
        }
        setButtonLoading('openOrbitBtn', false);
    });
}