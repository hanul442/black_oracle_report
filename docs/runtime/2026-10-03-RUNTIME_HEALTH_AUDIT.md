# 런타임 점검 기록 — 2026-10-03

| 항목 | 값 |
|---|---|
| 대상 | Supabase 프로젝트 `black_oracle` (`dzbsxxoumlylyfhtmjnk`, us-east-1, Postgres 17) |
| 방법 | Supabase 커넥터로 읽기 전용 조회. 수정은 아래 "조치"에 적힌 BOT migration 4건뿐 |
| 기준 | [North Star](../NORTH_STAR.md) §8(통합 계획), §11.2(되돌리기 어려운 작업 전 롤백 기록) |
| 접근하지 못한 것 | Railway, Cloudflare (이 세션에 연결되지 않음) |

## 1. 요약

| # | 발견 | 심각도 | 상태 |
|---|---|---|---|
| F1 | **모든 PAPER 런타임이 2026-09-29 20:30 UTC 이후 멈춤.** Supabase 스케줄러가 호출하는 Railway 앱 2개가 `404 Application not found`를 돌려줌 | 높음 | 열림 (Railway 접근 필요) |
| F2 | NARS 근거 매칭(`nars-primary-evidence-match-10m`)이 **2026-09-09 이후 한 번도 성공하지 못함** (24시간 동안 143회 시간 초과) | 높음 | **해결** (00:17 UTC 성공, 43초) |
| F3 | NARS 캘리브레이션(`nars-calibrate-hourly`)이 매시간 시간 초과 (24/24 실패) | 중간 | **일시 중지** (최적화 전까지, F6) |
| F4 | DB 용량 619 MB. 가장 큰 두 테이블은 지우지 않는 감사 원장임 | 중간 | 열림 (요금제 확인 필요) |
| F5 | 자동 근거 연결이 비슷한 정기 공시끼리 묶이는 경우가 있음 | 낮음 | 품질 과제로 기록 |
| F6 | **02:30 UTC 무렵부터 DB 자원 고갈.** 한 행 조회 14~23초, cron `job startup timeout`, SQL 연결 약 1시간 불가 | 높음 | 부하 감축 적용, 회복 관찰 중 |

## 2. 세부 내용

### F1. PAPER 런타임 중단

- `black_oracle_trading_scheduler_config`에서 활성화된 두 런타임의 마지막 호출 결과:

  | runtime_id | 대상 호스트 | 마지막 응답 |
  |---|---|---|
  | `black-oracle-paper` | `black-oracle-web-production` | 404 `Application not found` |
  | `black-oracle-paper-vnext-100m-v03-m4` | `black-oracle-paper-vnext-production` | 404 `Application not found` |

- `black_oracle_events`에 기록된 마지막 PAPER 이벤트:
  - `black-oracle-paper-vnext-100m-v03-m4`: 2026-09-29 20:30:58 UTC
  - `black-oracle-paper`: 2026-09-29 20:30:17 UTC
  - 최근 24시간 동안 기록 0건
- `Application not found`는 Railway 서비스나 도메인이 없어졌을 때의 응답이에요. 요금제 만료, 서비스 삭제, 도메인 변경을 의심하지만, Railway 접근 권한이 없어서 **원인은 확인하지 못했어요.**
- 스케줄러 cron 3개(`black-oracle-paper-scheduler-15m`, `black-oracle-paper-vnext-v03-m4-scheduler-15m`, `black-oracle-native-shadow-15m`)는 계속 "성공"으로 기록돼요. cron 자체는 정상 실행되고, 호출 대상이 404를 돌려줄 뿐이라 cron 상태만 봐서는 장애를 알 수 없어요.

