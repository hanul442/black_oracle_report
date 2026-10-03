# Forecast History Contract v2

| 항목 | 값 |
|---|---|
| 상태 | **ACTIVE** (2026-10-03) |
| 대체 | BOT `docs/contracts/FORECAST_HISTORY_CONTRACT_V1.md` (BO-S1-013) |
| 근거 | [North Star](../NORTH_STAR.md) §8.2 M3·§13-2 (C1), Frozen v1 §17.1 PIT 정합성·§17.2 불변 Decision Run |
| 구현 | `src/intelligence/forecast/forecastHistory.ts` (참조 구현), 테스트 `forecastHistory.test.ts` |
| 스키마 | `bor.forecast-history.v2` |

## v1 대비 바뀐 점 (CT-01 해결)

v1은 근거 리비전을 "가능하면(when available)" 기록하라고만 했어요. 그래서 리비전이 빠진 기록을 재구성할 때 **cutoff 이전의 최신 리비전**이 실제로 썼던 리비전을 대신 차지할 수 있었어요. 독립 QA는 이를 CT-01 FAIL로 판정했어요.

v2에서는 이렇게 바꿨어요.

1. 계보가 완전한(`COMPLETE`) 기록은 **실제로 소비한 근거마다 `evidenceId` + `revisionId` + `knownAt`을 반드시** 가져요. 하나라도 빠지면 쓰기가 거부돼요.
2. 리비전 정보가 없는 과거 기록은 `INCOMPLETE_LEGACY`로만 저장할 수 있어요. 이 기록은 이력 조회에는 나오지만 **시점 기준 재구성(`getAsOf`)에는 절대 쓰이지 않아요.**
3. 재구성은 저장된 리비전을 그대로 돌려줘요. 리비전을 다시 고르는 단계가 없어요.

## 1. 기록 (쓰기)

| 필드 | 규칙 |
|---|---|
| `forecastArtifactId`, `forecastRevisionId` | 불변 식별자. 같은 쌍으로 다른 내용을 쓰면 `FORECAST_REVISION_IMMUTABLE` |
| `assetId`, `kind` | `FAIR_VALUE` / `FUTURE_PRICE`는 서로 다른 종류로 유지 |
| `method` | `methodId`, `methodVersion`, `methodFamily` 필수 |
| `asOf` | 예측이 사용한 지식 경계 |
| `recordedAt` | 기록 시각. `asOf`보다 이를 수 없음(`RECORDED_BEFORE_AS_OF`) |
| `lineageState` | `COMPLETE` 또는 `INCOMPLETE_LEGACY` |
| `consumedEvidence[]` | 실제로 소비한 근거 리비전. `COMPLETE`면 각 항목의 `revisionId` 필수, `knownAt ≤ asOf` 필수. 같은 근거는 한 번만 |
| `availability` | `AVAILABLE` / `DEGRADED` / `UNAVAILABLE`. `AVAILABLE`이 아니면 사유 필수. `AVAILABLE`인 `COMPLETE` 예측은 근거가 1개 이상 |
| `horizonRef` | `FUTURE_PRICE`만 필수, `FAIR_VALUE`는 가질 수 없음 |
| `reliabilityRef` | 있으면 참조. 신뢰도는 방향 확률·전략 강도와 별개 |
| `componentVersions`, `payload` | 재현에 필요한 버전과 예측 값 |

BOR Evidence에서 `revisionId`는 `contentFingerprint`, `knownAt`은 `observedAt`이에요.

## 2. 조회 (읽기)

| 동작 | 의미 |
|---|---|
| `getById(artifactId, revisionId?)` | 정확한 리비전. 리비전을 생략하면 가장 늦게 기록된 리비전 |
| `getHistory(assetId, {from, to, kind})` | `asOf` 순서의 전체 이력. legacy 포함 |
| `getAsOf(assetId, cutoff, kind?)` | cutoff 시점에 보였을 예측. 조건: `COMPLETE`, `asOf ≤ cutoff`, `recordedAt ≤ cutoff` |
| `linkRealizedOutcome` / `getRealizedOutcomes` | 실제 결과는 별도로 연결. `observedAt > asOf` 필수, 예측 기록은 바뀌지 않음 |

## 3. 불변식

- 과거 예측은 제자리에서 바뀌지 않아요. 정정이나 새 방법은 새 리비전이에요.
- 시점 기준 재구성에 cutoff 이후에 알게 된 근거나 기록이 섞이지 않아요.
- 재구성은 그 시점에 실제로 쓴 방법 버전과 근거 리비전을 돌려줘요. 현재 버전으로 대체하지 않아요.
- 계보가 없으면 지어내지 않고 legacy로 표시해요.
- 이 계약은 Strategy, Risk, PAPER, LIVE 권한을 만들지 않아요.

## 4. 수용 테스트 (`forecastHistory.test.ts`)

| # | 경우 | 기대 |
|---|---|---|
| 1 | **CT-01 반례:** r1을 쓴 예측, cutoff 전에 r2가 알려졌고 r2를 쓴 리비전은 cutoff 뒤에 기록됨 | cutoff 재구성 결과는 r1 |
| 2 | `COMPLETE`인데 리비전 없음 | 거부 |
| 3 | `asOf` 이후에 알게 된 근거 | 거부 |
| 4 | `asOf` 이전 시각에 기록 | 거부 |
| 5 | 근거 없는 `AVAILABLE` 예측 | 거부 |
| 6 | 같은 자산의 예측 두 개 | 식별자 분리, `asOf` 순서 |
| 7 | cutoff 이후에 기록된 예측 | 시점 조회에서 제외 |
| 8 | 같은 리비전을 다른 내용으로 다시 씀 | 거부, 동일 재쓰기는 멱등 |
| 9 | FAIR_VALUE와 FUTURE_PRICE 공존 | 서로 섞이지 않음, horizon 규칙 강제 |
| 10 | 실제 결과 연결 | 예측 불변, `asOf` 이전 결과 거부 |
| 11 | legacy 기록 | 이력에는 나오고 시점 조회에는 안 나옴 |
| 12 | 저장 후 원본·반환값 수정 | 저장본은 안쪽까지 얼어 있음 |
| 13 | 키 순서만 다른 동일 기록 재쓰기 | 멱등 |
| 14 | 실제 결과 목록을 반환값으로 수정 | 불가 |
| 15 | 기록 시각이 같은 리비전 | 결과가 쓰기 순서와 무관 |

## 5. 남은 일 (M3)

- 이 계약을 지키는 영속 저장소 adapter(Postgres)와 "쓰기 → 재시작 → 읽기" 테스트.
- Forecast 생성기가 근거를 읽을 때 리비전을 함께 넘기도록 연결.
