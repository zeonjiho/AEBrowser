# OrbitTools

After Effects용 경로 관리 및 동기화 확장 프로그램입니다.
Path management and synchronization extension for After Effects.

## 주요 기능 (Features)

### 1. 경로 변환 (Convert to Relative Path)
- 선택한 아이템의 소스 파일을 src 폴더로 복사
- 절대 경로를 상대 경로로 자동 변환
- 프로젝트 폴더 내 src 폴더 자동 생성

(English)
- Copy source files of selected items to src folder
- Automatically convert absolute paths to relative paths
- Auto-create src folder in project directory

### 2. 소스 동기화 (Sync src Folder)
- 선택한 아이템들의 경로를 src 폴더 내 파일과 동기화
- 다중 선택 지원
- 자동 경로 매칭

(English)
- Synchronize paths of selected items with files in src folder
- Support multiple selection
- Automatic path matching

### 3. 파일 가져오기 (File Import)
- 드래그 앤 드롭으로 파일 직접 가져오기
- 가져온 파일 자동 선택

(English)
- Direct file import via drag and drop
- Auto-select imported files

### 4. 상태 표시 (Status Display)
- 프로젝트 상태 실시간 모니터링
- src 폴더 존재 여부 표시
- 선택된 아이템 정보 표시:
  - 파일 이름
  - 현재 경로
  - 새 경로
  - 파일 포맷
  - 크기
  - 컴포지션의 경우 추가 정보 (duration, fps)

(English)
- Real-time project status monitoring
- src folder existence indicator
- Selected item information display:
  - File name
  - Current path
  - New path
  - File format
  - Dimensions
  - Additional info for compositions (duration, fps)

### 5. 알림 시스템 (Notification System)
- 작업 결과 실시간 알림
- 성공/실패 상태 표시
- 자동 사라짐 (0.78초)

(English)
- Real-time operation result notifications
- Success/failure status display
- Auto-dismiss (0.78 seconds)

### 6. 로딩 상태 (Loading State)
- 작업 중 버튼 비활성화
- 로딩 스피너 표시
- 빠른 피드백 (0.1초)

(English)
- Button disable during operations
- Loading spinner display
- Quick feedback (0.1 seconds)

## 테스트 모드 (Test Mode)
`test.html`에서 다음 기능들을 테스트할 수 있습니다:
The following features can be tested in `test.html`:

- 프로젝트 상태 변경 (Change project status)
- src 폴더 토글 (Toggle src folder)
- 아이템 선택 시뮬레이션 (Simulate item selection)
- 작업 결과 테스트 (Test operation results)
- 드래그 앤 드롭 테스트 (Test drag and drop)

## 시스템 요구사항 (System Requirements)
- Adobe After Effects CC 2015 이상 (Adobe After Effects CC 2015 or higher)
- CEP 12.0 이상 (CEP 12.0 or higher)

## 설치 방법 (Installation)
1. 확장 프로그램 폴더에 파일 복사
   Copy files to extensions folder
2. After Effects 실행
   Launch After Effects
3. Window > Extensions > OrbitTools 선택
   Select Window > Extensions > OrbitTools