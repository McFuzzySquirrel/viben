# Visualizer Hook Integration

This repo was bootstrapped for Copilot Activity Visualiser.

## Generated Files
- .visualizer/emit-event.sh (bash / macOS / Linux)
- .visualizer/emit-event.ps1 (PowerShell / Windows)
- .visualizer/visualizer.config.json
- .visualizer/logs/events.jsonl (created on first emit)
- .github/hooks/visualizer/visualizer-hooks.json (canonical hook manifest)

## Visualizer Manifest

The file `.github/hooks/visualizer/visualizer-hooks.json` is the single source of truth
for which lifecycle events the visualizer captures. It is auto-generated during
bootstrap and lists every event type with its corresponding hook command.

All visualizer-generated stub hooks live in `.github/hooks/visualizer/` to keep
them isolated from user-managed hooks.

When unbootstrapping, this manifest is deleted automatically.

## Emit Command

### Bash (macOS / Linux)

```bash
.visualizer/emit-event.sh <eventType> '<payload-json>' <sessionId>
```

Example:

```bash
SESSION_ID="run-$(date +%s)"
.visualizer/emit-event.sh sessionStart '{}' "$SESSION_ID"
.visualizer/emit-event.sh preToolUse '{"toolName":"bash","toolArgs":{"command":"npm test"}}' "$SESSION_ID"
.visualizer/emit-event.sh postToolUse '{"toolName":"bash","status":"success","durationMs":1200}' "$SESSION_ID"
.visualizer/emit-event.sh postToolUseFailure '{"toolName":"bash","status":"failure","errorSummary":"exit code 1"}' "$SESSION_ID"
.visualizer/emit-event.sh sessionEnd '{}' "$SESSION_ID"
```

### PowerShell (Windows)

```powershell
.visualizer\emit-event.ps1 -EventType <eventType> -Payload '<payload-json>' -SessionId <sessionId>
```

Example:

```powershell
$SessionId = "run-" + [int](Get-Date -UFormat %s)
.visualizer\emit-event.ps1 -EventType sessionStart -Payload '{}' -SessionId $SessionId
.visualizer\emit-event.ps1 -EventType preToolUse -Payload '{"toolName":"bash"}' -SessionId $SessionId
.visualizer\emit-event.ps1 -EventType sessionEnd -Payload '{}' -SessionId $SessionId
```

## Event Types
sessionStart, sessionEnd, userPromptSubmitted, preToolUse, postToolUse,
postToolUseFailure, subagentStart, subagentStop, agentStop, notification,
errorOccurred

## Hook Discovery
The bootstrap script scans `.github/hooks/` and its subdirectories for hook
scripts (`.sh` and `.ps1`) that match known lifecycle names. If your hooks live
in a subfolder (e.g. `.github/hooks/copilot/session-start.sh`) they are
discovered automatically.

When `--create-hooks` is used, stub scripts are placed in
`.github/hooks/visualizer/` to keep them separate from user-managed hooks.
Both `.sh` (bash) and `.ps1` (PowerShell) stubs are generated.

When a `--prefix` is used, filenames like `<prefix>-session-start.sh` are also
matched (e.g. `viz-session-start.sh` with `--prefix viz`).

## Live Viewing
1. Start the ingest service from the visualizer repo:
   npm run serve:ingest   (from /home/mcfuzzysquirrel/Projects/hooked-on-hooks)
2. Start the web UI from the visualizer repo:
   npm run dev --workspace=packages/web-ui
3. Run your multi-agent workflow with hook emits enabled.
4. Open http://127.0.0.1:5173 to observe live activity.

## Offline / JSONL-Only Mode
If the ingest service is NOT running, the emit scripts still write all events to
.visualizer/logs/events.jsonl and exit cleanly — no lost events.
Start the ingest service later and replay from the JSONL file.
