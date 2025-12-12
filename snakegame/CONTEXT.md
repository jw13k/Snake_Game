# Project Context

## 1. 핵심 파일 구조 (Core File Structure)

프로젝트는 **Vanilla JS** 기반의 웹 게임으로, 기능별로 스크립트가 분리되어 있습니다.

| 파일명 | 역할 및 설명 | 주요 함수/클래스 |
| :--- | :--- | :--- |
| [index.html] | **메인 메뉴 (진입점)** | 메뉴 화면, 설정 모달, 스테이지 맵 UI |
| [game.html] | **게임 플레이 화면** | Canvas 요소, 게임 HUD(점수, 웨이브), 오버레이(일시정지, 결과) |
| [common.js] | **공통 설정 및 유틸리티** | `STAGE_CONFIG`, [initAudio()], [playSound()] |
| [menu.js] | **메뉴 로직** | [updateStageMap()], 설정(볼륨, 언어) 이벤트 핸들러 |
| [game.js] | **게임 핵심 로직** | [gameLoop()], [update()], [draw()], [gameClear()], [gameOver()] |
| [style.css] | **스타일 및 애니메이션** | 네온 효과, CSS 변수, `@keyframes shake-red` |

## 2. 데이터 명세 (Data Specification)

### 2.1. 로컬 스토리지 (localStorage)
| Key | 설명 | 예시 값 |
| :--- | :--- | :--- |
| `neon-snake-highscore` | 최고 점수 저장 | `150` |
| `neon-snake-current-stage` | 현재 선택된/진행 중인 스테이지 ID | `1` |
| `neon-snake-unlocked-stages` | 해금된 스테이지 ID 목록 (JSON 배열) | `[1, 2, 3]` |

### 2.2. 스테이지 설정 (STAGE_CONFIG in common.js)
각 스테이지는 객체로 정의되며 다음 속성을 가집니다:
- `type`: 승리 조건 타입 (`score` 또는 `wave`)
- `target`: 승리 목표 값 (점수 또는 웨이브/히트 수)
- `detectLoop`: Wave 타입 스테이지의 보스 패턴 설정 (`{ wave: 5, maxHits: 3 }`)
- `phases`: 진행도에 따른 적 이미지 변경 테이블

### 2.3. 게임 상태 변수 (game.js)
- `snake`: `{x, y}` 좌표 객체들의 배열. (index 0이 머리)
- `viruses`: 아이템(먹이) 좌표 객체 배열.
- `bossState`: Wave 모드에서 보스 피격 횟수 또는 페이즈 추적.
- `playerDamageLevel`: 플레이어의 현재 데미지 상태 (0 ~ Max).

## 3. 기술적 제약사항 (Technical Constraints)

1. **No External Libraries**: 외부 라이브러리 없이 순수 HTML/CSS/JS로만 구현되어야 합니다.
2. **Canvas Rendering**: 게임 그래픽은 `canvas`와 `2d context`를 사용하여 렌더링 됩니다.
3. **Browser Compatibility**: 최신 브라우저(Chrome, Edge 등)를 타겟으로 하며, `window.onerror`를 통해 모바일 등에서의 디버깅을 지원합니다.
4. **Synchronous Logic**: 게임 루프는 `setInterval`을 사용하며, 프레임 드랍 보정 로직(Delta Time)은 현재 구현되어 있지 않습니다.

## 4. 개선 사항 (Improvements)

1. **상수 관리**: [game.js] 내의 매직 넘버(타일 크기, 게임 속도 등)는 상단에 정의되어 있으나, 일부 하드코딩된 값(색상 코드 등)을 CSS 변수나 JS 상수로 통합할 필요가 있습니다.
2. **클래스 기반 리팩토링**: `Snake`, [Virus] 등의 엔티티를 클래스로 분리하여 가독성과 유지보수성을 높일 수 있습니다.
3. **프레임 속도 독립성**: `setInterval` 대신 `requestAnimationFrame`과 Delta Time을 사용하여 모니터 주사율에 관계없이 일정한 게임 속도를 보장하도록 개선할 수 있습니다.
4. **반응형 대응**: 현재 캔버스 크기가 고정(`600x600`)되어 있어 모바일 화면 대응이 미흡합니다.
