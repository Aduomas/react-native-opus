import type { TurboModule } from 'react-native';
export interface Spec extends TurboModule {
    initializeStreamDecoder(sampleRate: number, channels: number): Promise<{
        success: boolean;
        error?: string;
    }>;
    resetDecoderState(): Promise<{
        success: boolean;
        error?: string;
    }>;
    resetOpusStreamDecoder(): Promise<{
        success: boolean;
        error?: string;
    }>;
}
declare const _default: Spec;
export default _default;
//# sourceMappingURL=NativeOpusTurboModule.d.ts.map