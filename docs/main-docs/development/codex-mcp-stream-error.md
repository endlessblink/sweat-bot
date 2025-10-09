# Stream Disconnected Before Completion in Codex MCP: Root Causes and Fixes

## Why This Happens
Codex shows `stream disconnected before completion: Transport error: error decoding response body` when the MCP client cannot parse or finish streaming the JSON-RPC payload coming from your server. In practice, that means one of four things is breaking the stream:

- Your server emitted something that is not newline-delimited JSON-RPC on stdout (logs, ANSI colors, stack traces, partial JSON). citeturn2search4turn4search6
- The connection dropped mid-stream because a proxy, VPN, or load balancer timed out an idle SSE/HTTP connection before the response finished. citeturn6search0turn5search3turn1search5
- Codex aborted the request after the model rejected the payload (for example, context window exceeded) or after a CLI bug. Recent releases addressed several of these failure modes. citeturn1search2turn1search4turn1search7
- The MCP handshake is misconfigured (wrong protocol fields, missing `jsonrpc":"2.0"`, or Codex never launches the server because `config.toml` cannot find the binary). citeturn2search5turn7search2

## Diagnostic Checklist
1. **Replay the server locally**
   ```bash
   echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2025-03-26"},"id":1}' \
     | your-mcp-server 2>server-debug.log \
     | jq .
   ```
   If `jq` fails or `server-debug.log` shows logs on stdout, you have stdout contamination. citeturn2search4

2. **Enforce stderr-only logging**
   Configure your logger to send all diagnostics to stderr. For Python:
   ```python
   logging.basicConfig(stream=sys.stderr, level=logging.INFO)
   ```
   Keep stdout reserved for JSON-RPC envelopes. citeturn4search6

3. **Validate messages with MCP Inspector**
   ```bash
   npx @modelcontextprotocol/inspector@latest node dist/server.js
   ```
   Inspector will stream every request/response so you can spot malformed payloads or long pauses. citeturn3search0

4. **Check the network path**
   - Cloudflare proxies cut off responses that stay silent for ~100 seconds; emit heartbeat events or bypass the proxy for long jobs. citeturn6search0
   - AWS ALB defaults to 60-second idle timeouts; raise the idle timeout or stream interim data. citeturn5search3
   - VPN clients have triggered the exact Codex error; reproduce without the VPN before debugging server code. citeturn1search5

5. **Update Codex CLI**
   Upgrade to the latest CLI (`>=0.39` as of September 27, 2025) for hardened transport handling and background mode fixes. citeturn1search7

6. **Double-check `config.toml`**
   Ensure `~/.codex/config.toml` uses absolute paths and the `mcp_servers` TOML table so Codex actually launches your server. citeturn7search2

## Fixes by Root Cause

### 1. Stdout Contamination or Malformed JSON
- Replace `console.log` / `print` debugging with stderr logging.
- Serialize responses with `json.dumps(..., separators=(",", ":"))` and append a newline.
- Flush stdout after each message to avoid partial frames.
- Add unit tests that pipe server output through `jq` or `jsonschema`. citeturn2search4turn4search6

### 2. Long-Running Jobs Over Proxies
- Emit SSE heartbeat events (e.g., `data: {"status":"working"}` every 30–45 seconds) so Cloudflare never hits the 100-second read timeout. citeturn6search0
- Increase ALB idle timeout above your longest operation or move MCP behind a transport without that limit. citeturn5search3
- If users connect through VPNs, document that persistent tunnels may interfere and offer a direct path where possible. citeturn1search5

### 3. Payload Rejections (Context Window / CLI Bugs)
- Watch for Codex retries that end in `Your input exceeds the context window…`—trim request context or switch to a larger model profile. citeturn1search2
- For `Transport error: error decoding response body` loops introduced in older CLI builds, upgrade to ≥0.39. citeturn1search4turn1search7

### 4. Misconfigured MCP Handshake
- Verify you answer `initialize` with the same `protocolVersion` Codex requested (`2025-03-26` today) and include `jsonrpc":"2.0"`. citeturn2search5
- Confirm Codex actually launches your binary (absolute `command` path, optional `args`). Missing or relative paths prevent the client from spawning the server at all. citeturn7search2

## Prevent It Going Forward
- Add automated smoke tests that start the server via Inspector and run a full tool call before every release.
- Keep logs structured (JSON) and on stderr, and surface request IDs to trace retries.
- Monitor infrastructure timeouts (Cloudflare, ALB, corporate proxies) and keep heartbeats shorter than the smallest idle timeout in the chain.
- Track Codex release notes; regressions have been fixed quickly in recent minor versions, so staying current helps. citeturn1search7

These steps remove nearly all occurrences of the “stream disconnected before completion” error so Codex can stream responses without retries or dropped connections.
