class BufferReader {
    constructor(buffer) {
      this.buffer = buffer;
      this.current = buffer;
      this.offset = 0x0;
    }

    next(bytes) {
      this.current = this.buffer.slice(this.offset, this.offset += bytes)
      return this;
    }

    to(byte) {
      this.offset = byte;
    }

    uint8Array() {
      return new Uint8Array(this.current);
    }

    uint16() {
      return new DataView(this.current).getUint16(0);
    }

    uint32() {
      return new DataView(this.current).getUint32(0);
    }

    int16() {
      return new DataView(this.current).getInt16(0);
    }

    int32() {
      return new DataView(this.current).getInt32(0);
    }

  }