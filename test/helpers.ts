import { Writable } from "node:stream";

/** A writable that records everything written to it. */
export class Collector extends Writable {
  text = "";

  override _write(chunk: Buffer | string, _encoding: BufferEncoding, done: () => void): void {
    this.text += chunk.toString();
    done();
  }
}
