# Proj. North Star — BLACK ORACLE 구현 방향

| 항목 | 값 |
|---|---|
| 상태 | **APPROVED**: 2026-10-02 한서님 승인 (결정 기록은 §12) |
| 작성 | 2026-10-02 KST, Claude (한서님 직접 지시) |
| 정본 위치 | `hanul442/black_oracle_report` → `docs/NORTH_STAR.md` (Drive에는 링크 문서만 둠) |
| 상위 기준 | HANUL AI TEAM Constitution v1.1 → [Frozen v1](https://github.com/hanul442/black_oracle_bot/blob/a19be54c363fc389c4b2192027fd93e0794044e2/docs/architecture/BLACK_ORACLE_CANONICAL_FROZEN_V1.md) → **이 문서** |
| 부속 문서 | [BOT 이식 분류표](north-star/BOT_MIGRATION_INVENTORY.md) |
| 실행 권한 | **Claude**: 설계·결정·구현·머지·배포 전권 위임 (2026-10-02, §11) |

> 이 문서는 Frozen v1의 **아키텍처를 바꾸지 않아요.** Frozen이 정한 "무엇을"을 바탕으로 **"어떤 순서로, 어디에, 어떤 모습으로"** 만들지를 하나로 정리한 실행 기준이에요.
> 아래 문서들은 이제 이 문서의 **하위 또는 역사 기록**이에요:
> - BOT `README.md`와 BOR `README.md`의 Alpha 정의
> - BOT `docs/ALPHA_ROADMAP.md`
> - BOT `docs/design/design-system.md`와 `docs/BLACK_ORACLE_UI_V11.md`의 정보 구조(IA)
> - Tracker v2의 일정
>
> 정책 수치(임계값, horizon 등)는 계속 Frozen §12의 "의도적 미정" 상태로 남아요.

---

## 0. 한 장 요약

1. **무엇을 만드나:** 아침에 *오늘 리포트에서 어제와 바뀐 점*을 확인하고, *트레이딩뷰 같은 차트*에서 *근거가 붙은 판단*을 보면서 **공부가 되는 한국어 투자 리서치 도구**예요. 자동매매는 이 판단을 검증하는 **아래층 엔진**이고, Alpha 동안은 PAPER 전용이에요.
2. **어디에 만드나:** BOT 기능을 **BOR(`black_oracle_report`)로 통합**해서 단일 제품 저장소로 만들어요. 선별 이식이고, 기존 BOT PAPER 런타임은 BOR 쪽 동작이 검증될 때까지 유지해요.
3. **어떤 순서로:** Foundation 이식 → **한 자산 Walking Skeleton**(Source→Evidence→Forecast→History→Report→차트) → 화면 → 판단·PAPER 이식 → 안정화.
4. **언제:** Closed Alpha는 10/20에서 **2026-11-18 (수)** 로 옮겼어요(D-2 확정). 11/25는 내부 위험 버퍼예요(§10).
5. **무엇을 하지 않나:** LIVE 매매, 새 기능 확장(Globe 고도화, AI Chat, Alert 체계, AI 직원 생애주기 PR #254), 새 리서치 사이클 추가. 이것들은 Alpha 이후로 미뤄요.

---

## 1. North Star

### 1.1 한 문장

> **"오늘도 BLACK ORACLE 덕분에 시장을 빠르게 읽었고, 무엇을 왜 그렇게 봐야 하는지 배웠고, 그걸 거래에 적용했다."**
> — 한서님 인터뷰(2026-09-23) Q3·Q75, Decision Log D-001·D-005

### 1.2 성공 장면 (인터뷰 Q75 정리)

1. 앱을 열면 **맨 위 Globe**에 오늘 시장에서 중요한 사건이 지도 위에 보여요.
2. 그 아래에 **관심 종목, 오늘의 인기 종목, 최신 리포트**가 목록으로 나와요. 각 리포트에는 **"어제 대비 바뀐 점"** 한 줄이 붙어 있어요.
3. 종목을 누르면 **트레이딩뷰처럼 차트**가 먼저 보여요. 트레이딩뷰의 "전문가 의견·기술적 분석" 자리를 **BLACK ORACLE 리포트**가 대신해요.
4. 5초 안에 **스탠스 게이지**(Strong Sell↔Strong Buy), **한 줄 이유**, **단기·중기·장기 모멘텀**을 파악해요.
5. **"왜?"** 를 누르면 찬성·반대 근거를 **비율과 신뢰도**로 보여주고, 근거가 부족하면 **"판단 보류 + 추가 조사 중"** 으로 정직하게 표시해요.
6. 더 깊이 보면 Council 토론(유료), 예측 이력과 실패 리뷰, 개념 설명(Oracle Edu)이 나와요. 사용자는 **공부하고 있다는 느낌**을 받아요.

### 1.3 Alpha 성공 기준 (측정 가능한 형태)

| # | 기준 | 측정 |
|---|---|---|
| S1 | 매일 아침 지정 자산의 리포트가 **자동으로** 생성돼요 | 7일 연속 생성률 ≥ 95%, 실패하면 degraded 표시 |
| S2 | 모든 리포트에 **"어제 대비 변화"** 가 있어요 | 이전 버전 artifact와 diff 연결 100% |
| S3 | 리포트의 핵심 주장마다 **근거(Evidence)로 추적**돼요 | 핵심 claim → Evidence ID 연결률 100%, 근거 없는 claim은 "확인 필요" |
| S4 | 종목 페이지에서 **5초 판단**이 가능해요 | 테스터 과제: 스탠스·이유·주의점을 5초 안에 말하기 (≥ 80%) |
| S5 | 판단 하나를 **처음부터 끝까지 재구성**할 수 있어요 | Golden Trace(Source→…→Report) 재현, 반례 7종 거부 |
| S6 | PAPER 판단과 `NO_TRADE`가 원장에 남아요 | Decision Run ID로 판단·결과 조회 |
| S7 | 테스터가 "공부가 됐다"고 답해요 | Closed Alpha 설문 ≥ 70% 긍정 |

---

## 2. 핵심 사용자 여정

```text
① Home ──► ② 오늘 리포트 / 어제 대비 ──► ③ 종목 차트 ──► ④ 왜? (찬반 근거 %) ──► ⑤ 깊이 보기 · 배우기
   │                                      ▲
   └──── 관심종목 / 인기 종목 ────────────┘
```

| 단계 | 사용자가 묻는 것 | 화면이 답하는 것 | 필요한 엔진 산출물 |
|---|---|---|---|
| ① Home | 지금 뭘 봐야 하지? (D-002) | 오늘 중요한 사건(Globe), 관심 종목 변화, 새 리포트 | NARS Event, material-change stream, Report index |
| ② 리포트 | 어제와 뭐가 달라졌지? | 결론 먼저, 변화 요약, 다음 이벤트 체크리스트 | Report Artifact v(n) + diff v(n-1) |
| ③ 종목 | 이 자산 지금 어때? | 차트, 스탠스 게이지, 한 줄 이유, 모멘텀 3종 | Forecast(호라이즌별), Strategy judgment |
| ④ 왜? | 왜 그렇게 봐? | 찬성/반대 근거 비율, 근거별 신뢰도·신선도, 불확실성 | Evidence balance(WHY contract), Council 요약 |
| ⑤ 깊이 | 맞았던 적은 있어? 이 개념이 뭐지? | 예측 vs 실제 overlay, 실패 리뷰, 개념 설명 | Forecast History, Evaluation, Edu 콘텐츠 |

---

## 3. 제품 원칙과 의미 계약

Frozen §4와 각 역할의 판단 기준을 짧게 고정해요. 세부는 원문을 따라요.

1. **근거가 먼저, 문장은 그다음이에요.** 중요한 주장에는 Evidence ID가 있어요. 없으면 "확인 필요"로 표시해요.
2. **모르는 건 모른다고 써요.**
   - unknown ≠ neutral, stale ≠ 반대 의견, degraded ≠ 이견
   - "반대 근거 없음"과 "조사하지 않음"은 다른 상태예요.
3. **네 가지 축을 섞지 않아요:** 방향 확률 / 전략 강도 / 예측 신뢰도 / 근거·데이터 품질. 화면은 단순하게 보여줘도 내부 값은 분리해요.
4. **기사 개수 ≠ 확률이에요.** 같은 출처에서 나온 재인용은 독립 근거가 아니고, 다수결이나 직급도 결론의 근거가 아니에요.
5. **한국어로 설명해요.** Council과 Agent 출력은 사용자에게 **한국어 문장**으로 보여줘요. 인터뷰에서 "영어 코드 같아서 이해가 어렵다"고 하셨던 부분을 바로잡아요. 내부 enum과 reasonCode는 유지하되 표시 계층에서 번역해요.
6. **과거를 다시 쓰지 않아요.** 리포트·예측·판단은 불변 버전으로 남기고, 새 정보는 새 버전으로 만들어요(Frozen §17.1·17.2).
7. **Risk가 Strategy보다 우선해요.** AI와 Council은 결정론적 Hard Risk를 우회할 수 없어요(인터뷰 Q-Risk 3, Frozen §2E).
8. **결제는 깊이를 바꿀 뿐, 진실을 바꾸지 않아요**(Frozen §7).

---

## 4. 시스템 구조: 단일 저장소(BOR)

### 4.1 왜 통합하나

- 감사 보고서 Gap 2: 6개 도메인과 저장소의 대응이 없었고, S1 Intelligence 작업이 BOR이 아니라 BOT에서 진행되고 있었어요.
- Railway 서비스 수 한도 때문에 BOR 런타임을 따로 배포하지 못했어요(BOR runbook). 하나로 합치면 이 문제가 사라져요.
- 리포트(BOR)와 판단 엔진(BOT)이 같은 Evidence·Forecast를 써야 Why와 Report의 계보가 하나로 유지돼요(Frozen §8 "Why는 Final Decision과 같은 계보").

### 4.2 지켜야 할 경계

BOR은 "거래 권한 없음"을 전제로 만들어졌어요(BOR README, `RUNTIME_BOUNDARY.md`). 통합 후에는 이 경계를 **저장소 단위가 아니라 모듈·배포 단위**로 지켜요.

| 경계 | 통합 후 규칙 |
|---|---|
| 거래 권한 | `paper` 모듈만 PAPER 상태를 변경해요. 실거래(LIVE)는 Frozen §17.4의 **AUTOTRADE 분리 런타임**으로만 하고, Alpha 범위에서는 만들지 않아요. |
| 비밀값 | 브로커·거래소 키는 웹앱 번들과 LLM 프롬프트에 절대 들어가지 않아요. 리서치·리포트 모듈은 PAPER와 원장 쓰기 권한이 없어요. |
| 의존 방향 | `experience → (read API) → core 모듈`. 화면이 엔진 상태를 직접 바꾸지 않아요. |
| Experiment Lab | 제안·시험·비교만 하고, 운영 버전을 직접 변경하지 않아요(Decision Log §26). |

> 이 변경은 BOR README의 "Explicit non-scope"(주문·포트폴리오 변경 금지)와 "BOT 독립" 원칙을 **수정**해요. 2026-10-02 한서님이 승인했어요(§12 D-1).

### 4.3 목표 디렉터리 구조

Frozen §15-10("작고 일관된 시스템")에 따라 런타임과 엔진은 **루트 패키지 하나**에 두고 `src/<domain>/` 폴더로 나눠요. 의존성이 전혀 다른 것만 별도 패키지로 분리해요.

```text
black_oracle_report/
├─ src/
│  ├─ foundation/     # F: canonical data, PIT/as-of, Decision Run, Version Registry, event ledger, asset graph   (M1)
│  ├─ intelligence/   # B: evidence/, research/, report/ (M0 완료) + nars-consumer, council, forecast(+history) (M2~M3)
│  ├─ strategy/       # C: routing, champions, trade planner, judgment vocabulary                                 (M4)
│  ├─ risk/           # E: hard risk gate (결정론, 우회 불가)                                                      (M4)
│  ├─ paper/          # E: PAPER execution adapter, positions, reconciliation                                     (M4)
│  ├─ evaluation/     # D: shared evaluation/attribution, experiment ledger                                       (M4)
│  └─ runtime/        # API 서버, 스케줄러, 헬스·버전 (M0 완료)
├─ web/               # React/Vite 앱, 별도 package.json (새 IA, §5)                                               (M5)
├─ services/nars/     # NARS v4 (Cloudflare Worker + Supabase), 별도 package.json, BOT에서 이식                    (M2)
├─ db/migrations/     # 단일 migration 계보
└─ docs/              # NORTH_STAR.md, architecture/, contracts/, research/
```

**도메인 경계는 테스트로 강제해요.** `src/architecture.test.ts`가 모든 상대 import를 검사해요.

| 도메인 | import할 수 있는 도메인 |
|---|---|
| `foundation` | 없음 |
| `intelligence` | foundation |
| `strategy` | foundation, intelligence |
| `risk` | foundation |
| `paper` | foundation, risk |
| `evaluation` | foundation, intelligence, strategy |
| `runtime` | 전부 |

도메인별 소유 모듈:

| Frozen 도메인 | 모듈 | 현재 출처 | 비고 |
|---|---|---|---|
| A Product Experience | `web/` | BOT `src/` (재구성), BOR `alphaReportPage`·`reportHtmlRenderer` | IA는 새로 짜고(§5), 컴포넌트는 선별 재사용 |
| B Intelligence | `src/intelligence`, `services/nars` | BOR `evidence*`, `researchCouncil`, `thesisScenario`, `report*`, `sourceIngestion` + BOT `services/nars`, `server/trading/narsConsumer` 등 | BOR 쪽 contract가 기반 |
| C Strategy | `src/strategy` | BOT `src/trading/*`(router, champion, council, horizon) | 판단 어휘는 7단계(Frozen §2C) |
| D Experiment/Evaluation | `src/evaluation` | BOT `strategyExperimentLedger`, `councilCounterfactual`, `councilProspectiveEvaluation` 등 | 하나의 공유 엔진 |
| E Runtime Safety | `src/risk`, `src/paper` | BOT `botRiskExecutionBoundary`, `executionPolicy`, `paperSession`, `paperLoop` | Alpha에서는 LIVE 없음 |
| F Shared Data/Memory | `src/foundation` | BOT `server/foundation/*`, `server/eventLedger*`, `decisionReplay` | 최우선 이식 대상 |

구체적인 파일 분류는 [BOT_MIGRATION_INVENTORY.md](north-star/BOT_MIGRATION_INVENTORY.md)에 있어요.

---

## 5. UI North Star

> 결정 근거: 인터뷰(Q 전체 시스템·UX 섹션, Q75), Frozen §2A·§5·§7, Decision Log D-002.
> 시각 톤은 목업 v1의 **화이트·웜 아이보리·절제된 골드**를 따라요(`docs/design/mockups/mobile-v1`).
> 헌법 §9에 따라 UI 정본은 Figma지만, 지금은 Figma 원본이 없어요. 그래서 이 섹션을 임시 정본으로 쓰고, Figma가 생기면 링크해요.

### 5.1 정보 구조 (IA)

**하단 내비게이션 4개 + 보조 진입점**

| 탭 | 질문 | 핵심 구성 |
|---|---|---|
| **홈** | 지금 무엇을 봐야 하지? | ① Globe(오늘의 사건) ② 관심 종목 변화 ③ 오늘의 리포트 + "어제 대비" ④ 인기·급등락 종목 ⑤ 주요 일정 |
| **마켓** | 이 자산 지금 어때? | 검색, 시장 분류(국내주식·미국주식·크립토·FX·매크로), 종목 상세 = **차트 우선 종목 페이지** |
| **리포트** | 리서치가 지금 무엇을 지지하지? | 데일리·긴급·종목 리포트, 버전 아카이브, 변화 비교 |
| **관심** | 내 종목은? | 관심 종목, 알림 설정(Alpha 이후), 내 메모 |
| (상단·더보기) **Lab / 시스템** | 무엇이 검증됐지? 엔진은 건강한가? | Champion·실험 원장, 런타임 상태, NARS 상태, PAPER 기록 |

- 대체되는 구조:
  - DS v2의 Home / Report / AutoTrade / Community
  - V11의 Command / Markets / Oracle / Trade / Lab / System
  - 목업 v1의 Home / Markets / Council / Trade / Lab
- **Council과 Trade는 별도 탭이 아니에요.** 종목 페이지와 리포트 안으로 들어가요. 매매 엔진은 보조 화면(Lab/시스템)으로 내려가요(Decision Log §24 Finding 3).

### 5.2 종목 페이지 (가장 중요한 화면)

```text
┌──────────────────────────────────┐
│ SK하이닉스 000660   ₩219,500 +3.3% │  ← 가격·시각·데이터 상태 배지
│ [스탠스 게이지 ◐ Buy]  "HBM 수요…"   │  ← 5초 영역: 스탠스 + 한 줄 이유
│ 단기 ▲  중기 ▲  장기 ■              │  ← 호라이즌별 모멘텀 (Frozen §2B Forecast)
├──────────────────────────────────┤
│        캔들 차트 (사용자 지표)        │  ← 기본: 캔들 + 사용자가 고른 지표
│   ◆뉴스 ◆실적 ◆Council 변화 마커      │  ← 이벤트 레이어 (켜고 끄기)
│   ░ 예측 범위 (선택 레이어)           │
├──────────────────────────────────┤
│ [리포트] [왜?] [예측 이력] [Council]  │  ← 패널 탭 (리포트가 기본)
│  결론 → 3줄 → 상세                    │
└──────────────────────────────────┘
```

- **모바일은 차트가 먼저**예요. 리포트는 아래 패널이고, 큰 화면에서는 오른쪽 패널로 보여줘요.
- **스탠스 게이지**는 Strong Sell ↔ Strong Buy 7단계 속도계예요(인터뷰 Strategy Q2, Frozen §5).
  - 게이지 값은 **전략 강도**이고, 방향 확률은 별도로 "상승 67% (단기)"처럼 표시해요.
- **왜? 패널** (BO-S1-014 WHY contract)
  - 찬성 / 반대 / 불확실 근거를 비율과 근거별 신뢰도·신선도와 함께 보여줘요.
  - 근거가 부족하면 **"판단 보류: 근거 부족, 추가 수집 중"** 으로 표시해요.
- **예측 이력**에서는 과거 예측과 실제 가격을 겹쳐 보여주고, 틀린 경우 "얼마나, 왜"를 설명해요(인터뷰 Forecast Q9).
- **Council 패널**
  - 무료: 한국어 요약 한 단락과 찬성·보류·반대 분포
  - 유료: 전문가별 한국어 의견 원문, 토론 경과, Red Team 반론

### 5.3 상태 표시 규칙 (모든 화면)

| 상태 | 표기 | 의미 |
|---|---|---|
| LIVE / 최신 | 시각 표시 | 정상 |
| 지연 / STALE | 회색 배지 + "n분 전 데이터" | 신선도 기준 초과 |
| 일부 제한 / DEGRADED | 노란 배지 + 영향받는 기능을 한국어로 설명 | 일부 소스나 방법만 사용 |
| 데이터 없음 / NOT_AVAILABLE | "—" + 사유 | **가짜 숫자나 예시 값을 절대 넣지 않음** |

목업 안의 숫자(예: Council 72점, NVIDIA 86%)는 **예시일 뿐**이고, 실제 런타임 데이터로만 채워요.

### 5.4 시각·모션·접근성

- 톤은 화이트·아이보리·골드 포인트, 남색·차콜 글자예요. 네온, 파티클, 장식용 3D는 쓰지 않아요.
- 금융 숫자는 등폭(tabular) 숫자로 쓰고, 단위·시각·통화를 항상 함께 표시해요.
- 상승·하락을 색만으로 구분하지 않아요. ▲▼ 같은 기호를 함께 써요.
- 모션은 상태를 설명할 때만 쓰고 `prefers-reduced-motion`을 지켜요(V11 모션 규칙을 그대로 가져와요).
- 스크롤은 문서 단위로 하고, 중첩 스크롤은 금지해요(V11 스크롤 모델을 그대로 가져와요).
- Globe는 **Home 상단의 시각화**예요. 사건 위치 → 관련 리포트·종목으로 이동하는 역할만 해요(인터뷰 Q-Globe). Alpha에서는 정적 2D/3D 마커 수준이면 충분해요.

### 5.5 기존 프론트엔드 처리

- BOT `src/mobile/`에는 앱 버전이 15개 넘게 있는데, 실제로 화면에 뜨는 건 **`BlackOracleMobileAppV11_1` 하나**예요(V2~V11 13개는 어디서도 import하지 않음). **새 `web`은 새 IA로 다시 짜고**, `IntegratedMarketChart`·`PortfolioEquityChart`·`CanonicalDecisionReplayPanel` 같은 검증된 컴포넌트만 가져와요(분류표 #24).
- 기존 BOT 프론트엔드는 BOT 아카이브 시점까지 그대로 둬요. 운영 중인 PAPER 화면이기 때문이에요.

---

## 6. NARS 방향

### 6.1 현재 상태

| | v3 (실제 운영 중) | v4 (BOT `services/nars`, shadow) |
|---|---|---|
| 구조 | Google Apps Script + Sheets, 10분 수집, 08·12·16·20시 Slack 리포트 | RSS/API → Cloudflare Queue → Supabase `nars_*` → Story/Event 클러스터링 → Evidence 등급(AAA~F) + Priority(FLASH~ROUTINE) |
| 강점 | 1년 넘게 계속 돌아감, 키워드 추세 | 출처 독립성, 하드 게이트, 점수 원장, 결정론적 기준선 |
| 한계 | 키워드 빈도라서 `종합`·`만에` 같은 불용어, 스포츠·날씨가 상위에 올라옴. 오류 1.2만 행(대역폭 한도, 락 경합, 죽은 피드). 백업 탭이 30만 행 넘게 쌓임. **오류 로그에 Slack 웹훅이 평문으로 남아 있음** | 실제 Worker 설정과 배포 증거가 없어 배포 준비 상태 BLOCKED. 투자 관련성 분류 없음 |

### 6.2 방향

1. **즉시 (코드 외):** Slack 웹훅을 재발급하고, v3 `Errors` 탭에서 웹훅 URL이 찍힌 행을 정리해요. (한서님 작업)
2. **v3 단기 보강:**
   - 불용어 목록 추가
   - 비금융 카테고리(스포츠·날씨·사건사고) 제외
   - 오류 메시지에서 URL 마스킹
   - `Keyword_Scores_Bak` 보관 기간 제한
3. **v4가 기준이 돼요:** NARS는 BOR `services/nars`로 옮겨요. 그 위에 **투자 관련성 계층**을 추가해요(인터뷰: "투자에 영향을 주는 중대하거나 사소하지만 결국 영향을 미치는 뉴스").
   - Event → 자산·섹터·국가 매핑(Asset Graph)
   - 관련 없는 Event는 Evidence로 승격하지 않아요 → **LLM 비용 절감**
4. **소스 확장 순서:** 뉴스 → 공시(DART, SEC) → 가격·지표 → 리서치 → SNS·온체인. 인터뷰 Q-NARS 3에 따라 Alpha에는 뉴스와 공시까지만 넣어요.
5. **v3 → v4 전환 조건:** v4 shadow가 v3 대비 기사 손실 없음(7일), 배포 증거 패킷 확보(감사 보고서 C4). 조건을 채운 뒤 v3를 읽기 전용으로 전환해요.

---

## 7. 리서치 운영

- **상태:** R&D 원장에 가설 11개 이상(DI·AIML·Q·EV·D)이 있는데, **전부 TEST / Result PENDING**이에요. 가설이 실험보다 빨리 쌓이고 있어요.
- **원칙:** Alpha까지는 **새 사이클을 열지 않고**, 이미 등록된 실험의 **첫 결과**를 만들어요. 새 자료가 나오면 기존 ID를 보강하는 데만 써요(원장 hygiene 규칙).
- **실험 순서**(원장의 "Current implementation priority"와 같아요):
  1. DI-001 + DI-003: PIT·결정론적 replay fixture. **Walking Skeleton의 테스트 fixture로 함께 써요.**
  2. DI-006: 같은 fixture에 계보 결함을 주입해서 검증
  3. EV-010 → EV-011: Forecast History가 생긴 뒤 시작
  4. Q-005: Strategy Factory를 확장하기 전에 시작
  5. AIML-005/006: Council을 바꾸기 전에 평가 기준선 확보
- **통합:** BOT `docs/research/`(cycle 001~013, ledger)를 BOR `docs/research/`로 합쳐서 원장을 하나로 만들어요.
- **역할 분담(헌법 §4.1):** 외부 조사는 Gemini/RESEARCH, 실험 구현은 Claude/ENGINEERING, 판정은 QUANT/QA가 해요.

---

## 8. BOT → BOR 통합 계획

### 8.1 원칙

- **선별 이식:** 분류표에서 KEEP·MODIFY로 분류된 것만 BOR 패키지 구조에 맞춰 옮기고, **테스트도 함께** 옮겨요. 테스트 없이 옮긴 코드는 "이식 완료"로 치지 않아요.
- **행동 보존:** PAPER와 Risk 의미(Frozen §2E, 기존 PAPER 보호 테스트)는 바꾸지 않고 옮겨요. 의미를 바꿔야 하면 별도 결정으로 처리해요.
- **이중 쓰기 금지:** 이식 기간에 같은 PAPER 상태를 두 런타임이 동시에 쓰지 않아요. BOR PAPER는 **shadow**로 돌리면서 BOT 결과와 비교만 해요.

### 8.2 순서 (의존 순)

| 단계 | 이식 대상 | 완료 기준 |
|---|---|---|
| M0 ✅ | 저장소 골격: 기존 BOR 코드를 `src/intelligence/{evidence,research,report}`·`src/runtime`으로 이동, 도메인 경계 테스트, CI 테스트 누락 방지 | 기존 BOR 테스트 101건 + 경계 테스트 2건 통과, 런타임 응답 동일 |
| M1 🔶 | `src/foundation`: canonical data, PIT, Decision Run, Version Registry, event ledger, lineage | BOT 원본 테스트 통과 + BOR 영속 저장 |
| M2 | `services/nars` + NARS consumer + Evidence 통합(BOR evidence 계약 기준) | v4 shadow 입력 → BOR Evidence 저장 |
| M3 | Forecast + **Forecast History**(CT-01 수정, immutable writer/reader) | write → restart → readback, 반례 fixture 통과 |
| M4 | `src/strategy`·`risk`·`paper`·`evaluation`. 이때 `src/runtime/runtime.ts`의 `findForbiddenTradingEnvironment`를 "PAPER 전용 변수만 허용"으로 좁혀요 | **동일 입력 → BOT와 동일한 판단과 원장 결과**(shadow 비교 7일) |
| M5 | `web/` 새 IA (§5) | §1.3 S4 사용성 과제 통과 |

### 8.3 BOT 아카이브 조건

1. M4 shadow 비교에서 의미 있는 불일치 0건(7일)
2. BOR에서 PAPER 기록, 원장, Replay 조회 가능
3. Claude가 판단(§11 위임) → BOT Railway 서비스 중지 → BOT repo `archived` + README에 이전 안내

아카이브 전까지 BOT `main`은 **버그 수정만** 받아요.

> ⚠️ **2026-10-03 점검:** BOT PAPER 런타임은 2026-09-29 20:30 UTC부터 멈춰 있어요(Railway 앱 404). M4의 "BOT와 7일 shadow 비교"는 Railway 복구 여부가 확인될 때까지 보류예요. 자세한 내용은 [런타임 점검 기록](runtime/2026-10-03-RUNTIME_HEALTH_AUDIT.md) F1이에요.

---

## 9. 빌드 순서: Walking Skeleton 우선

Frozen §13(Foundation → Decision Engine → Experience)을 따르되, **한 자산으로 처음부터 끝까지 먼저 관통**해요.

```text
[1 자산] NARS Event ─► Evidence ─► Research/Council(한국어) ─► Forecast(호라이즌별)
            ─► Forecast History(불변) ─► Daily Report v(n) + diff v(n-1) ─► 종목 페이지
                                     └─► Strategy ─► Hard Risk ─► PAPER / NO_TRADE ─► 원장
```

- **기준 자산: SK하이닉스(000660) 하나**예요(D-3 확정). 가격 입력은 BOT `server/trading/equity`의 KIS·KRX·Naver adapter를 써요(분류표 #14). 크립토(BTC)는 M4에서 PAPER를 이식할 때 Upbit 데이터로 추가해요. 그래야 Decision Universe(주식+크립토, Decision Log §28-2)를 Alpha 전에 둘 다 덮어요.
- 이 골격이 감사 보고서의 C1(History 계약) → C2(History writer/reader) → C3(Golden Trace)에 해당해요.
- 골격이 돌아간 뒤에 자산 수를 넓혀요(관심 종목 10개 안팎).

---

## 10. Alpha 정의와 새 일정

### 10.1 범위

| 구분 | 항목 |
|---|---|
| **필수 (Alpha)** | 매일 자동 리포트 + 어제 대비 변화 · 차트 우선 종목 페이지 + 스탠스 게이지 + 왜?(찬반 근거) · Forecast History와 예측 vs 실제 · Golden Trace · PAPER 판단과 `NO_TRADE` 원장 · Hard Risk 최소 계약 · 초대제 로그인 · 비밀값 경계 · 상태 배지 |
| **Alpha 이후** | Globe 고도화(Alpha는 정적 마커) · Contextual AI Chat · Temporary Analysis · Alert 체계 · Lab/Champion 상세 화면 · Strategy 이력 레이어 · Oracle Edu 심화 · 유료 결제 · Community |
| **제거·재검토** | PR #254 AI 직원 생애주기·직급·연차(DEC 없음, Alpha 가치와 무관) · README의 LIVE_CANARY 준비 · Alpha 필수 조건인 72시간 soak(48시간 soak + 모니터링으로 대체 제안) |

### 10.2 일정 (확정)

전제: 설계·구현·검증은 Claude가 해요(§11). 하루 1~2개 PR 단위로 진행해요.

| 기간 (2026) | 단계 | 산출물 |
|---|---|---|
| 10/2 ✅ | **N0 승인 + M0** | North Star 승인, D-1~D-8 확정, BOR 도메인 폴더 골격·경계 테스트·CI |
| 10/3 – 10/9 | C1 + M1 시작 | History 계약 CT-01 수정, foundation 이식 착수 |
| 10/10 – 10/16 | M1 + M2 | foundation 이식, NARS v4·Evidence 통합 |
| 10/17 – 10/23 | M3 + Skeleton | Forecast History, SK하이닉스 Golden Trace, Daily Report diff |
| 10/24 – 11/6 | M4 ∥ M5 | 판단·PAPER 이식(shadow 비교 시작) ∥ 새 웹앱 홈·종목·리포트 |
| 11/7 – 11/13 | 확장·QA | 자산 확대, Golden Trace 반례 7종, 48h soak, 사용성 과제 |
| 11/14 – 11/17 | 릴리스 준비 | 초대제 인증, 비밀값 점검, 테스터 패키지 |
| **11/18 (수)** | **Closed Alpha 시작 (확정)** | 테스터 8~12명, 5일 운영(Tracker "Alpha Tester" 시트) |

- **위험 버퍼:** M4 shadow 비교에서 불일치가 나오면 최대 1주 지연될 수 있어요 → **11/25**.
- **결정:** Closed Alpha 시작일 **11/18** (2026-10-02 한서님, D-2).

---

## 11. 권한 위임과 검증

### 11.1 권한

2026-10-02 한서님이 **"Claude가 모든 권한을 가진다"** 고 지시했어요. 범위를 확인하자 "모두 다"라고 답했어요. 그래서 이 프로젝트에서는 Claude가 아래를 직접 해요.

- 설계와 제품·기술 결정(이 문서와 결정 기록 갱신 포함)
- 구현, 리팩터링, 테스트
- PR 머지
- 배포와 인프라 변경(계정 접근 권한이 주어지는 범위 안에서)
- LIVE 관련 결정까지 포함

헌법 §3에 따라 "한서님의 현재 명시적 지시"가 가장 우선이에요. 그래서 헌법 §4.1의 모델별 역할 분담(IAN = 설계·통제·QA, Claude = 구현)은 **이 프로젝트에서 이 위임으로 대체**돼요. 역할 이전 패키지, 운영대장 정합화 큐(Q-0001/0002) 같은 IAN 경유 절차는 더 이상 진행을 막는 조건이 아니에요.

### 11.2 그래도 지키는 것

권한이 한 곳에 모였기 때문에 아래 **제품 안전 계약**은 오히려 더 엄격하게 지켜요. 이건 권한 제한이 아니라 제품의 정합성 조건이에요.

- Frozen §17 불변식: PIT 정합성, 불변 Decision Run, 검증 상태와 배포 상태 분리, AUTOTRADE 경계, 실행 상태 무결성
- Hard Risk는 우회할 수 없어요.
- 비밀값은 프론트엔드·프롬프트·저장소에 들어가지 않아요.
- LIVE 활성화는 Alpha 범위 밖이에요. 하게 되면 그때 별도의 결정 기록과 활성화 절차를 거쳐요.
- 되돌리기 어려운 작업(데이터 삭제, 운영 DB migration, 서비스 중지)은 실행 전에 롤백 경로를 문서로 남겨요.

### 11.3 검증 방식 (작성자와 검증자 분리를 대체)

| 변경 종류 | 필요한 검증 |
|---|---|
| 모든 코드 변경 | typecheck, build, 전체 테스트, CI 초록 |
| 공개 계약, 도메인 경계, 데이터 계약 | 위 항목 + `/code-review` 자체 리뷰 + 반례 테스트 |
| PAPER 상태, Hard Risk, migration, 비밀값, 배포 | 위 항목 + 별도 검증 단계(shadow 비교, 롤백 리허설, 배포 후 헬스 확인)의 결과를 PR에 기록 |
| 문서 | 링크와 참조 경로 확인 |

같은 사실을 여러 문서에 반복해서 쓰지 않고, 정본에 링크해요(헌법 §9).

---

## 12. 결정 기록 (2026-10-02)

| ID | 결정 | 확정 내용 | 결정자 |
|---|---|---|---|
| D-1 | BOR의 "거래 권한 없음 / BOT 독립" 원칙을 §4.2의 **모듈·배포 경계**로 대체 | 승인. 함께 **Claude 전권 위임**(§11) | 한서님 |
| D-2 | Closed Alpha 시작일 | **2026-11-18** (내부 버퍼 11/25) | 한서님 |
| D-3 | Walking Skeleton 기준 자산 | **SK하이닉스 하나**. BTC는 M4에서 추가 | 한서님 |
| D-4 | Firebase 처리. 레거시 데스크톱 "oracle" 프로토타입(`App`, `store.tsx`, `server.ts`)만 사용하고, 운영 데이터는 모두 Supabase에 있음 | 이식하지 않음. 새 웹앱 인증은 Supabase Auth(초대제)로 하고, Firebase 프로젝트는 접근을 막은 뒤 BOT와 함께 아카이브 (`firestore.rules`가 사실상 전체 공개) | Claude (위임) |
| D-5 | PR #254 (AI 직원 생애주기) | Alpha 이후로 보류(close가 아니라 draft 유지) | Claude (위임) |
| D-6 | Tracker v2의 S2~S7 일정 | North Star §10이 일정 기준을 대체. Tracker는 역사 기록 | Claude (위임) |
| D-7 | 72시간 soak | 48시간 + 모니터링으로 대체 | Claude (위임) |
| D-8 | Alpha 유료 결제 | 없음. 깊이 차등은 플래그로만 준비 | Claude (위임) |

---

## 13. 다음 구현 작업

1. ✅ **M0 골격:** BOR 코드를 도메인 폴더로 재배치(동작 불변), 경계 테스트, CI 테스트 누락 방지.
2. ✅ **C1 History 계약 수정:** [Forecast History Contract v2](contracts/FORECAST_HISTORY_CONTRACT_V2.md)와 참조 구현 `src/intelligence/forecast/forecastHistory.ts`. 실제로 소비한 근거 리비전을 반드시 묶고, CT-01 반례 테스트를 포함해요(2026-10-03).
3. 🔶 **M1 foundation 이식:** 1차로 순수 계약 모듈(`canonicalData`, `decisionRunVersionRegistry`, `eventEvidenceLineage`, `marketAssetGraph`, `sharedEvaluation`, `legacyFoundationAdapters`)과 테스트 45건, 이벤트 원장 타입을 `src/foundation`에 옮겼어요(내용 동일, import 경로만 변경, 2026-10-03). 2단계로 이벤트 원장 저장 계약·참조 구현·Supabase REST adapter를 `src/foundation/ledger`에 옮겼어요(잘못된 시각은 "지금"으로 바꾸지 않고 거부). 남은 것: 도메인별 projection(분류표 #3, 해당 도메인 이식 때 함께).

각 PR은 이 문서의 해당 절(§8.2 M0 등)을 근거로 인용해요.

---

## 부록 A. 출처

| 자료 | 위치 |
|---|---|
| 인터뷰 원본 (2026-09-23) | Drive "제목 없는 문서" `1cHxSC2DzT0Y17OWryYvkfG_sw4Gq08uVtDg1dfc2tow` |
| Product Rebuild Decision Log | Drive `1IKfcHjY6x32BeAzbL34BzCH2VRDdglzfuiax0AT-AaE` (D-001~005, §24, §26, §28, §29, §30) |
| Frozen v1 | BOT `docs/architecture/BLACK_ORACLE_CANONICAL_FROZEN_V1.md` @ `a19be54c` |
| HANUL AI TEAM Constitution v1.1 | Drive `1B2avSg2r-KAB46tWVETNudBi5iAAl-vo5kHOpit6Me4` |
| 기술 인수인계 감사 보고서 (2026-10-02) | Drive `1XlPD9fubBaxrfzf1VLkwn9DLTSSgW08maCwZFFRlUDg` |
| 역할별 맥락 이전 패키지 (2026-10-01) | Drive: PRODUCT·RESEARCH·DESIGN·ENGINEERING·QUANT·QA `*_CONTEXT_MIGRATION_2026-10-01.md` |
| Alpha Master Execution Tracker v2 | Drive `13kF-f4tjk667GNSLnhDvlEr0cRu-Elrrmtzmdjqtyhg` |
| NARS v3.0.1 | Drive `12ahntzgvwcC3URyrok6Rkg2MD1Rq_QjjXyRihydxs-A` |
| NARS v4 | BOT `services/nars/README.md` |
| UI 문서 | BOT `docs/design/design-system.md`, `docs/BLACK_ORACLE_UI_V11.md`, `docs/design/mockups/mobile-v1/` |
| R&D 원장 | BOR `docs/research/research-ledger/ledger.md`, BOT `docs/research/research-ledger/ledger.md` |
| BOR 런타임 | BOR `docs/runtime/FOUNDATION_DEPLOYMENT_RUNBOOK.md`, `docs/architecture/RUNTIME_BOUNDARY.md` |