**North Star에 주는 영향**
- §8은 "BOR 쪽 동작이 검증될 때까지 기존 BOT PAPER 런타임 유지"와 "M4에서 BOT와 7일 shadow 비교"를 전제로 해요. **지금은 비교할 BOT 런타임이 돌고 있지 않아요.**
- 두 가지 선택지가 있어요.
  1. Railway를 복구해서 BOT PAPER를 다시 돌린다.
  2. 복구하지 않고, M4에서 BOR PAPER를 저장된 PAPER 상태와 과거 원장 replay로 검증한다.
- 결정하려면 먼저 Railway에서 원인을 확인해야 해요.
- 그 전까지 9/29 20:30 이후 기간은 PAPER **데이터 공백**으로 기록해요(North Star §5.3 상태 표기).

### F2. 근거 매칭 작업 (해결)

- **원인 1: 반복 계산.** 이벤트 500개와 근거 자료 1,818개를 모든 쌍(약 87만 쌍)으로 비교하면서, 쌍마다 두 제목을 4번씩 다시 토큰화했어요.
- **원인 2: 불필요한 쓰기.** 계산이 빨라져도 매번 약 14만 행을 다시 썼어요. 그중 86%는 "공시 발행사가 기사 제목에 없음"(`DART_ISSUER_MISSING`) 하드 규칙으로 자동 탈락한 쌍이었어요.
- **조치:**
  - [`20261003000000_nars_v4_matching_performance.sql`](https://github.com/hanul442/black_oracle_bot/blob/claude/busy-ramanujan-yrcmb7/services/nars/supabase/migrations/20261003000000_nars_v4_matching_performance.sql): 제목을 한 번만 토큰화하고, 이벤트 제목에 trigram 인덱스를 추가
  - [`20261003001000_nars_v4_primary_match_write_reduction.sql`](https://github.com/hanul442/black_oracle_bot/blob/claude/busy-ramanujan-yrcmb7/services/nars/supabase/migrations/20261003001000_nars_v4_primary_match_write_reduction.sql): 하드 규칙 탈락 쌍은 새로 저장하지 않고(양성 대조군은 예외), 값이 바뀐 행만 다시 써요
- **동일성 검증:** 공유 토큰이 1~17개인 저장 후보 2,000쌍에서, 새 계산식의 공유 토큰 수와 Jaccard가 기존 함수 및 저장된 값과 **모두 일치**했어요.
- **결과:** 00:17 UTC 실행이 43초에 성공했어요. 밀린 3주치가 처리되면서 AUTO_LINK 945건, REVIEW 1,001건, 이벤트 근거 링크 620건, claim 근거 링크 2,117건이 새로 생겼어요.
- **지표 변화:** `nars_primary_evidence_match_metrics_v1.total_candidates`는 이제 하드 규칙 탈락 쌍만큼 늘지 않아요. AUTO/REVIEW/양성 대조군 수는 영향이 없어요.
- **롤백:** 각 migration 파일 머리말에 적어 두었어요.

### F3. 캘리브레이션 작업

- **원인:** 최근 7일 이벤트 가운데 24시간 안에 들어오는 모든 쌍(약 670만 쌍)을 trigram 유사도로 비교했어요.
- **조치:** 같은 migration에서 쌍 탐색이 trigram 인덱스를 쓰도록 바꿨어요. 유사도 0.20 조건은 그대로라서 후보 집합은 같아요.
- **측정:** 쌍 탐색 26초, 준비 상태 뷰 2.7초, 검토 큐 뷰 0.5초.
- 00:07 UTC 실행은 여전히 시간 초과였어요. 같은 시각에 돌던 근거 매칭 작업이 CPU를 차지했던 것으로 보여요. 근거 매칭이 가벼워졌으니 **01:07 UTC 실행으로 확인**해요.
- **이후:** 01:07, 02:13 UTC 실행도 실패했어요. 실행 시각을 13분으로 옮겼지만(`20261003002000`) 준비 상태 뷰 `nars_cutover_readiness_v1`에서 2분 제한에 걸렸어요. 부하 상황에서는 쌍 탐색 단독 실행도 58초 안에 끝나지 않았어요.
- **현재:** F6 때문에 **일시 중지**했어요(`20261003003000`). 쌍 탐색과 준비 상태 뷰를 증분 계산으로 바꾸기 전에는 다시 켜지 않아요.

### F6. DB 자원 고갈

- **증상 (02:30 UTC 이후):** PostgREST 한 행 조회 14~23초, `pg_database_size()` 11초. cron 작업 다수가 `job startup timeout`, Supabase SQL 연결이 02:20~03:30 UTC 동안 계속 시간 초과. 프로젝트 상태는 계속 `ACTIVE_HEALTHY`.
- **추정 원인:** 작은 인스턴스의 디스크 IO 버스트 한도 소진. F2 수정 뒤 근거 매칭이 취소되지 않고 끝까지(30~90초) 돌고, 캘리브레이션이 매시간 2분씩 돌다 취소되면서 IO를 계속 썼어요. 요금제·인스턴스 크기는 커넥터로 볼 수 없어서(F4와 같음) 확정하지 못했어요.
- **조치 (05:3x UTC, `20261003003000`):** 캘리브레이션 일시 중지, 근거 매칭 10분 → 30분 간격. 롤백 SQL은 migration 머리말에 있어요.
- **확인할 것:** 다음 몇 시간 동안 cron `job startup timeout`과 statement timeout이 사라지는지.

### F4. DB 용량

| 테이블 | 크기 | 행 수 | 성격 |
|---|---|---|---|
| `nars_event_score_ledger` | 166 MB | 약 9.1만 | 점수 변화 원장 (지우지 않음) |
| `black_oracle_events` | 145 MB | 약 5.2만 | canonical 이벤트 원장 (지우지 않음) |
| `nars_evidence_match_candidates` | 99 MB | 약 5.6만 | 매칭 후보 (F2 이후 증가 속도 감소) |

- 프로젝트는 Vercel 연동 조직(`vercel_icfg_…`)에 속해 있어서 요금제와 용량 한도를 커넥터로 확인할 수 없어요.
- 두 원장은 North Star §3-6 "과거를 다시 쓰지 않음"과 Frozen §17 불변식의 대상이에요. 그래서 **삭제로 용량을 줄이지 않아요.** 필요하면 오래된 구간을 외부 저장소로 아카이브하는 방식을 따로 결정해요.

### F5. 자동 근거 연결 정밀도

- 무작위로 고른 AUTO_LINK 10건은 대부분 같은 공시 제목끼리의 연결이었어요.
- 예외로 "BNK투자증권 일괄신고추가서류(**주가연계**파생결합사채)" 이벤트가 "BNK투자증권 일괄신고추가서류(**기타**파생결합사채)" 공시에 연결된 사례가 있었어요(점수 0.715).
- 이번 변경으로 생긴 문제가 아니라 기존 `MATCH` 게이트의 규칙이에요. 같은 발행사의 반복 정기 공시를 구분하는 규칙이 필요해요.

## 3. 다음 행동

| # | 행동 | 담당 |
|---|---|---|
| A1 | Railway에서 `black-oracle-web`, `black-oracle-paper-vnext` 서비스 상태와 요금제를 확인 (F1) | 한서님 또는 Railway 연결 후 Claude |
| A2 | ~~01:07 UTC 캘리브레이션 확인~~ → 캘리브레이션 증분화 후 재가동 (F3) | Claude |
| A3 | Supabase 요금제와 용량 한도 확인 (F4) | 한서님 (Vercel 연동 조직) |
| A4 | F1 결과에 따라 North Star §8의 M4 검증 방식을 확정 | Claude |
| A5 | 반복 정기 공시 구분 규칙을 NARS 품질 과제로 등록 (F5) | Claude (M2) |
| A6 | 부하 감축 뒤 회복 확인. 회복되지 않으면 Supabase 컴퓨트·IO 등급 확인 (F6) | Claude, 등급 변경은 한서님 (Vercel 연동 조직) |
