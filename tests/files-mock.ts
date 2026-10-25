import type { FileStorage } from "../src/modules/files/storage";

export class MockFileStorage implements FileStorage {
  objects = new Map<string, Buffer>();
  keys = new Map<string, string>();
  fail: "head" | "read" | "put" | "remove" | "list" | null = null;
  beforePut: ((key: string, bytes: Buffer) => Promise<void>) | undefined;
  readBytes = 0;
  async signPut(key: string, _mime: string) {
    void _mime;
    const url = `https://mock.invalid/upload/${this.keys.size}`;
    this.keys.set(url, key);
    return url;
  }
  async signGet(key: string, _mime: string, _name: string) {
    void _mime;
    void _name;
    return `https://mock.invalid/download/${encodeURIComponent(key)}`;
  }
  async head(key: string) {
    if (this.fail === "head") throw new Error("mock failure");
    const bytes = this.objects.get(key);
    if (!bytes) {
      const { HttpError } = await import("../src/shared/server/http");
      throw new HttpError(409, "UPLOAD_NOT_FOUND", "Missing mock object.");
    }
    return { bytes: bytes.length };
  }
  async read(key: string) {
    if (this.fail === "read") throw new Error("mock failure");
    const value = this.objects.get(key)!;
    const countRead = (length: number) => {
      this.readBytes += length;
    };
    return (async function* () {
      for (
        let offset = 0;
        offset < Math.min(value.length, 10485761);
        offset += 4096
      ) {
        const chunk = value.subarray(offset, Math.min(offset + 4096, 10485761));
        countRead(chunk.length);
        yield chunk;
      }
    })();
  }
  async put(key: string, bytes: Buffer, _mime: string, signal: AbortSignal) {
    if (this.fail === "put") throw new Error("mock failure");
    await this.beforePut?.(key, bytes);
    signal.throwIfAborted();
    this.objects.set(key, Buffer.from(bytes));
  }
  async remove(key: string) {
    if (this.fail === "remove") throw new Error("mock failure");
    this.objects.delete(key);
  }
  async list(prefix: string) {
    if (this.fail === "list") throw new Error("mock failure");
    return [...this.objects.keys()].filter((key) => key.startsWith(prefix));
  }
  upload(url: string, bytes: Buffer) {
    const key = this.keys.get(url);
    if (!key) throw new Error("Unknown mock grant");
    this.objects.set(key, Buffer.from(bytes));
  }
}
export const mockPdf = Buffer.from(
  "%PDF-1.7\nOriginal disposable fixture\n%%EOF\n",
);
