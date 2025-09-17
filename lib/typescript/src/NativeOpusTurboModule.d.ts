import type { TurboModule } from 'react-native';
export interface Spec extends TurboModule {
    /**
     * Initializes the frame-by-frame stream decoder with a specific sample rate and channel count.
     * This is a standard TurboModule method.
     * @param sampleRate The sample rate to decode at (e.g., 48000, 16000).
     * @param channels The number of channels (1 for mono, 2 for stereo).
     */
    initializeStreamDecoder(sampleRate: number, channels: number): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Resets the internal state of the main Opus decoder.
     * This is a standard TurboModule method.
     */
    resetDecoderState(): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Resets the internal state of the frame-by-frame stream decoder.
     * This is a standard TurboModule method.
     */
    resetOpusStreamDecoder(): Promise<{
        success: boolean;
        error?: string;
    }>;
}
declare const _default: Spec;
export default _default;
//# sourceMappingURL=NativeOpusTurboModule.d.ts.map