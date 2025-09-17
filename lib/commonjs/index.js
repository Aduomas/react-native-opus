"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.decodeMultipleOpusPackets = decodeMultipleOpusPackets;
exports.decodeOpusFrame = decodeOpusFrame;
exports.initializeStreamDecoder = initializeStreamDecoder;
exports.resetDecoderState = resetDecoderState;
exports.resetOpusStreamDecoder = resetOpusStreamDecoder;
exports.saveDecodedDataAsWav = saveDecodedDataAsWav;
var _reactNative = require("react-native");
// Get the native module instance. This is used for the non-JSI spec methods.
const OpusTurboModule = _reactNative.TurboModuleRegistry.getEnforcing('OpusTurbo');

// --- JSI-Bound Function Declarations ---
// We declare the C++ functions that were injected into the global scope.
// This tells TypeScript that they exist and what their signatures are.

/**
 * A safety check to ensure the JSI functions have been installed before use.
 * Throws a descriptive error if the function is missing.
 * @param name The name of the global function to check.
 */
const assertJSIFunction = name => {
  if (typeof global[name] !== 'function') {
    throw new Error(`JSI function '${name}' is not installed. Make sure the native module 'OpusTurbo' is linked correctly and the app was rebuilt.`);
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
async function decodeMultipleOpusPackets(opusData, packetSize) {
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
function initializeStreamDecoder(sampleRate, channels) {
  return OpusTurboModule.initializeStreamDecoder(sampleRate, channels);
}

/**
 * Decodes a single frame of Opus data. Use this for real-time streaming applications.
 * `initializeStreamDecoder` must have been called successfully before using this function.
 *
 * @param frameData An ArrayBuffer or Uint8Array containing a single Opus frame.
 * @returns A promise that resolves with a Float32Array of the decoded PCM audio data.
 */
async function decodeOpusFrame(frameData) {
  assertJSIFunction('__decodeOpusFrame');

  // Ensure the input is an ArrayBuffer for the JSI function.
  const buffer = frameData instanceof ArrayBuffer ? frameData : frameData.buffer;

  // FIX #1: Cast the 'ArrayBufferLike' type to the specific 'ArrayBuffer' type we promised.
  const result = global.__decodeOpusFrame(buffer);
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
async function saveDecodedDataAsWav(pcmData, filepath, sampleRate, channels) {
  assertJSIFunction('__saveArrayBufferAsWav');
  const format = pcmData instanceof Int16Array ? 'int16' : 'float32';

  // FIX #2: Cast the 'ArrayBufferLike' type to the specific 'ArrayBuffer' type we promised.
  const result = global.__saveArrayBufferAsWav(pcmData.buffer, filepath, sampleRate, channels, format);
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
function resetDecoderState() {
  return OpusTurboModule.resetDecoderState();
}

/**
 * Resets the internal state of the streaming decoder.
 */
function resetOpusStreamDecoder() {
  return OpusTurboModule.resetOpusStreamDecoder();
}
//# sourceMappingURL=index.js.map