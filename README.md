# 🛡️ CJK Chunk Interlock

> CJK IME input for web terminals

Perfect zero-dependency solution for handling CJK (Korean, Chinese, Japanese) IME race conditions, character duplication, and byte fragmentation in web-based virtual terminals (e.g., xterm.js) and raw stream pipelines.

## 💡 Architecture

[User Input] ──> [Decoupled Input Sandbox] ──(Atomic Chunk)──> [Quarantine Buffer] ──(\r\n Lock)──> [Backend PTY Shell]

By decoupling the browser's native composition buffer from the immediate terminal emulator canvas stream, it prevents duplicate character echoing (`아` + `ㅇ` -> `아아ㅇ`) and keeps terminal data integrity consistent even under extreme network latency.

## 📦 Installation

```bash
npm install cjkime

``` 
## 🚀 Usage

### Backend (Node.js Engine)

```typescript
import { CjkQuarantineStream } from 'cjkime';

const quarantine = new CjkQuarantineStream();

// Pipe incoming raw socket stream through the quarantine gate before flushing into PTY
incomingSocketStream.pipe(quarantine).pipe(ptyProcess);

```

### Frontend (Vanilla JS / xterm.js Addon)
```typescript
import { Terminal } from 'xterm';
import { XtermCjkSandboxAddon } from 'cjkime/adapters/vanilla';

const term = new Terminal();
const cjkAddon = new XtermCjkSandboxAddon((chunk) => {
  socket.send(chunk);
});

term.loadAddon(cjkAddon);
```
