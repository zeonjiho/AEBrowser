var csInterface = new CSInterface();

function init() {
    document.getElementById('convertBtn').addEventListener('click', convertToRelativePath);
    document.getElementById('syncBtn').addEventListener('click', syncSrcFolder);
    
    // 프로젝트 상태 체크
    checkProjectStatus();
    // 선택된 아이템 모니터링
    monitorSelection();
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
    setButtonLoading('convertBtn', true);
    
    // 0.1초 지연으로 변경
    await delay(100);
    
    csInterface.evalScript(`
        (function() {
            // 현재 선택된 아이템 가져오기
            var activeItem = app.project.activeItem;
            if (!activeItem) {
                return 'NO_SELECTION';
            }

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
                    }
                }
            }
            
            return syncCount > 0 ? 'SUCCESS:' + syncCount : 'NO_MATCHES';
        })()
    `, function(result) {
        setButtonLoading('syncBtn', false);
        
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
            }
        }
    });
}

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
        }
        
        const projectStatus = JSON.parse(result);
        statusElement.textContent = projectStatus.name;
        indicator.className = 'status-indicator ' + (projectStatus.hasSrcFolder ? 'active' : 'inactive');
    });
}

// 선택된 아이템 정보 업데이트
function updateSelectedItem(item) {
    const selectedItemElement = document.getElementById('selectedItem');
    if (!item) {
        selectedItemElement.innerHTML = '<div class="no-selection">No item selected</div>';
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

    element.addEventListener('drop', (e) => {
        e.preventDefault();
        element.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleDroppedFiles(files);
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