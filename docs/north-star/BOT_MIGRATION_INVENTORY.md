# BOT → BOR 이식 분류표

| 항목 | 값 |
|---|---|
| 상태 | **APPROVED** (2026-10-02) · [North Star](../NORTH_STAR.md) §8의 부속 문서 |
| 기준 | `hanul442/black_oracle_bot` @ `a19be54c` (2026-10-02), 정적 import 그래프 + 테스트 수 집계 |
| 분류 | **KEEP** 그대로 이식 · **MODIFY** 구조나 계약을 맞춰 이식 · **DELETE** 이식하지 않음(BOT 아카이브와 함께 보존) · **POSTPONE** Alpha 이후 |
| 단계 | North Star §8.2의 M0~M5 |

## 1. 현재 BOT 런타임 연결 (요약)

- **운영 (Railway):** `npm start` → `dist/gateway.cjs`(`railway-gateway.ts`)
  - `api/*` 핸들러를 같은 프로세스에서 실행해요.
  - `dist/server.cjs`(레거시 `server.ts`)를 자식 프로세스로 띄우고 나머지 요청을 프록시해요.
  - 무거운 런타임은 `server/trading/runtime-bundle.mjs`(esbuild)를 동적으로 import해요.
- **로그인:** 게이트웨이 자체의 운영자 HMAC 로그인이에요. Firebase를 쓰지 않아요.
- **화면:** `src/main.tsx` → `ResponsiveRoot`
  - 1024px 미만: `BlackOracleMobileAppV11_1`
  - 1024px 이상: 레거시 데스크톱 `App`(Firebase 기반 "oracle" 프로토타입)
- **LLM:** OpenAI Responses API(SDK 없이 `fetch`), 비용은 `server/aiUsageLedger.ts`가 Supabase에 기록해요. Gemini(`@google/genai`)는 개발용 `server.ts`에만 있고, Railway 빌드에서 OpenAI로 치환돼요.
- **데이터:** Supabase가 운영 기록의 원본이에요. Firebase(Firestore)는 레거시 데스크톱 프로토타입 전용이고, 두 저장소가 함께 쓰는 데이터는 없어요.
- **테스트:** 124개 파일. `src/trading` 263건, `server/trading` 111건, `server/foundation` 45건, ledger·replay 36건, NARS 21건, scripts 12건.
  - ⚠️ `npm run test:trading`이 `server/decisionReplay.test.ts`, `server/trading/equity/*.test.ts`, `scripts/*.test.mjs`를 실행하지 않아요 → 이식할 때 바로잡아요.

## 2. 분류표

