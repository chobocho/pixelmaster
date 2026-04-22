/**
 * GIF 규격 LZW 인코더. 인덱스 배열을 LSB-first 비트 스트림으로 인코딩하고
 * GIF sub-block(최대 255바이트 + 종료 0바이트) 포맷으로 감싼다.
 */
export function lzwEncodeGifSubBlocks(indices: Uint8Array, minCodeSize: number): Uint8Array {
  if (minCodeSize < 2 || minCodeSize > 8) {
    throw new Error(`minCodeSize must be in [2, 8]: ${minCodeSize}`);
  }
  const raw = lzwEncodeBytes(indices, minCodeSize);
  return wrapSubBlocks(raw);
}

export function lzwEncodeBytes(indices: Uint8Array, minCodeSize: number): Uint8Array {
  if (minCodeSize < 2 || minCodeSize > 8) {
    throw new Error(`minCodeSize must be in [2, 8]: ${minCodeSize}`);
  }
  const CLEAR = 1 << minCodeSize;
  const END = CLEAR + 1;
  const MAX_CODE = 4096;

  let codeSize = minCodeSize + 1;
  let nextCode = END + 1;

  // Dictionary keyed by existing-code * 256 + next-byte (since bytes are 0..255).
  // For codes up to 4096, key fits in 24 bits.
  const dict = new Map<number, number>();

  const bitStream = new BitStream();
  bitStream.write(CLEAR, codeSize);

  if (indices.length === 0) {
    bitStream.write(END, codeSize);
    return bitStream.toBytes();
  }

  let current = indices[0];

  for (let i = 1; i < indices.length; i++) {
    const next = indices[i];
    const key = current * 256 + next;
    const found = dict.get(key);
    if (found !== undefined) {
      current = found;
    } else {
      bitStream.write(current, codeSize);
      if (nextCode < MAX_CODE) {
        dict.set(key, nextCode);
        nextCode += 1;
        if (nextCode > (1 << codeSize) && codeSize < 12) {
          codeSize += 1;
        }
      } else {
        // Table full → emit CLEAR and reset
        bitStream.write(CLEAR, codeSize);
        dict.clear();
        codeSize = minCodeSize + 1;
        nextCode = END + 1;
      }
      current = next;
    }
  }

  bitStream.write(current, codeSize);
  bitStream.write(END, codeSize);
  return bitStream.toBytes();
}

class BitStream {
  private bytes: number[] = [];
  private buffer = 0;
  private bitCount = 0;

  write(value: number, bits: number): void {
    this.buffer |= (value & ((1 << bits) - 1)) << this.bitCount;
    this.bitCount += bits;
    while (this.bitCount >= 8) {
      this.bytes.push(this.buffer & 0xff);
      this.buffer >>>= 8;
      this.bitCount -= 8;
    }
  }

  toBytes(): Uint8Array {
    if (this.bitCount > 0) {
      this.bytes.push(this.buffer & 0xff);
      this.buffer = 0;
      this.bitCount = 0;
    }
    return new Uint8Array(this.bytes);
  }
}

function wrapSubBlocks(data: Uint8Array): Uint8Array {
  const parts: number[] = [];
  let offset = 0;
  while (offset < data.length) {
    const len = Math.min(255, data.length - offset);
    parts.push(len);
    for (let i = 0; i < len; i++) parts.push(data[offset + i]);
    offset += len;
  }
  parts.push(0); // block terminator
  return new Uint8Array(parts);
}
