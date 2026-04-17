#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 3 ]]; then
  echo "Usage: .visualizer/emit-event.sh <eventType> <payload-json> <sessionId>" >&2
  exit 1
fi

EVENT_TYPE="$1"
PAYLOAD_JSON="$2"
SESSION_ID="$3"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VISUALIZER_ROOT="/home/mcfuzzysquirrel/Projects/hooked-on-hooks"
JSONL_PATH="$REPO_ROOT/.visualizer/logs/events.jsonl"
HTTP_ENDPOINT="${VISUALIZER_HTTP_ENDPOINT:-http://127.0.0.1:7070/events}"
STORE_PROMPTS="${VISUALIZER_STORE_PROMPTS:-false}"

# Optional Tracing v2 envelope fields — set VISUALIZER_TURN_ID / VISUALIZER_TRACE_ID /
# VISUALIZER_SPAN_ID / VISUALIZER_PARENT_SPAN_ID in your hook environment to enable
# exact tool-call pairing. All fields are optional; the ingest service falls back to
# a FIFO heuristic when they are absent.
_viz_extra_args=()
if [ -n "${VISUALIZER_TURN_ID:-}" ];       then _viz_extra_args+=(--turnId       "${VISUALIZER_TURN_ID}");       fi
if [ -n "${VISUALIZER_TRACE_ID:-}" ];      then _viz_extra_args+=(--traceId      "${VISUALIZER_TRACE_ID}");      fi
if [ -n "${VISUALIZER_SPAN_ID:-}" ];       then _viz_extra_args+=(--spanId       "${VISUALIZER_SPAN_ID}");       fi
if [ -n "${VISUALIZER_PARENT_SPAN_ID:-}" ]; then _viz_extra_args+=(--parentSpanId "${VISUALIZER_PARENT_SPAN_ID}"); fi

npx tsx "$VISUALIZER_ROOT/scripts/emit-event-cli.ts"   --eventType "$EVENT_TYPE"   --payload "$PAYLOAD_JSON"   --sessionId "$SESSION_ID"   --repoPath "$REPO_ROOT"   --jsonlPath "$JSONL_PATH"   --httpEndpoint "$HTTP_ENDPOINT"   --storePrompts "$STORE_PROMPTS"   "${_viz_extra_args[@]:-}"
