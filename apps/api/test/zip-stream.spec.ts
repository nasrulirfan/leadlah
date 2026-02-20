import { describe, expect, it } from "vitest";
import { Writable } from "stream";
import { streamZip } from "../src/utils/zip-stream";

const collectWritable = () => {
  const chunks: Buffer[] = [];
  const writable = new Writable({
    write(chunk, _enc, cb) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      cb();
    },
  });
  return { writable, chunks };
};

describe("streamZip", () => {
  it("writes a valid zip structure with entries", async () => {
    const { writable, chunks } = collectWritable();

    await streamZip(writable, [
      {
        filename: "a.txt",
        stream: (async function* () {
          yield Buffer.from("hello");
        })(),
      },
      {
        filename: "b.txt",
        stream: (async function* () {
          yield Buffer.from("world");
        })(),
      },
    ]);

    const output = Buffer.concat(chunks);
    expect(output.subarray(0, 4).toString("hex")).toBe("504b0304"); // local header
    expect(output.includes(Buffer.from("a.txt"))).toBe(true);
    expect(output.includes(Buffer.from("b.txt"))).toBe(true);
    expect(output.includes(Buffer.from([0x50, 0x4b, 0x01, 0x02]))).toBe(true); // central dir
    expect(output.subarray(output.length - 22, output.length - 18).toString("hex")).toBe("504b0506"); // EOCD
  });
});

