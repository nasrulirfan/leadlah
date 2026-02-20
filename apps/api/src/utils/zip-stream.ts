import { Writable } from "stream";

type ZipEntry = {
  filename: string;
  stream: AsyncIterable<Uint8Array>;
};

type CentralDirectoryRecord = {
  filename: string;
  crc32: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
  modTime: number;
  modDate: number;
  flags: number;
  compressionMethod: number;
};

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let crc = i;
    for (let j = 0; j < 8; j += 1) {
      crc = (crc & 1) !== 0 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
    table[i] = crc >>> 0;
  }
  return table;
})();

const crc32Update = (crc: number, chunk: Uint8Array) => {
  let next = crc ^ 0xffffffff;
  for (let i = 0; i < chunk.length; i += 1) {
    next = crcTable[(next ^ chunk[i]!) & 0xff]! ^ (next >>> 8);
  }
  return (next ^ 0xffffffff) >>> 0;
};

const dosDateTime = (date: Date) => {
  const year = Math.max(1980, date.getFullYear());
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = Math.floor(date.getSeconds() / 2);

  const dosTime = (hours << 11) | (minutes << 5) | seconds;
  const dosDate = ((year - 1980) << 9) | (month << 5) | day;
  return { dosTime, dosDate };
};

const bufferU16 = (value: number) => {
  const b = Buffer.alloc(2);
  b.writeUInt16LE(value & 0xffff, 0);
  return b;
};

const bufferU32 = (value: number) => {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(value >>> 0, 0);
  return b;
};

const encodeFilename = (filename: string) => Buffer.from(filename, "utf8");

const write = async (out: Writable, chunk: Buffer) => {
  if (!out.write(chunk)) {
    await new Promise<void>((resolve) => out.once("drain", resolve));
  }
};

export async function streamZip(out: Writable, entries: ZipEntry[]) {
  const records: CentralDirectoryRecord[] = [];
  let offset = 0;

  for (const entry of entries) {
    const filenameBytes = encodeFilename(entry.filename);
    const now = new Date();
    const { dosTime, dosDate } = dosDateTime(now);

    const flags = 0x08; // data descriptor present
    const compressionMethod = 0; // store

    const localHeader = Buffer.concat([
      bufferU32(0x04034b50),
      bufferU16(20),
      bufferU16(flags),
      bufferU16(compressionMethod),
      bufferU16(dosTime),
      bufferU16(dosDate),
      bufferU32(0), // crc32 (unknown)
      bufferU32(0), // compressed size (unknown)
      bufferU32(0), // uncompressed size (unknown)
      bufferU16(filenameBytes.length),
      bufferU16(0), // extra length
      filenameBytes,
    ]);

    const localHeaderOffset = offset;
    await write(out, localHeader);
    offset += localHeader.byteLength;

    let crc = 0;
    let size = 0;

    for await (const chunk of entry.stream) {
      const buf = Buffer.from(chunk);
      crc = crc32Update(crc, buf);
      size += buf.byteLength;
      await write(out, buf);
      offset += buf.byteLength;
    }

    const dataDescriptor = Buffer.concat([
      bufferU32(0x08074b50),
      bufferU32(crc),
      bufferU32(size),
      bufferU32(size),
    ]);
    await write(out, dataDescriptor);
    offset += dataDescriptor.byteLength;

    records.push({
      filename: entry.filename,
      crc32: crc,
      compressedSize: size,
      uncompressedSize: size,
      localHeaderOffset,
      modTime: dosTime,
      modDate: dosDate,
      flags,
      compressionMethod,
    });
  }

  const centralDirectoryOffset = offset;
  let centralDirectorySize = 0;

  for (const record of records) {
    const filenameBytes = encodeFilename(record.filename);
    const header = Buffer.concat([
      bufferU32(0x02014b50),
      bufferU16(20), // version made by
      bufferU16(20), // version needed
      bufferU16(record.flags),
      bufferU16(record.compressionMethod),
      bufferU16(record.modTime),
      bufferU16(record.modDate),
      bufferU32(record.crc32),
      bufferU32(record.compressedSize),
      bufferU32(record.uncompressedSize),
      bufferU16(filenameBytes.length),
      bufferU16(0), // extra length
      bufferU16(0), // comment length
      bufferU16(0), // disk start
      bufferU16(0), // internal attrs
      bufferU32(0), // external attrs
      bufferU32(record.localHeaderOffset),
      filenameBytes,
    ]);

    await write(out, header);
    centralDirectorySize += header.byteLength;
    offset += header.byteLength;
  }

  const endOfCentralDirectory = Buffer.concat([
    bufferU32(0x06054b50),
    bufferU16(0), // disk number
    bufferU16(0), // disk with central dir
    bufferU16(records.length),
    bufferU16(records.length),
    bufferU32(centralDirectorySize),
    bufferU32(centralDirectoryOffset),
    bufferU16(0), // comment length
  ]);

  await write(out, endOfCentralDirectory);
}

