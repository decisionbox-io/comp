# DecisionBox fork of Comp AI

The `decisionbox` branch is upstream `trycompai/comp` at `0ccfcc238`, plus the changes below, used for our self-hosted SOC 2 / ISO 27001 evaluation (AWS dev account).

| Commit | Change |
|---|---|
| build | Fix the self-hosted Docker build (workspace packages, Prisma schemas, migrator stage, portal API URL build arg) |
| trigger | Point the app and API at our Trigger.dev projects |
| llm | Use an OpenAI-compatible gateway (LiteLLM → AWS Bedrock) instead of the Vercel AI gateway |
| seed | Drop control `documentTypes` from the framework seed |
| email | AWS SES email provider (`EMAIL_PROVIDER=ses`); Resend remains the default |

## Deployment files
- `docker-compose.override.example.yml`: host networking, Postgres, Redis + serverless-redis-http, LiteLLM. Copy it to the repo root as `docker-compose.override.yml`.
- `litellm-config.example.yaml`: model routing to Bedrock (Opus for chat, Cohere embed v4 for embeddings). Copy it to `decisionbox/litellm-config.yaml`.

Secrets come from the environment (never commit them): `POSTGRES_PASSWORD`, `SRH_TOKEN`, `LITELLM_MASTER_KEY`, plus the per-app `.env` files.

## Email via AWS SES
Set in `apps/api/.env`, `apps/app/.env` and `apps/portal/.env`:
```
EMAIL_PROVIDER=ses
SES_REGION=us-east-1
RESEND_FROM_DEFAULT="Comp AI <security@decisionbox.io>"
RESEND_FROM_SYSTEM="Comp AI <security@decisionbox.io>"
```
Credentials come from the default AWS chain (EC2 instance role). The role needs `ses:SendEmail` on `identity/*` and `configuration-set/*`. While the account is in the SES sandbox, recipients must be verified identities.
