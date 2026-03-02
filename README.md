# time-traveler-hunter

## 개요
유튜브 댓글 내 보기 싫은 날짜 놀이 댓글을 자동으로 제거합니다.
예: `2025년 있나요?`, `2026년에도 듣는 사람?`, `지금 2024년인데 듣는 사람`

## 모드
- 약한 탐색: 명확한 날짜놀이 문장 위주로 제거 (오탐 적음)
- 강한 탐색: 폭넓은 날짜+트리거 조합까지 제거 (오탐 가능성 증가, 기본값)

## 추가 튜닝 기능
- 출석/손 민감도 조절
  - `낮음`: 출석류 패턴 완화
  - `보통`: 출석/출첵 기본 탐지
  - `높음`: 출석/출첵 + `손?`까지 적극 탐지
- 제외 키워드
  - 댓글에 키워드가 포함되면 제거 대상에서 제외
- 화이트리스트 키워드
  - 댓글에 키워드가 포함되면 항상 표시 (최우선)

크롬 확장 아이콘 클릭 후 설정을 바꾸면 저장 후 현재 탭 댓글에 즉시 반영됩니다.

## 오탐 완화 규칙
아래 맥락은 날짜놀이가 아닌 정보성 댓글로 보고 우선 예외 처리합니다.
- `n년 전` / `years ago` 상대시점 표현
- 발매/공연/앨범 등 연혁 맥락

단, 강한 날짜놀이 콜아웃이 있으면 제거 우선순위가 올라갑니다.

## Bun 설치
Runtime으로 [bun.js](https://bun.com)를 사용합니다. 설치해주세요.

```shell
curl -fsSL https://bun.sh/install | bash # for Linux & macOS
powershell -c "irm bun.sh/install.ps1 | iex" # for Windows
```

## 빌드
```shell
bun run build
```

## 테스트
```shell
bun run test
```

빌드 후 `dist` 폴더에 아래 파일이 생성됩니다.
- `dist/manifest.json`
- `dist/content-script.js`
- `dist/popup-script.js`
- `dist/popup.html`

## 크롬 확장 로드
1. Chrome에서 `chrome://extensions` 접속
2. 우상단 `개발자 모드` 활성화
3. `압축해제된 확장 프로그램을 로드합니다` 클릭
4. 프로젝트의 `dist` 폴더 선택
