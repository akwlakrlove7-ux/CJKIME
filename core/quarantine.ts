import { Transform, TransformCallback } from "stream";

export interface QuarantineOptions {
  maxBufferSize?: number;
  delimiters?: string[];
}

export class CjkQuarantineStream extends Transform {
  private buffer: string = "";
  private readonly maxBufferSize: number;
  private readonly delimiters: string[];

  constructor(options: QuarantineOptions = {}) {
    super({ objectMode: true });
    this.maxBufferSize = options.maxBufferSize || 65536;
    this.delimiters = options.delimiters || ["\n", "\r", "\x03", "\x04"];
  }

  _transform(chunk: any, encoding: string, callback: TransformCallback): void {
    try {
      const rawString = typeof chunk === "string" ? chunk : chunk.toString("utf-8");
      const normalized = rawString.normalize("NFC");

      if (this.buffer.length + normalized.length > this.maxBufferSize) {
        this.emit("error", new Error("BufferOverflow: CJK Quarantine Guard Triggered."));
        this.clear();
        return callback();
      }

      this.buffer += normalized;
      this.processQueue();
      callback();
    } catch (err) {
      callback(err as Error);
    }
  }

  private processQueue(): void {
    while (true) {
      let earliestIndex = -1;
      let detectedDelimiter = "";

      for (const delimiter of this.delimiters) {
        const index = this.buffer.indexOf(delimiter);
        if (index !== -1 && (earliestIndex === -1 || index < earliestIndex)) {
          earliestIndex = index;
          detectedDelimiter = delimiter;
        }
      }

      if (earliestIndex === -1) break;

      const endPosition = earliestIndex + detectedDelimiter.length;
      const verifiedChunk = this.buffer.slice(0, endPosition);
      this.buffer = this.buffer.slice(endPosition);

      this.push(verifiedChunk);
    }
  }

  public clear(): void {
    this.buffer = "";
  }
}