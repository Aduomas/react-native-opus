import OpusTurboModule from './NativeOpusTurboModule';

declare global {
  function __decodeMultipleOpusPackets(
    buffer: ArrayBuffer,
    packetSize: number
  ): {
    success: boolean;
    data?: ArrayBuffer;
    error?: string;
  };

  function __decodeOpusFrame(
    buffer: ArrayBuffer
  ): {
    success: boolean;
    data?: ArrayBuffer;
    error?: string;
  };

  function __saveArrayBufferAsWav(
    buffer: ArrayBuffer,
    filepath: string,
    sampleRate: number,
    channels: number,
    format: 'int16' | 'float32'
  ): {
    success: boolean;
    filepath?: string;
    error?: string;
  };
}

const assertJSIFunction = (name: keyof typeof globalThis) => {
  if (typeof global[name] !== 'function') {
    throw new Error(
      `JSI function '${name}' is not installed. Make sure the native module 'OpusTurbo' is linked correctly and the app was rebuilt.`
    );
  }
};

export async function decodeMultipleOpusPackets(
  opusData: ArrayBuffer,
  packetSize: number
): Promise<Int16Array> {
  assertJSIFunction('__decodeMultipleOpusPackets');
  
  const result = global.__decodeMultipleOpusPackets(opusData, packetSize);
  
  if (result.success && result.data) {
    return new Int16Array(result.data);
  } else {
    throw new Error(result.error || 'Unknown error during Opus batch decoding.');
  }
}

export function initializeStreamDecoder(
  sampleRate: number,
  channels: number
): { success: boolean; error?: string } {
  return OpusTurboModule.initializeStreamDecoder(sampleRate, channels);
}

export async function decodeOpusFrame(
  frameData: ArrayBuffer | Uint8Array
): Promise<Float32Array> {
  assertJSIFunction('__decodeOpusFrame');
  
  const buffer = frameData instanceof ArrayBuffer ? frameData : frameData.buffer;
  
  const result = global.__decodeOpusFrame(buffer as ArrayBuffer);
  
  if (result.success && result.data) {
    return new Float32Array(result.data);
  } else {
    throw new Error(result.error || 'Unknown error during Opus frame decoding.');
  }
}

export async function saveDecodedDataAsWav(
  pcmData: Int16Array | Float32Array,
  filepath: string,
  sampleRate: number,
  channels: number
): Promise<{ success: boolean; filepath?: string; error?: string }> {
  assertJSIFunction('__saveArrayBufferAsWav');
  
  const format = pcmData instanceof Int16Array ? 'int16' : 'float32';
  
  const result = global.__saveArrayBufferAsWav(
    pcmData.buffer as ArrayBuffer,
    filepath,
    sampleRate,
    channels,
    format
  );
  
  if (result.success) {
    return result;
  } else {
    throw new Error(result.error || 'Unknown error while saving WAV file.');
  }
}

export function resetDecoderState(): { success: boolean; error?: string } {
  return OpusTurboModule.resetDecoderState();
}

export function resetOpusStreamDecoder(): { success: boolean; error?: string } {
  return OpusTurboModule.resetOpusStreamDecoder();
}