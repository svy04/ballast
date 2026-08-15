# ballast

**ballast는 긴 세션의 표류를 막는 Claude Code 플러그인이에요. 정해둔 상시 규칙은 걸리는 메시지마다 함께 도착하고, 한번 내린 결정은 원장(덧붙이기만 하고 고쳐 쓰지 않는 결정 기록부)에 잠겨요.**

- **의존성 0** — 스크립트 하나, 요구사항은 `node` 18 이상뿐이에요
- **설치 명령 두 줄** — 플러그인 마켓플레이스로 끝나요
- **훅 1개 + 스킬 6종** — 코드로 강제되는 건 훅(메시지마다 자동으로 도는 스크립트) 하나뿐이고, 문서가 그걸 그대로 표시해요
- **빈 채로 출발** — 카탈로그(규칙을 모아두는 파일)에 규칙이 들어오기 전까지 훅은 조용해요. 넣는 법은 [빠른 시작](#빠른-시작)이에요
- **훅 실동작 5케이스 통과** — 키워드 주입 · 미일치 침묵 · 차단 · 구버전 필드 호환 · 깨진 카탈로그 무해
- **MIT** — 장치 전체가 한나절이면 다 읽히는 분량이에요

[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE) · [Changelog](CHANGELOG.md)

[설치](#설치) · [왜 ballast인가](#왜-ballast인가) · [무엇이 달라지나](#무엇이-달라지나) · [구성 조각](#구성-조각) · [빠른 시작](#빠른-시작) · [철학](#철학) · [유지보수](#유지보수)

세션에서는 이런 모습이에요 — 몇 주 전, 락파일이 두 번째로 깨졌을 때 규칙 하나를 심어뒀다고 해볼게요:

```
> 설치 스크립트 하나 만들어줘 — npm install 하고 끝내자

[ballast] Standing rules that apply to this request:
- pnpm만 쓰기: 이 저장소는 pnpm을 써요. npm install이 락파일을
  두 번 깨뜨렸어요 — 스크립트와 명령은 pnpm으로.

Claude: pnpm으로 갈게요 — npm이 락파일을 두 번 깨뜨렸다는 규칙이
있네요. 스크립트는 pnpm install로 돌아가요.
```

`[ballast]` 블록이 ballast가 보장하는 부분이에요. "npm"이 규칙에 걸려 본문 전체가 이 메시지와 함께 도착했고, 아래 답은 Claude가 기억해서가 아니라 건네받은 규칙을 따른 결과예요.

## 설치

```
/plugin marketplace add svy04/ballast
/plugin install ballast@ballast
```

훅은 PATH에 이미 있는 `node`(18 이상)로 돌아가요. 나머지는 전부 마크다운이에요.

## 왜 ballast인가

아래 표에서 *코드*는 스크립트가 강제한다는 뜻이고, *규약*은 Claude가 따르기로 한 마크다운 지침이라는 뜻이에요.

| 문제 | 증상 | 처방 |
|---|---|---|
| `CLAUDE.md`는 한 번 읽히고 끝 — 긴 세션은 멀어져요 | 같은 교정을 세션마다 반복 | **rules hook** *(코드)* — 걸린 규칙 본문을 메시지마다 배달 |
| 결정이 지난 대화 속에 묻혀요 | 끝난 논의가 다시 열리거나 슬쩍 고쳐짐 | **decision ledger**(결정 원장) *(규약)* — 덧붙이기만, 번복은 대체(supersede) 기록 |
| 그럴듯한 문장이 사실로 굳어요 | 검증 안 된 주장 위의 자신만만한 답 | **verify gate**(검증 관문) *(규약)* — 주장마다 라벨, `confirmed`(확인됨)는 얻어야 함 |
| 카피가 제품이 아니라 로드맵을 설명해요 | 없는 기능에 "우리는 X를 해요" | **proof standard**(증거 기준) *(규약)* — 대외 주장은 진실 파일에서만 |
| "완료"의 근거가 Claude의 말뿐이에요 | 선언된 성공, 조용한 실패 | **goal** *(규약)* — 완료 = 검사 통과 |

진실 파일은 제품이 검증 가능하게 하는 일을 증거와 함께 적어둔 기록이에요. 검사 통과는 파일이 있고, 테스트가 돌고, 산출물을 실제로 봤다는 뜻이에요.

다섯 줄 중 코드로 강제되는 건 한 줄이에요. rules hook은 프롬프트마다 실행되는 스크립트라, Claude가 협조하든 말든 발동해요.

나머지 넷은 규약이에요 — Claude가 따라 주는 만큼만 지켜지고, 여느 프롬프트처럼 흐려질 수 있어요. ballast는 이걸 아닌 척하지 않아요.

대신 규약을 강제로 끌어올리는 통로가 **pin**이에요. 규약이 미끄러지면 한 번만 교정하세요 — pin이 그 교정을 카탈로그에 적고, 그다음부터는 훅이 배달해요.

## 무엇이 달라지나

| 이전 | 이후 |
|---|---|
| 같은 교정을 매주 반복해요 | **pin**이 한 번 적어두면, 걸리는 메시지마다 같이 도착해요 |
| 상시 규칙이 관련 없어도 컨텍스트를 차지해요 | 걸린 규칙만 배달 — 상한 12개 · 약 6,000자 |
| 세웠어야 할 프롬프트가 그냥 통과해요 | `action: "block"`이 거절하고, 그 규칙을 사유로 보여줘요 |
| 세션이 바뀌면 기억이 초기화돼요 | `memory/` 파일이 남아요: 인덱스, 원장, 미해결 질문, 세션 로그 |

배달 상한은 훅 소스에 고정된 값이에요. 차단은 가드레일이지 샌드박스가 아니에요 — 훅이 못 돌면 차단도 꺼지는 fail-open이거든요(자세한 건 [빠른 시작](#빠른-시작)).

## 구성 조각

| 조각 | 종류 | 역할 |
|---|---|---|
| **rules hook** | 코드 — 프롬프트마다 도는 스크립트 | 걸린 규칙 전부를 본문 그대로 메시지와 함께 배달, `block` 규칙은 프롬프트를 세워요 |
| **decision-ledger** | 규약 — 마크다운 스킬 | 덧붙이기만 되는 `DECISIONS.md` — 번복은 대체 링크로, 조용한 수정은 없어요 |
| **verify-gate** | 규약 — 마크다운 스킬 | 반박을 견디고 출처를 대기 전까지, 조사 결과와 모델 지식은 초안 취급이에요 |
| **proof-standard** | 규약 — 마크다운 스킬 | 진실 파일에 증거가 없으면 대외 주장 금지 — 카피가 코드 상태를 흐리면 안 돼요 |
| **brain-init** | 규약 — 마크다운 스킬 | 기억 골격을 깔아요: 인덱스, 원장, 미해결 질문, 세션 로그, 제품 진실 |
| **goal** | 규약 — 마크다운 스킬 | 함정부터 지도로 그리고, 검증 가능한 크기로 쪼개고, 검사 통과 전엔 완료라 안 해요 |
| **pin** | 규약 — 훅이 강제할 규칙을 써요 | 방금 받은 교정을 한 번에 영구 규칙으로 바꿔요 |

verify-gate의 라벨은 다섯 가지예요: `confirmed` / `observed`(관찰됨) / `assumed`(가정) / `hearsay`(전언) / `unknown`(모름). proof-standard는 코드를 4단계 — 구현됨 · 연결됨 · 가동 중 · 검증됨 — 로 추적해요.

## 빠른 시작

### 첫 규칙을 심으세요

1. 아무 일에서든 Claude를 한 번 교정해 보세요. 교정이 곧 **pin** 스킬의 신호예요 — Claude가 규칙 초안을 보여주고, OK 하면 카탈로그에 적어요.
2. `/ballast:brain-init` — 프로젝트에 기억 파일의 골격을 깔아요.
3. `/ballast:goal <큰 목표>` — 전체 파이프라인을 돌려요. 낯선 분야라면 답을 내놓기 전에 쟁점 · 정설 · 초심자 함정부터 지도로 그려요.

규칙이 없을 땐 메시지가 혼자 도착해요. 아래 `cost-gate` 규칙이 카탈로그에 들어간 뒤에는, "generate"가 들어간 메시지가 이렇게 도착해요:

```
> generate 40 images for the launch batch

[ballast] Standing rules that apply to this request:
- Estimate before spending: Anything that spends money: estimate first,
  explicit approval, then execute.
```

### 카탈로그를 직접 쓰세요

규칙은 `<프로젝트>/.claude/ballast.rules.json`과 `~/.claude/ballast.rules.json`에 있어요(`id`가 겹치면 프로젝트 쪽이 이겨요):

```json
{
  "id": "cost-gate",
  "title": "Estimate before spending",
  "when": { "keywords": ["generate", "credits"], "patterns": ["\\bbatch\\b"] },
  "action": "inject",
  "body": "Anything that spends money: estimate first, explicit approval, then execute."
}
```

- `keywords` — 대소문자 구분 없는 부분일치
- `patterns` — 정규식
- `always: true` — 매 메시지 발동, 1~2개로 아껴 쓰세요
- `action: "block"` — 프롬프트를 세우고 `body`를 사유로 보여줘요
- `BALLAST_DISABLE=1` — 훅이 꺼져요

시작은 [`rules/ballast.rules.example.json`](rules/ballast.rules.example.json)을 복사하거나, **pin**에게 맡기세요.

### 한계를 알고 쓰세요

설계상 미리 알아둘 것이 두 가지예요:

- **조용한 실패** — 카탈로그가 망가져도, 정규식이 틀려도, 내부 오류가 나도 세션은 안 깨져요.
- **fail-open** — 훅이 아예 못 도는 상황(PATH에 `node` 없음, 카탈로그 읽기 실패)에서는 `block` 규칙도 같이 안 걸려요. 차단은 가드레일로 쓰시고, 뚫리지 않는 샌드박스로 믿지는 마세요.

검증에 두 번째 모델을 세우고 싶으면 [`rules/ballast.verifier.example.json`](rules/ballast.verifier.example.json)을 `.claude/ballast.verifier.json`으로 복사하세요.

`command`에 주장을 반박해 줄 CLI를 지정하면, verify-gate 스킬이 그걸 실행해 반박을 견줘본 뒤에야 `confirmed`를 붙여요.

Claude가 굴려온 저장소에서 처음 푸시하기 전에는 [docs/PUBLISH-CHECKLIST.md](docs/PUBLISH-CHECKLIST.md)를 한 줄씩 밟으세요 — 이런 작업 공간에는 어느새 안 들여다보게 된 파일들에 비밀값이 쌓여요.

## 철학

긴 Claude 세션이 어긋날 때 보통의 원인은 능력 부족이 아니라 기억과 과신이라는 것 — 이게 ballast의 전제예요. 그래서 규칙은 파일에 두고, 필요한 메시지와 함께 도착하게 해요.

결정은 조용히 고쳐 쓸 수 없는 원장에 남겨요. 주장은 `confirmed`를 얻기 전까지 라벨을 달고 다녀요.

그 라벨 기준으로, 이 README가 밝혀둘 것이 두 가지 있어요:

- **실적은 `hearsay`예요.** 개발 배경 없는 한 사람이 업무 전체를 Claude Code로 돌리며 그 결과를 믿어야 했던 게 ballast의 출발이에요. 하지만 그 몇 달의 일상 사용은 비공개 회사 작업 공간에서 있었고, 이 공개 저장소는 2026년 8월에 시작됐어요 — 열어볼 수 있는 이력이 여기엔 없어요.
- **새로움 주장은 `unknown`이에요.** 프롬프트 제출 시점의 컨텍스트 주입은 문서화된 Claude Code 훅 패턴이고, 덧붙이기만 하는 기록은 소프트웨어보다 오래된 방식이에요. ballast가 말할 수 있는 최대치는 "이 루프 전체를 묶어놓은 걸 다른 데서는 못 봤다"까지예요.

대신 장치는 확인할 수 있어요 — 훅, 스킬 여섯 개, 규칙 형식이 전부 이 저장소에 있고, 한나절이면 다 읽혀요. 루프의 선례를 아시면 이슈로 알려주세요. 링크해 둘게요.

## 유지보수

버전 이력은 [CHANGELOG.md](CHANGELOG.md)에 있어요 — 릴리스마다 무엇이 바뀌고 무엇이 정정됐는지 적어요. 이슈로 물으면 문서에 반영해요 — README에 있었어야 할 답은 README에 적어둘게요.

---

MIT · English: [README.md](README.md)