| # | BOT 경로 | 역할 | 도메인 | 테스트 | 분류 | 이식 위치 | 단계 | 비고 |
|---|---|---|---|---|---|---|---|---|
| 1 | `server/foundation/*` | PIT data envelope, Decision Run·Version Registry, event→evidence lineage, asset graph, shared evaluation, legacy adapter | F | 8 / 45 | **KEEP** | `src/foundation` | M1 ✅ (2026-10-03) | 런타임에서 아직 쓰지 않지만 계약 완성도가 높아요. `bor.alpha-read-model.v1` adapter를 이미 갖고 있어요 |
| 2 | `server/eventLedger.ts`, `eventLedgerHealth`, `eventLedgerLineage`, `canonicalSourceHealth` | canonical event ledger | F | 10 / 36 (3·4 포함) | **KEEP** | `src/foundation/ledger` | M1 ✅ (2026-10-03, 저장 adapter·조회) | Supabase 접근 계층은 저장소 adapter로 분리 |
| 3 | `server/eventLedger*Projection*.ts` | 도메인 출력 → canonical event | F | 위와 공유 | **MODIFY** | 각 도메인 패키지의 `projection/` | M1~M4 | 도메인별로 나눠 해당 단계에서 이식 |
| 4 | `server/decisionReplay.ts`, `instrumentDecisionLineage.ts`, `eventLedgerForecastCalibration.ts` | replay, 종목별 계보, 예측 보정 | F / B / D | 위와 공유 | **MODIFY** | `src/foundation/replay`, `src/evaluation` | M1, M3 | 게이트웨이에 연결되지 않은 상태. Forecast History(M3)와 합침 |
| 5 | `server/aiUsageLedger.ts`, `server/openaiCompat.ts` | LLM 비용 원장, OpenAI adapter | F / OPS | 있음 | **KEEP** | `src/foundation/llm` | M2 | 공급자 중립 interface로 감싸기 |
| 6 | `server/market/lseMarketData.ts` | LSE 캔들 | F (시장 데이터) | 있음 | **POSTPONE** | — | — | 해외 데이터는 Alpha 이후 |
| 7 | `server/trading/aiCouncil{Adjudicator,AuditPacket,CostGate}`, `councilCounterfactual`, `councilProspectiveEvaluation` | LLM Council 심의, 감사 패킷, 비용 게이트, 평가 | B Council (+D) | 있음 | **MODIFY** | `src/intelligence/council`, `src/evaluation` | M2~M3 | BOR `researchCouncil` 계약과 통합. **사용자 표시는 한국어 문장**(North Star §3-5) |
| 8 | `server/trading/narsConsumer`, `narsCoverageAcquirer`, `externalEvidenceSource`, `evidenceStore`, `evidenceCoverageQueue` | NARS 소비, 종목 매핑, 영향 분석, 근거 저장 | B | 있음 | **MODIFY** | `src/intelligence/{nars-consumer,evidence}` | M2 | 근거 저장은 BOR `evidence`·`sqlEvidenceStore` 계약을 기준으로 하나로 합침 |
| 9 | `server/trading/strategyFactoryRunner`, `strategyHypothesisResearcher`, `strategyShadowPool`, `strategyExperimentLedger` | 전략 팩토리, LLM 가설, shadow pool, 실험 원장 | C / D | 부분 | **MODIFY** | `src/strategy/factory`, `src/evaluation` | M4 | runner·ledger 테스트 추가 필요. Q-005 탐색 기록(search provenance) 반영 |
| 10 | `server/trading/paperLoop`, `paperSession`, `checkpointPolicy`, `persistence`, `runtimeState`, `runtimeLease`, `runtimeProfile`, `runtimeAuthority`, `runtimeIntegrity` | PAPER 루프·세션, 체크포인트, lease, 런타임 권한 | E | 있음 (lease 없음) | **KEEP** | `src/paper`, `src/runtime/scheduler` | M4 | **행동 보존 + shadow 비교 대상.** lease 테스트 추가 |
| 11 | `server/trading/botRiskExecutionBoundary`, `canonicalOrderIntent` | Risk→Execution 경계, 멱등 주문 의도 | E | 있음 | **KEEP** | `src/risk`, `src/paper` | M4 | Frozen §17.5 요구사항 그대로 |
| 12 | `server/trading/routes`, `runtimeHealth`, `marketDataFreshness` | 독립 트레이딩 서버 라우트·헬스 | E / OPS | 부분 | **MODIFY** | `src/runtime` | M4 | 신선도 검사(freshness)는 KEEP, Express 라우트는 새 API로 재작성 |
| 13 | `server/trading/upbitPublic`, `universe`, `microstructure`, `multiTimeframe`, `marketDataProvider`, `instrumentAliasRegistry`, `kisReadiness` | Upbit·KIS 시세, 유니버스, 별칭 | F (시장 데이터) | 있음 | **KEEP** | `src/foundation/market-data` | M1~M2 | Walking Skeleton(BTC, SK하이닉스)의 가격 입력 |
| 14 | `server/trading/equity/*` | 국내주식 데이터(KIS·KRX·Naver·Yahoo), shadow 리서치, equity PAPER | F / B / E | 1 / 2 | **MODIFY** | `src/foundation/market-data/kr`, `src/paper/equity` | M2, M4 | 테스트가 부족해서 이식할 때 adapter별 테스트 추가가 필요해요. **M2 🔶 KRX 공식 EOD 일봉 이식**(`src/foundation/market-data/kr/krxDailyBar.ts`, 2026-10-03): SK하이닉스 OHLCV, `availableAt`(18:00 KST) 기준 시점 조회. KIS·Naver·Yahoo·equity PAPER는 남음 |
| 15 | `server/trading/runtimeBundleEntry.ts`, `runtime-bundle.mjs` | esbuild 번들 | OPS | — | **DELETE** | — | — | workspaces 구조에서는 필요 없어요 |
| 16 | `src/trading/council*`, `governanceArbiter`, `investmentCommittee`, `decisionTrace` | 결정론적 Council, 헌법, Arbiter, 판단 추적 | B Council | 있음 | **MODIFY** | `src/intelligence/council` | M2~M3 | #7과 합침. `decisionTrace`는 foundation의 Decision Run과 연결 |
| 17 | `src/trading/evidence`, `evidenceCoverage`, `evidenceForecast`, `technicalEvidence`, `monteCarlo`, `outcomeAttribution` | 근거 점수, 예측, 몬테카를로, 귀속 | B / D | 있음 | **MODIFY** | `src/intelligence/{evidence,forecast}`, `src/evaluation` | M2~M3 | 의미 계약 4축 분리(Frozen §4)에 맞춰 조정 |
| 18 | `src/trading` 신호군(`indicators`, `regime`, `marketState`, `trendMomentum`, `signalFusion` 등) | 지표, 레짐, 신호 결합 | C | 있음 | **KEEP** | `src/strategy/signals` | M4 | 종목 페이지 지표와 공유 |
| 19 | `src/trading/strategyFactory*`, `autonomousStrategyFactory`, `strategyRouter`, `horizonPolicy`, `championChallengerRouter`, `strategyValidationBinding`, `validationExperiment`, `validationStageResult` | 전략 생성, 백테스트, 라우팅, 검증 단계 | C / D | 있음 | **KEEP** | `src/strategy`, `src/evaluation` | M4 | Champion 2~3개 운영(Frozen §2C)에 맞춰 설정 |
| 20 | `src/trading` 리스크·실행군(`risk`, `positionSizing`, `preTradeReview`, `executionPolicy`, `protection*`, `paperBroker`, `paperPortfolio`, `ledger`, `performance`, `tradeMap`, `equity*Policy`, `assetPolicy`, `assets`, `config`, `types`, `authorityMode`) | Hard Risk, 포지션 크기, 보호, PAPER 브로커 | E | 있음 | **KEEP** | `src/risk`, `src/paper` | M4 | 의미 변경 금지, shadow 비교 대상 |
| 21 | `src/trading/paperProtection*`, `canonicalPaperEvent*` | PAPER 보호 진단, replay, 기준선 검증 | D / OPS | 있음 | **KEEP** | `src/paper/diagnostics` | M4 | shadow 비교 도구로 활용 |
| 22 | `src/trading/upbit*` (7개) | 차세대 Upbit 유니버스 수집기·저장소 | F | 있음 | **KEEP** | `src/foundation/market-data/upbit` | M2 | 런타임 연결 전이지만 테스트가 있어요 |
| 23 | `src/trading/investmentCycle*`, `horizonTradePlan`, `horizonPositionIdentity`, `largeParticipantFootprint`, `participantFlowFootprint`, `timeframeAggregation`, `liveCanaryReadiness`, `runtimeOwnership` | 투자 사이클 read model, 호라이즌 계획, 수급 흔적, LIVE canary | C / E / F | 대부분 있음 | horizon*: **KEEP** · footprint·aggregation: **POSTPONE** · `liveCanaryReadiness`: **DELETE** | `src/strategy/horizon` | M4 | LIVE는 Alpha 범위 밖 |
| 24 | `src/mobile/BlackOracleMobileApp.tsx` → `V11_1`, `CanonicalDecisionReplayPanel`, `v11/marketIdentity`, `v2/{types,financial,PortfolioEquityChart}`, `v9/{instrument,IntegratedMarketChart,PositionSummary}` | **현재 운영 중인 모바일 앱** | A | 0 | **MODIFY (컴포넌트만)** | `web/components` | M5 | 앱 shell은 새 IA로 재작성(North Star §5). `IntegratedMarketChart`, `PortfolioEquityChart`, replay 패널은 재사용 후보 |
| 25 | `src/mobile/{ObservabilityRestore,PositionMonitor}.tsx` | 데스크톱 오버레이 | A | 0 | **MODIFY** | `web` 시스템 화면 | M5 | |
| 26 | `src/mobile/BlackOracleMobileAppV2`~`V11` (13개), `v2/{AnalysisDetailV2,…}`, `v4/`, `v5/`, `v10/` | 이전 앱 버전 | LEGACY | 0 | **DELETE** | — | — | 어디서도 import하지 않음 |
| 27 | `src/App.tsx`, `src/store.tsx`, `initialData.ts`, `types.ts` | 데스크톱 shell + Firebase "oracle" 상태 | A (레거시 프로토타입) | 0 | **DELETE** | — | — | Firebase 익명 인증 + Firestore. 운영 기록과 무관 |
| 28 | `src/views/*` | 데스크톱 화면(절반은 Firebase 기반) | A | 0 | **DELETE**(Firebase 화면) · Operations·Strategies·UnifiedLog·CommandCenter: **참고용** | — | M5 | 새 `web`에서 필요할 때 참고 |
| 29 | `views/{MobileNexus,OracleFeed,Watchlist}View`, `components/{BottomNav,MobileNavigation}`, `src/data/flowMock.ts`, `src/lib/utils.ts`, `src/services/mockCollectors.ts` | 사용되지 않음 | LEGACY | 0 | **DELETE** | — | — | |
| 30 | `src/components/*` (나머지 12개) | 데스크톱 UI 부품 | A | 0 | **DELETE** · `ProbabilityGauge`, `SmoothTrendChart`: **참고용** | — | M5 | 스탠스 게이지를 설계할 때 참고 |
| 31 | `src/vendor/thinking-orbs/*` | 장식 애니메이션 | A | 0 | **DELETE** | — | — | North Star §5.4 "장식 금지" |
| 32 | `api/*` (게이트웨이에 연결된 핸들러) | HTTP 핸들러 | 혼합 | 0 | **MODIFY** | `src/runtime/routes` | M2~M5 | 도메인 패키지 위의 얇은 read API로 재작성 |
| 33 | `api/{decision-replay,instrument-cockpit,nars-status,openai-status,v10-readiness}` | 게이트웨이에 연결되지 않음 | A / OPS | 0 | decision-replay·instrument-cockpit: **MODIFY** · 나머지: **DELETE** | `src/runtime/routes` | M3~M5 | 종목 페이지와 Replay의 원천 |
| 34 | `server.ts` (779줄) | 레거시 oracle 백엔드(Firebase, RSS, 브리핑) | LEGACY | 0 | **DELETE** | — | — | `/api/clear-db` 같은 위험한 라우트 포함 |
| 35 | `services/nars/src/*`, `wrangler.jsonc`, `test/` | NARS v4 수집기(Worker) | B | 5 / 21 | **KEEP** | `services/nars` | M2 | BO-S1-002 계약 포함 |
| 36 | `services/nars/supabase/functions/*` (10개) | NARS edge functions | B | 0 | **KEEP** | `services/nars/supabase/functions` | M2 | 테스트 추가 필요 |
| 37 | `services/nars/supabase/migrations/*` (38개) | `nars_*` 스키마 | B | — | **KEEP** | `services/nars/supabase/migrations` | M2 | migration 계보 유지(재작성 금지) |
| 38 | `services/nars/*.md`, `services/nars/docs/*` | N4 설계 문서 | B | — | **KEEP** | `services/nars/docs` | M2 | |
| 39 | `supabase/functions/black-oracle-{native-paper-shadow,paper-scheduler,runtime-status}` | PAPER 스케줄러, lease, 상태 | E / OPS | 일부 | **MODIFY** | `src/runtime/scheduler` 또는 유지 | M4 | 전환 전까지 BOT 쪽이 계속 운영(이중 쓰기 금지) |
| 40 | `supabase/migrations/*` (19개) | 런타임, lease, ledger, 전략 팩토리 등 | F / E / B | — | **KEEP** | `db/migrations` (계보 병합) | M1 | 기존 운영 DB를 그대로 쓸지 새 프로젝트로 갈지는 M1 착수 때 결정(용량: DEC-0002) |
| 41 | `ops/*.json`, `ops/supabase/*.sql` | B0 기준선, 권한 매트릭스, 롤백 SQL | OPS | scripts 검증 | **POSTPONE** | `docs/runtime-truth` (역사 기록) | — | BOT 아카이브와 함께 보존 |
| 42 | `scripts/*` | Railway 빌드 패처, PAPER 보호 진단, B0 검증 | OPS | 6 / 12 | 진단: **KEEP** · 빌드 패처: **DELETE** | `scripts/` | M4 | |
| 43 | `public/*` | PWA manifest, 아이콘, 워드마크 | A | — | **KEEP** | `web/public` | M5 | 워드마크는 master asset 규칙 유지 |
| 44 | `patch.ts`, `patch_store.ts`, `test2.ts`, `clearDb.ts`, `test-rss.ts` | 일회성 스크립트 | LEGACY | 0 | **DELETE** | — | — | 어디서도 참조하지 않음 |
| 45 | `firebase-applet-config.json`, `firebase-blueprint.json`, `firestore.rules`, `metadata.json` | AI Studio Firebase 설정 | LEGACY | — | **DELETE** | — | — | `firestore.rules`의 `isSignedIn()`이 항상 true를 반환 → 아카이브 전에 Firebase 프로젝트 접근을 막는 것을 권장 |
| 46 | `vercel.json`, `railway.json`, `.github/workflows/*` | 배포·CI | OPS | — | **MODIFY** | 루트 CI (workspace별 job) | M0 | `test:trading`에서 빠진 테스트까지 포함 |

