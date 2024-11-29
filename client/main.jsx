var csInterface = new CSInterface();

// 전역 상태 변수 추가
let currentStatus = {
    status: 'NO_PROJECT',
    hasOrbitools: false,
    isSyncing: false,
    lastSync: null
};

function init() {
<<<<<<< Updated upstream
    document.getElementById('convertBtn').addEventListener('click', convertToRelativePath);
    document.getElementById('syncBtn').addEventListener('click', syncSrcFolder);
    
    // 프로젝트 상태 체크
    checkProjectStatus();
    // 선택된 아이템 모니터링
    monitorSelection();
=======
    console.log("Initializing extension...");

    try {
        // Register event listeners
        var createOrbBtn = document.getElementById('createSrcBtn');
        var convertBtn = document.getElementById('convertBtn');
        var syncBtn = document.getElementById('syncBtn');

        if (createOrbBtn) {
            createOrbBtn.addEventListener('click', function() {
                console.log("Create orbitools button clicked");
                createOrbitools();
            });
        } else {
            console.error("CreateOrbBtn not found");
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
>>>>>>> Stashed changes
}

// 지연 함수 추가
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 버튼 상태 관리 함수 추가
function setButtonLoading(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    const spinner = button.querySelector('.loading-spinner');
    
    button.disabled = isLoading;
    if (isLoading) {
        spinner.classList.remove('hidden');
    } else {
        spinner.classList.add('hidden');
    }
}

// 알림 표이머 ID 저장 변수
let notificationTimer = null;

// 알림 표시 함수
function showNotification(message, type) {
    const notification = document.getElementById('notification');
    const overlay = document.getElementById('notificationOverlay');
    
    // 이전 타이머가 있다면 제거
    if (notificationTimer) {
        clearTimeout(notificationTimer);
        notification.classList.remove('show');
        overlay.classList.remove('show');
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
    
    // 강제 리플로우
    notification.offsetHeight;
    
    notification.classList.add('show');
    
    // 새로운 타이머 설정
    notificationTimer = setTimeout(() => {
        notification.classList.remove('show');
        overlay.classList.remove('show');
        notificationTimer = null;
    }, 780);
}

async function convertToRelativePath() {
<<<<<<< Updated upstream
    setButtonLoading('convertBtn', true);
    
    // 0.1초 지연으로 변경
    await delay(100);
    
=======
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

    // 동기화 상태 업데이트
    updateStatusUI({
        ...currentStatus,  // 현재 상태 유지
        isSyncing: true
    });

>>>>>>> Stashed changes
    csInterface.evalScript(`
        (function() {
            // 현재 선택된 아이템 가져오기
            var activeItem = app.project.activeItem;
            if (!activeItem) {
                return 'NO_SELECTION';
            }

<<<<<<< Updated upstream
            // 프로젝트 경로 가져오기
            if (!app.project.file) {
                return 'NO_PROJECT';
            }

            var projectPath = app.project.file.parent.fsName;
            var srcPath = projectPath + '/src';
            
            // src 폴더 생성
            var srcFolder = new Folder(srcPath);
            if (!srcFolder.exists) {
                srcFolder.create();
            }

            // 선택된 아이템의 소스 파일 처리
            if (activeItem.mainSource && activeItem.mainSource.file) {
                var sourceFile = activeItem.mainSource.file;
                var fileName = sourceFile.name;
                var destFile = new File(srcPath + '/' + fileName);
                
                // 파일 복사
                sourceFile.copy(destFile);
                
                // 상대 경로로 변경
                activeItem.replace(destFile);
                return 'SUCCESS';
            }
            
            return 'NO_SOURCE';
        })()
    `, function(result) {
        setButtonLoading('convertBtn', false);
        
        switch(result) {
            case 'SUCCESS':
                showNotification('File copied to src folder and path changed.', 'success');
                break;
            case 'NO_SELECTION':
                showNotification('No item selected.', 'error');
                break;
            case 'NO_PROJECT':
                showNotification('Saved project required.', 'error');
                break;
            case 'NO_SOURCE':
                showNotification('Selected item has no source file.', 'error');
                break;
            default:
                showNotification('An error occurred during operation.', 'error');
        }
    });
}

async function syncSrcFolder() {
    setButtonLoading('syncBtn', true);
    
    // 0.1초 지연으로 변경
    await delay(100);
    
    csInterface.evalScript(`
        (function() {
            if (!app.project.file) {
                return 'NO_PROJECT';
            }

            var projectPath = app.project.file.parent.fsName;
            var srcPath = projectPath + '/src';
            var srcFolder = new Folder(srcPath);
            
            if (!srcFolder.exists) {
                return 'NO_SRC_FOLDER';
            }
            
            // 선택된 아이템들 처리
            var selectedItems = app.project.selection;
            if (selectedItems.length === 0) {
                return 'NO_SELECTION';
            }

            var syncCount = 0;
            for (var i = 0; i < selectedItems.length; i++) {
                var item = selectedItems[i];
                if (item.mainSource && item.mainSource.file) {
                    var fileName = item.mainSource.file.name;
                    var srcFile = new File(srcPath + '/' + fileName);
                    
                    if (srcFile.exists) {
                        item.replace(srcFile);
                        syncCount++;
=======
                var projectPath = app.project.file.parent.fsName;
                var orbitoolsPath = projectPath + '/orbitools';
                var srcPath = orbitoolsPath + '/src';

                // 메타데이터 파일 경로
                var metadataPath = orbitoolsPath + '/metadata.json';
                var metadataFile = new File(metadataPath);
                
                // 현재 시간을 ISO 문자열로 저장
                var currentTime = new Date().toISOString();
                
                // 메타데이터 업데이트
                var metadata = {
                    projectInfo: {
                        lastSync: currentTime
>>>>>>> Stashed changes
                    }
                };

                // 메타데이터 파일 저장
                try {
                    metadataFile.open('w');
                    metadataFile.write(JSON.stringify(metadata, null, 2));
                    metadataFile.close();
                } catch(e) {
                    return JSON.stringify({
                        error: 'METADATA_ERROR',
                        message: e.toString()
                    });
                }
<<<<<<< Updated upstream
=======

                return JSON.stringify({
                    success: true,
                    lastSync: currentTime
                });
            } catch(e) {
                return JSON.stringify({
                    error: 'SYNC_ERROR',
                    message: e.toString()
                });
>>>>>>> Stashed changes
            }
            
            return syncCount > 0 ? 'SUCCESS:' + syncCount : 'NO_MATCHES';
        })()
    `, function(result) {
        setButtonLoading('syncBtn', false);
<<<<<<< Updated upstream
        
        if (result.startsWith('SUCCESS:')) {
            var count = result.split(':')[1];
            showNotification(count + ' files synchronized.', 'success');
        } else {
            switch(result) {
                case 'NO_SELECTION':
                    showNotification('No item selected.', 'error');
                    break;
                case 'NO_PROJECT':
                    showNotification('Saved project required.', 'error');
                    break;
                case 'NO_SRC_FOLDER':
                    showNotification('src folder not found.', 'error');
                    break;
                case 'NO_MATCHES':
                    showNotification('No files available for synchronization.', 'error');
                    break;
                default:
                    showNotification('An error occurred during synchronization.', 'error');
=======
        setFileListLoading(false);

        try {
            const response = JSON.parse(result);
            if (response.error) {
                showNotification('Sync failed: ' + response.message, 'error');
            } else {
                showNotification('Sync completed successfully', 'success');
                setTimeout(checkProjectStatus, 100);
>>>>>>> Stashed changes
            }
        }

        // 동기화 상태 해제
        updateStatusUI({
            ...currentStatus,
            isSyncing: false
        });
    });
}

<<<<<<< Updated upstream
// 프로젝트 상태 체크
function checkProjectStatus() {
    csInterface.evalScript(`
        (function() {
            if (!app.project.file) return 'NO_PROJECT';
            
            var projectPath = app.project.file.parent.fsName;
            var srcPath = projectPath + '/src';
            var srcFolder = new Folder(srcPath);
            
            return JSON.stringify({
                name: app.project.file.name,
                hasSrcFolder: srcFolder.exists
            });
        })()
    `, function(result) {
        const statusElement = document.getElementById('projectStatus');
        const indicator = document.getElementById('srcStatus');
        
        if (result === 'NO_PROJECT') {
            statusElement.textContent = 'No Project (Save project first)';
            indicator.className = 'status-indicator inactive';
            return;
=======
// 메타데이터 관리 함수들
function getMetadataPath() {
    return app.project.file.parent.fsName + '/orbitools/metadata.json';
}

function readMetadata() {
    var file = new File(getMetadataPath());
    if (!file.exists) {
        return {
            projectInfo: {
                name: app.project.file.name,
                path: app.project.file.fsName,
                lastSync: null
            },
            files: {}
        };
    }
    
    file.open('r');
    var content = file.read();
    file.close();
    
    return JSON.parse(content);
}

function writeMetadata(data) {
    var file = new File(getMetadataPath());
    file.open('w');
    file.write(JSON.stringify(data, null, 2));
    file.close();
}

// Project Status 체크 함수 수정
function checkProjectStatus() {
    csInterface.evalScript(`
        (function() {
            try {
                var activeProject = app.project;  // 여기서 app 객체 접근
                
                if (!activeProject) {
                    return JSON.stringify({
                        status: 'NO_PROJECT',
                        message: '프로젝트가 열려있지 않습니다',
                        hasOrbitools: false
                    });
                }

                if (!activeProject.file) {
                    return JSON.stringify({
                        status: 'UNSAVED',
                        message: '프로젝트를 저장해주세요',
                        hasOrbitools: false
                    });
                }

                var projectPath = activeProject.file.parent.fsName;
                var orbitoolsPath = projectPath + '/orbitools';
                var orbitoolsFolder = new Folder(orbitoolsPath);

                // 메타데이터 체크
                var lastSync = null;
                if (orbitoolsFolder.exists) {
                    var metadataFile = new File(orbitoolsPath + '/metadata.json');
                    if (metadataFile.exists) {
                        try {
                            metadataFile.open('r');
                            var content = metadataFile.read();
                            metadataFile.close();
                            var metadata = JSON.parse(content);
                            lastSync = metadata.projectInfo.lastSync;
                        } catch(e) {
                            // 메타데이터 읽기 실패는 무시
                        }
                    }
                }

                return JSON.stringify({
                    status: 'OK',
                    projectName: activeProject.file.name,
                    hasOrbitools: orbitoolsFolder.exists,
                    lastSync: lastSync
                });

            } catch(e) {
                return JSON.stringify({
                    status: 'ERROR',
                    message: e.message || '알 수 없는 오류가 발생했습니다',
                    hasOrbitools: false
                });
            }
        })()
    `, function(result) {
        console.log("Status check result:", result);

        try {
            const status = JSON.parse(result);
            currentStatus = { ...currentStatus, ...status };
            updateStatusUI(currentStatus);
        } catch(e) {
            console.error("Error parsing project status:", e);
            currentStatus = {
                status: 'ERROR',
                message: '상태를 확인할 수 없습니다',
                hasOrbitools: false
            };
            updateStatusUI(currentStatus);
>>>>>>> Stashed changes
        }
        
        const projectStatus = JSON.parse(result);
        statusElement.textContent = projectStatus.name;
        indicator.className = 'status-indicator ' + (projectStatus.hasSrcFolder ? 'active' : 'inactive');
    });
}

<<<<<<< Updated upstream
// 선택된 아이템 정보 업데이트
function updateSelectedItem(item) {
    const selectedItemElement = document.getElementById('selectedItem');
    if (!item) {
        selectedItemElement.innerHTML = '<div class="no-selection">No item selected</div>';
=======
// UI 업데이트 함수 수정
function updateStatusUI(status) {
    const statusElement = document.getElementById('projectStatus');
    const indicator = document.getElementById('srcStatus');
    const lastSyncElement = document.getElementById('lastSync');

    if (!statusElement || !indicator) {
        console.error("Status elements not found");
        return;
    }

    // 상태에 따른 UI 업데이트
    if (status.status === 'OK') {
        statusElement.textContent = status.projectName;
        indicator.className = 'status-indicator ' + (status.hasOrbitools ? 'active' : 'inactive');
    } else {
        statusElement.textContent = status.message;
        indicator.className = 'status-indicator inactive';
    }

    // 마지막 동기화 시간 표시
    if (lastSyncElement) {
        if (status.status === 'OK' && status.lastSync) {
            const syncDate = new Date(status.lastSync);
            lastSyncElement.textContent = `Last Sync: ${syncDate.toLocaleString()}`;
        } else {
            lastSyncElement.textContent = '';
        }
    }

    // 버튼 상태 업데이트
    updateButtonStates(status);
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
>>>>>>> Stashed changes
        return;
    }

    const projectPath = item.projectPath || '';
    const newPath = projectPath ? `${projectPath}/src/${item.name}` : 'No source path';

    selectedItemElement.innerHTML = `
        <div class="item-info">
            <div class="item-name">${item.name}</div>
            <div class="path-info">
                <div class="current-path">
                    <span class="path-label">Current:</span>
                    ${item.path || 'No source path'}
                </div>
                <div class="new-path">
                    <span class="path-label">New:</span>
                    ${newPath}
                </div>
            </div>
            <div class="item-specs">
                <div class="spec-item">
                    Format:<span>${item.format || 'N/A'}</span>
                </div>
                <div class="spec-item">
                    Size:<span>${item.width || 0} x ${item.height || 0}</span>
                </div>
                ${item.duration ? `
                    <div class="spec-item">
                        Duration:<span>${item.duration}s</span>
                    </div>
                    <div class="spec-item">
                        FPS:<span>${item.frameRate || 0}</span>
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    // 드래그 앤 드롭 이벤트 설정
    setupDragAndDrop(selectedItemElement);
}

// 드래그 앤 드롭 설정
function setupDragAndDrop(element) {
    element.addEventListener('dragover', (e) => {
        e.preventDefault();
        element.classList.add('drag-over');
    });

    element.addEventListener('dragleave', () => {
        element.classList.remove('drag-over');
    });

<<<<<<< Updated upstream
    element.addEventListener('drop', (e) => {
        e.preventDefault();
        element.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleDroppedFiles(files);
=======
    // Initial update
    updateSelectedItem();
}

// Create src folder
function createOrbitools() {
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
>>>>>>> Stashed changes
        }
    });
}

// 드롭된 파일 처리
function handleDroppedFiles(files) {
    Array.from(files).forEach(file => {
        const path = file.path;
        csInterface.evalScript(`
            (function() {
                app.project.importFile(new ImportOptions(File("${path}")));
                return 'SUCCESS';
            })()
        `, function(result) {
            if (result === 'SUCCESS') {
                showNotification('File imported successfully.', 'success');
            } else {
                showNotification('Failed to import file.', 'error');
            }
        });
    });
}

<<<<<<< Updated upstream
// 선택된 아이템 모니터링
function monitorSelection() {
    csInterface.evalScript(`
        (function() {
            var item = app.project.activeItem;
            if (!item) return 'NO_SELECTION';
            
            var info = {
                name: item.name,
                path: item.mainSource && item.mainSource.file ? item.mainSource.file.fsName : null,
                projectPath: app.project.file ? app.project.file.parent.fsName : null,
                format: item.mainSource ? item.mainSource.file.toString().split('.').pop() : null,
                width: item.width || null,
                height: item.height || null
            };

            if (item instanceof CompItem) {
                info.duration = item.duration.toFixed(2);
                info.frameRate = item.frameRate.toFixed(2);
            }

            return JSON.stringify(info);
        })()
    `, function(result) {
        if (result !== 'NO_SELECTION') {
            updateSelectedItem(JSON.parse(result));
        } else {
            updateSelectedItem(null);
        }
    });
}

init(); 
=======
// 버튼 상태 업데이트 함수 추가
function updateButtonStates(status) {
    const createOrbBtn = document.getElementById('createOrbBtn');
    const syncBtn = document.getElementById('syncBtn');
    
    if (!createOrbBtn || !syncBtn) {
        console.error("Buttons not found");
        return;
    }

    // orbitools 폴더가 있으면 createOrbBtn 비활성화
    if (status.hasOrbitools) {
        createOrbBtn.disabled = true;
        createOrbBtn.classList.add('disabled');
        createOrbBtn.title = 'Orbitools folder already exists';
    } else {
        createOrbBtn.disabled = false;
        createOrbBtn.classList.remove('disabled');
        createOrbBtn.title = 'Add orbitools';
    }

    // 동기화 중이면 syncBtn 비활성화
    if (status.isSyncing) {
        syncBtn.disabled = true;
        syncBtn.classList.add('disabled');
        syncBtn.title = 'Sync in progress';
    } else {
        syncBtn.disabled = false;
        syncBtn.classList.remove('disabled');
        syncBtn.title = 'Sync src folder';
    }
}

init();
>>>>>>> Stashed changes
