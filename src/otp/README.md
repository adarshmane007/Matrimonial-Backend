# Mobile OTP module (optional)

Isolated from core auth. Disabled unless `OTP_ENABLED=true`.

- `GET /api/otp/status` — public config
- `POST /api/otp/send` — `{ mobile }`
- `POST /api/otp/verify` — `{ mobile, code }` → `mobileVerificationToken`
- Register includes `mobileVerificationToken` when OTP is on and mobile is provided

Local dev: `OTP_ENABLED=true` and `OTP_DEV_LOG_CODE=true` (code in API logs, no SNS).
