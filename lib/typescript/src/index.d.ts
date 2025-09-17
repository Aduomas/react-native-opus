declare global {
    /**
     * (JSI) Decodes an ArrayBuffer of concatenated Opus packets.
     */
    function __decodeMultipleOpusPackets(buffer: ArrayBuffer, packetSize: number): {
        success: boolean;
        data?: ArrayBuffer;
        error?: string;
    };
    /**
     * (JSI) Decodes a single Opus frame from an ArrayBuffer.
     */
    function __decodeOpusFrame(buffer: ArrayBuffer): {
        success: boolean;
        data?: ArrayBuffer;
        error?: string;
    };
    /**
     * (JSI) Saves raw PCM data from an ArrayBuffer to a WAV file.
     */
    function __saveArrayBufferAsWav(buffer: ArrayBuffer, filepath: string, sampleRate: number, channels: number, format: 'int16' | 'float32'): {
        success: boolean;
        filepath?: string;
        error?: string;
    };
}
/**
 * Decodes an ArrayBuffer containing multiple concatenated Opus packets.
 * This is highly efficient as it avoids Base64 encoding and data copying.
 *
 * @param opusData An ArrayBuffer containing the raw Opus packets.
 * @param packetSize The size in bytes of each individual Opus packet.
 * @returns A promise that resolves with an Int16Array of the decoded PCM audio data.
 */
export declare function decodeMultipleOpusPackets(opusData: ArrayBuffer, packetSize: number): Promise<Int16Array>;
/**
 * Initializes the frame-by-frame stream decoder. Must be called before `decodeOpusFrame`.
 * @param sampleRate The desired sample rate (e.g., 48000, 16000).
 * @param channels Number of channels (1 for mono, 2 for stereo).
 */
export declare function initializeStreamDecoder(sampleRate: number, channels: number): Promise<{
    success: boolean;
    error?: string;
}>;
/**
 * Decodes a single frame of Opus data. Use this for real-time streaming applications.
 * `initializeStreamDecoder` must have been called successfully before using this function.
 *
 * @param frameData An ArrayBuffer or Uint8Array containing a single Opus frame.
 * @returns A promise that resolves with a Float32Array of the decoded PCM audio data.
 */
export declare function decodeOpusFrame(frameData: ArrayBuffer | Uint8Array): Promise<Float32Array>;
/**
 * Saves raw PCM audio data to a WAV file at the specified path.
 *
 * @param pcmData The decoded audio data, either as Int16Array (from batch decoding) or Float32Array (from frame decoding).
 * @param filepath The full, absolute path where the WAV file should be saved.
 * @param sampleRate The sample rate of the audio (e.g., 48000).
 * @param channels The number of channels in the audio (e.g., 1 for mono).
 * @returns A promise that resolves with an object containing the final file path upon success.
 */
export declare function saveDecodedDataAsWav(pcmData: Int16Array | Float32Array, filepath: string, sampleRate: number, channels: number): Promise<{
    success: boolean;
    filepath?: string;
    error?: string;
}>;
/**
 * Resets the internal state of the main (multi-packet) decoder.
 * Call this if you want to start decoding a new, unrelated stream of packets.
 */
export declare function resetDecoderState(): Promise<{
    success: boolean;
    error?: string;
}>;
/**
 * Resets the internal state of the streaming decoder.
 */
export declare function resetOpusStreamDecoder(): Promise<{
    success: boolean;
    error?: string;
}>;
//# sourceMappingURL=index.d.ts.map