import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  initializeStreamDecoder(sampleRate: number, channels: number): { success: boolean; error?: string };
  resetDecoderState(): { success: boolean; error?: string };
  resetOpusStreamDecoder(): { success: boolean; error?: string };
}

declare global {
  function __decodeMultipleOpusPackets(buffer: ArrayBuffer, packetSize: number): {
    success: boolean;
    data?: ArrayBuffer;
    error?: string;
  };
  
  function __decodeOpusFrame(frameBuffer: ArrayBuffer): {
    success: boolean;
    data?: ArrayBuffer;
    error?: string;
  };
  
  function __saveArrayBufferAsWav(
    buffer: ArrayBuffer,
    filepath: string,
    sampleRate: number,
    channels: number,
    format: string
  ): {
    success: boolean;
    filepath?: string;
    error?: string;
  };
}

export default TurboModuleRegistry.getEnforcing<Spec>('OpusTurbo');