import { TurboModuleRegistry } from 'react-native';
import type { Spec } from './NativeOpusTurboModule';

// Get the native module instance. This is used for the non-JSI spec methods.
const OpusTurboModule = TurboModuleRegistry.getEnforcing<Spec>('OpusTurbo');

// --- JSI-Bound Function Declarations ---
// We declare the C++ functions that were injected into the global scope.
// This tells TypeScript that they exist and what their signatures are.
declare global {
  /**
   * (JSI) Decodes an ArrayBuffer of concatenated Opus packets.
   */
  function __decodeMultipleOpusPackets(
    buffer: ArrayBuffer,
    packetSize: number
  ): {
    success: boolean;
    data?: ArrayBuffer; // Decoded 16-bit PCM audio
    error?: string;
  };

  /**
   * (JSI) Decodes a single Opus frame from an ArrayBuffer.
   */
  function __decodeOpusFrame(
    buffer: ArrayBuffer
  ): {
    success: boolean;
    data?: ArrayBuffer; // Decoded 32-bit float PCM audio
    error?: string;
  };

  /**
   * (JSI) Saves raw PCM data from an ArrayBuffer to a WAV file.
   */
  function __saveArrayBufferAsWav(
    buffer: ArrayBuffer,
    filepath: string,
    sampleRate: number,
    channels: number,
    // The C++ side currently defaults to Int16, but we pass the format for future use.
    format: 'int16' | 'float32'
  ): {
    success: boolean;
    filepath?: string;
    error?: string;
  };
}

/**
 * A safety check to ensure the JSI functions have been installed before use.
 * Throws a descriptive error if the function is missing.
 * @param name The name of the global function to check.
 */
const assertJSIFunction = (name: keyof typeof globalThis) => {
  if (typeof global[name] !== 'function') {
    throw new Error(
      `JSI function '${name}' is not installed. Make sure the native module 'OpusTurbo' is linked correctly and the app was rebuilt.`
    );
  }
};

/**
 * Decodes an ArrayBuffer containing multiple concatenated Opus packets.
 * This is highly efficient as it avoids Base64 encoding and data copying.
 *
 * @param opusData An ArrayBuffer containing the raw Opus packets.
 * @param packetSize The size in bytes of each individual Opus packet.
 * @returns A promise that resolves with an Int16Array of the decoded PCM audio data.
 */
export async function decodeMultipleOpusPackets(
  opusData: ArrayBuffer,
  packetSize: number
): Promise<Int16Array> {
  assertJSIFunction('__decodeMultipleOpusPackets');
  
  const result = global.__decodeMultipleOpusPackets(opusData, packetSize);
  
  if (result.success && result.data) {
    // Wrap the raw ArrayBuffer in a TypedArray for easy use.
    return new Int16Array(result.data);
  } else {
    throw new Error(result.error || 'Unknown error during Opus batch decoding.');
  }
}

/**
 * Initializes the frame-by-frame stream decoder. Must be called before `decodeOpusFrame`.
 * @param sampleRate The desired sample rate (e.g., 48000, 16000).
 * @param channels Number of channels (1 for mono, 2 for stereo).
 */
export function initializeStreamDecoder(
  sampleRate: number,
  channels: number
): Promise<{ success: boolean; error?: string }> {
  return OpusTurboModule.initializeStreamDecoder(sampleRate, channels);
}

/**
 * Decodes a single frame of Opus data. Use this for real-time streaming applications.
 * `initializeStreamDecoder` must have been called successfully before using this function.
 *
 * @param frameData An ArrayBuffer or Uint8Array containing a single Opus frame.
 * @returns A promise that resolves with a Float32Array of the decoded PCM audio data.
 */
export async function decodeOpusFrame(
  frameData: ArrayBuffer | Uint8Array
): Promise<Float32Array> {
  assertJSIFunction('__decodeOpusFrame');
  
  // Ensure the input is an ArrayBuffer for the JSI function.
  const buffer = frameData instanceof ArrayBuffer ? frameData : frameData.buffer;
  
  // FIX #1: Cast the 'ArrayBufferLike' type to the specific 'ArrayBuffer' type we promised.
  const result = global.__decodeOpusFrame(buffer as ArrayBuffer);
  
  if (result.success && result.data) {
    return new Float32Array(result.data);
  } else {
    throw new Error(result.error || 'Unknown error during Opus frame decoding.');
  }
}

/**
 * Saves raw PCM audio data to a WAV file at the specified path.
 *
 * @param pcmData The decoded audio data, either as Int16Array (from batch decoding) or Float32Array (from frame decoding).
 * @param filepath The full, absolute path where the WAV file should be saved.
 * @param sampleRate The sample rate of the audio (e.g., 48000).
 * @param channels The number of channels in the audio (e.g., 1 for mono).
 * @returns A promise that resolves with an object containing the final file path upon success.
 */
export async function saveDecodedDataAsWav(
  pcmData: Int16Array | Float32Array,
  filepath: string,
  sampleRate: number,
  channels: number
): Promise<{ success: boolean; filepath?: string; error?: string }> {
  assertJSIFunction('__saveArrayBufferAsWav');
  
  const format = pcmData instanceof Int16Array ? 'int16' : 'float32';
  
  // FIX #2: Cast the 'ArrayBufferLike' type to the specific 'ArrayBuffer' type we promised.
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

/**
 * Resets the internal state of the main (multi-packet) decoder.
 * Call this if you want to start decoding a new, unrelated stream of packets.
 */
export function resetDecoderState(): Promise<{ success: boolean; error?: string }> {
  return OpusTurboModule.resetDecoderState();
}

/**
 * Resets the internal state of the streaming decoder.
 */
export function resetOpusStreamDecoder(): Promise<{ success: boolean; error?: string }> {
  return OpusTurboModule.resetOpusStreamDecoder();
}