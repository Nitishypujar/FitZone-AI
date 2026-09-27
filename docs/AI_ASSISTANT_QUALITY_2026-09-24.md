# FitZone AI Assistant Quality Pass — 2026-09-24

## Goals

- Keep the Assistant on the same authoritative FitZone intelligence path as Dashboard, AI Plan, Workout, Progress, Goals, and Nutrition.
- Reduce unnecessary latency without bypassing the intelligence layer.
- Produce clean, professional plain-text responses instead of inconsistent Markdown.
- Prevent accidental leakage of prompts, tokens, or implementation details in model output.
- Keep user-visible typography readable and consistent with the FitZone product.

## Changes

### Latency

1. The intent-specific deterministic tool and adaptive intelligence calculation now run concurrently.
2. Gemini 3.8 Flash is explicitly configured with low thinking effort for chat, which is appropriate for latency-sensitive everyday interactions.
3. Retry behavior is limited to two attempts and only retryable failures are retried.
4. A 20-second server-side AI timeout prevents an indefinitely spinning chat request.
5. Conversation history sent to the model is bounded to the most recent eight messages.

### Response quality

The Assistant prompt now requires:

- complete grammatical sentences;
- consistent sentence case and tense;
- concise professional tone;
- plain text output;
- `•` bullets instead of Markdown asterisks;
- no Markdown headings, code fences, raw JSON, or decorative formatting;
- exact use of authoritative FitZone numbers;
- no invented fitness state;
- no internal implementation details.

A deterministic output formatter removes common Markdown artifacts and rejects responses containing obvious system-prompt or credential leakage patterns before they reach the browser.

## Architecture remains authoritative

```text
User question
    ↓
Intent detection
    ↓
Deterministic FitZone context/tools
    ↓
Adaptive intelligence
    ↓
Gemini explanation
    ↓
Output validation/formatting
    ↓
User
```

Gemini does not become the source of truth for workout completion, goals, progress, nutrition records, or recommendation state.

## Security basis

The output validation and prompt-separation approach follows OWASP guidance for prompt injection and improper output handling. Model output is treated as untrusted content and is validated before being displayed or used downstream.