## 3. BOR에 이미 있는 것 (기반)

| BOR 모듈 | 역할 | 통합 후 위치 |
|---|---|---|
| `evidence.ts`, `evidenceStore.ts`, `sqlEvidenceStore.ts`, `sourceIngestion.ts`, `collectorCycle.ts` | 근거 스키마, provenance, 저장, 수집 | `src/intelligence/evidence` (BOT #8·#17의 기준 계약) |
| `researchPipeline.ts`, `researchCouncil.ts`, `thesisScenario.ts` | 리서치 번들, Specialist·Red Team·Council, Thesis·시나리오 | `src/intelligence/research`, `council` |
| `reportArtifact.ts`, `reportExport.ts`, `reportConsistency.ts`, `reportHtmlRenderer.ts`, `reportPdfManifest.ts` | 버전 관리되는 리포트, 내보내기, 일관성 검사 | `src/intelligence/report` |
| `alphaReadModel*.ts`, `alphaReadApi.ts`, `alphaReportPage.ts` | read model, 아카이브, 읽기 API | `src/runtime` + `src/intelligence/report` |
| `runtime.ts`, `httpRuntime.ts`, `start.ts`, `foundationRuntimeSeed.ts` | 런타임, 헬스, 버전 | `src/runtime`. ⚠️ `findForbiddenTradingEnvironment`는 D-1 승인 후 "PAPER 모듈에만 허용"으로 범위를 좁혀야 해요 |
| `db/migrations/0001_evidence_store.sql` | 근거 저장 스키마 | `db/migrations` |

현재 BOR은 테스트 24개 파일 / 101건이 통과해요(2026-10-02 확인). 런타임 의존성은 없어요.

## 4. 집계

| 분류 | 대표 |
|---|---|
| KEEP | foundation, ledger, PAPER·Risk, 신호·전략, Upbit·KIS 데이터, NARS v4, migrations |
| MODIFY | Council·Evidence 통합, Forecast calibration, API, 운영 중인 모바일 앱의 컴포넌트, CI |
| DELETE | 레거시 앱 버전 13개, Firebase oracle 스택(`App`, `store`, `server.ts`, views), 일회성 스크립트, 번들러, LIVE canary |
| POSTPONE | LSE 해외 데이터, 수급 흔적, ops 기준선 문서 |
