# ReclastAI — Mobile API Integration Guide

This document describes how to connect a mobile app to the ReclastAI Worker API: authentication, endpoints, models, and limits. It does not contain secrets, passwords, or account credentials.

---

## Base URL

Obtain the production Worker URL from the Cloudflare Dashboard or your project administrator. Example format:

```
https://YOUR-WORKER-NAME.YOUR-SUBDOMAIN.workers.dev
```

All requests use this base URL. Paths start with `/api/...`.

Local development (`npm run dev`):

```
http://127.0.0.1:8787
```

The port may differ; use the address shown in the Wrangler dev output.

---

## General rules

| Topic | Value |
|-------|--------|
| Auth header | `Authorization: Bearer reclast_...` |
| JSON requests | `Content-Type: application/json` |
| Success response | `{ "success": true, "data": { ... } }` |
| Error response | `{ "success": false, "error": "..." }` |
| AI rate limit | 60 requests / hour / user |
| Login rate limit | 10 attempts / 15 min / IP |

HTTP status codes: `200` success, `400` bad request, `401` unauthorized, `402` Flux confirmation required, `429` rate limited, `500` server error.

---

## 1. Authentication flow

The mobile app does **not** use web cookies. Flow:

```
Login screen → POST /api/auth/login → receive apiKey → store in secure storage → Bearer on all API calls
```

### POST `/api/auth/login`

**Body:**

```json
{
  "email": "user@example.com",
  "username": "your_username",
  "password": "your_password"
}
```

**Success (200):**

```json
{
  "success": true,
  "data": {
    "message": "Authentication successful",
    "email": "user@example.com",
    "username": "your_username",
    "apiKey": "reclast_xxxxxxxx..."
  }
}
```

**Error (401):**

```json
{
  "success": false,
  "error": "Invalid email or credentials"
}
```

### Using the API key

On every protected request:

```
Authorization: Bearer reclast_xxxxxxxx...
```

**Recommendations:**

- Do not hardcode the key in source code
- Use iOS Keychain / Android EncryptedSharedPreferences (or equivalent)
- If leaked, regenerate via web dashboard or `POST /api/auth/regenerate-key` (requires cookie or Bearer)

### POST `/api/auth/check-email` (optional)

Used by the two-step web login. Mobile apps with a single login screen can **skip** this and call `/api/auth/login` directly.

---

## 2. Model lists (dropdown / settings)

Fetch once on app launch or in settings; start with `defaultModel`.

All `/models` endpoints **require auth** (Bearer header).

### GET `/api/text/models`

```json
{
  "success": true,
  "data": {
    "models": [
      {
        "id": "@cf/meta/llama-3.1-8b-instruct-fp8-fast",
        "name": "Llama 3.1 (8B)",
        "description": "...",
        "neuronCost": "medium",
        "neuronNote": "..."
      }
    ],
    "defaultModel": "@cf/meta/llama-3.1-8b-instruct-fp8-fast"
  }
}
```

### GET `/api/code/models`

Same shape; `defaultModel`: `@cf/qwen/qwen3-30b-a3b-fp8`

### GET `/api/image/models`

```json
{
  "success": true,
  "data": {
    "models": [
      {
        "id": "@cf/bytedance/stable-diffusion-xl-lightning",
        "name": "SDXL Lightning",
        "maxSteps": 4,
        "defaultSteps": 4,
        "requiresPremiumConfirm": false,
        "dimensions": [
          { "width": 1024, "height": 1024, "label": "1024×1024", "aspect": "square" }
        ]
      }
    ],
    "defaultModel": "@cf/bytedance/stable-diffusion-xl-lightning"
  }
}
```

**Mobile UI:** For images, only offer sizes from the selected model’s `dimensions` array.

---

## 3. Text generation

### POST `/api/text/generate`

**Body:**

