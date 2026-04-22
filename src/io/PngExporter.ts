import type { EditorState } from '../editor/EditorState.js';
import { pngEncode } from './pngEncode.js';
import { upscaleNearest, type RawImage } from './upscaleNearest.js';

export type ExportScale = 1 | 2 | 4 | 8;

/** 에디터 상태를 PNG 바이트로 인코딩한다. */
export class PngExporter {
  /** 합성된 결과를 scale 배율로 확대한 뒤 PNG 바이트를 반환. */
  encode(state: EditorState, scale: ExportScale = 1): Uint8Array {
    state.updateComposite();
    const composite = state.compositeBuffer;
    const raw: RawImage =
      scale === 1
        ? {
            width: composite.width,
            height: composite.height,
            data: new Uint8ClampedArray(composite.data),
          }
        : upscaleNearest(composite, scale);
    return pngEncode(raw.width, raw.height, raw.data);
  }

  /** PNG Blob 생성. 브라우저 환경에서만 사용. */
  encodeBlob(state: EditorState, scale: ExportScale = 1): Blob {
    const bytes = this.encode(state, scale);
    // Blob 생성자의 BlobPart 타입은 ArrayBuffer 백업 TypedArray 만 허용하므로
    // 새 ArrayBuffer 로 복사한다.
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    return new Blob([copy], { type: 'image/png' });
  }

  /** 브라우저에서 다운로드 트리거. */
  triggerDownload(state: EditorState, scale: ExportScale, filename: string): void {
    const blob = this.encodeBlob(state, scale);
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
