import type { EditorState } from '../editor/EditorState.js';
import type { PixelCanvas } from '../editor/PixelCanvas.js';
import { encodeGif, type GifFrame } from './gif/gifEncode.js';

export class GifExporter {
  /** 현재 합성 결과를 단일 프레임 GIF 로 인코딩한다. */
  encodeSingleFrame(state: EditorState, delayCentiseconds: number = 10): Uint8Array {
    state.updateComposite();
    const c = state.compositeBuffer;
    return encodeGif([
      {
        width: c.width,
        height: c.height,
        rgba: new Uint8ClampedArray(c.data),
        delayCentiseconds,
      },
    ]);
  }

  /** 주어진 PixelCanvas 목록을 다중 프레임 GIF 로 인코딩한다. */
  encodeFrames(canvases: readonly PixelCanvas[], delayCentiseconds: number): Uint8Array {
    const frames: GifFrame[] = canvases.map((c) => ({
      width: c.width,
      height: c.height,
      rgba: new Uint8ClampedArray(c.data),
      delayCentiseconds,
    }));
    return encodeGif(frames);
  }

  encodeBlob(state: EditorState, delayCentiseconds: number = 10): Blob {
    const bytes = this.encodeSingleFrame(state, delayCentiseconds);
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    return new Blob([copy], { type: 'image/gif' });
  }

  triggerDownload(state: EditorState, filename: string, delayCentiseconds: number = 10): void {
    const blob = this.encodeBlob(state, delayCentiseconds);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