```json
{
  "prompt": "Write a short story",
  "model": "@cf/meta/llama-3.1-8b-instruct-fp8-fast",
  "options": {
    "max_tokens": 1024,
    "temperature": 0.7
  }
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `prompt` | Yes | Max 8192 characters |
| `model` | No | Server default if omitted |
| `options.max_tokens` | No | Max 2048 |
| `options.temperature` | No | 0–2 |
| `options.top_p` | No | 0–1 |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "result": "Generated text here...",
    "model": "@cf/meta/llama-3.1-8b-instruct-fp8-fast"
  }
}
```

---

## 4. Code generation

### POST `/api/code/generate`

Same body shape as text.

```json
{
  "prompt": "Write a simple counter widget in Flutter",
  "model": "@cf/qwen/qwen3-30b-a3b-fp8"
}
```

**Response:** `{ "data": { "result": "...", "model": "..." } }`

---

## 5. Image generation

### POST `/api/image/generate`

**Body:**

```json
{
  "prompt": "Cyberpunk city at night",
  "model": "@cf/bytedance/stable-diffusion-xl-lightning",
  "width": 1024,
  "height": 1024,
  "steps": 4,
  "confirmPremium": false
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `prompt` | Yes | Max 2000 characters |
| `model` | No | Default: SDXL Lightning |
| `width` / `height` | No | From model `dimensions`; invalid pairs fall back to first size |
| `steps` | No | Clamped to model `maxSteps` |
| `confirmPremium` | Flux only | Required `true` for `@cf/black-forest-labs/flux-1-schnell` |

**Response:** Binary PNG — not JSON.

```
Content-Type: image/png
Body: raw bytes
```

**Flutter (Dio) example:**

```dart
final response = await dio.post(
  '$baseUrl/api/image/generate',
  data: {
    'prompt': prompt,
    'model': modelId,
    'width': 1024,
    'height': 1024,
    'steps': 4,
  },
  options: Options(
    responseType: ResponseType.bytes,
    headers: {'Authorization': 'Bearer $apiKey'},
  ),
);
final pngBytes = response.data as Uint8List;
```

**Flux models:** If `requiresPremiumConfirm: true`, show a confirmation dialog and send `"confirmPremium": true`.

---

## 6. Statistics

### GET `/api/stats`

**Response:**

```json
{
  "success": true,
  "data": {
    "totalRequests": 10,
    "textRequests": 4,
    "imageRequests": 3,
    "codeRequests": 3,
    "lastUpdated": "2026-06-07T12:00:00.000Z"
  }
}
```

---

## 7. Recommended mobile architecture

```
┌─────────────┐     Bearer apiKey      ┌──────────────────┐
│ Mobile App  │ ─────────────────────► │ ReclastAI Worker │
│             │ ◄───────────────────── │ /api/*           │
│ Secure      │   JSON or PNG bytes    └──────────────────┘
│ Storage     │
└─────────────┘
```

1. First launch: login → store `apiKey` in secure storage
2. Cache model lists (e.g. 24h TTL)
3. Send selected `model`; for images also `width`, `height`, `steps`
4. On `401` → redirect to login
5. On `429` → honor `Retry-After` or show a user message

---

## 8. Error handling

| Code | Meaning | Mobile action |
|------|---------|---------------|
| 401 | Invalid or expired key | Re-login |
| 402 | Flux confirmation missing | Confirm dialog + `confirmPremium: true` |
| 429 | Rate limited | Wait or inform user |
| 400 | Prompt/model error | Show `error` message |
| 500 | Server error | Retry or support message |

---

## 9. Suggested test order

1. `POST /api/auth/login` → obtain `apiKey`
2. `GET /api/text/models` → 200 with Bearer
3. `POST /api/text/generate` → non-empty `result`
4. `GET /api/image/models` → `dimensions` list
5. `POST /api/image/generate` → PNG bytes length > 0
6. `GET /api/stats` → counters increment

---

## Notes

- API keys start with `reclast_`; obtain from login response; never embed in app source.
- Model lists and limits may change server-side; prefer fetching `/models` on each app launch.
