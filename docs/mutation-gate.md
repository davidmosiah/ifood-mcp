# Mutation gate

`src/services/mutation-gate.ts` is the only place money rules live.

| Tool | `IFOOD_ALLOW_MUTATIONS` | `explicit_user_intent` |
| --- | --- | --- |
| checkout | required | required |
| cart create / delivery / payment | required | required |
| logout | no | required |
