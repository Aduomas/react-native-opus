# react-native-opus

A React Native library optimized for real-time Opus audio streaming with frame-by-frame decoding capabilities. Built specifically for streaming audio applications that require low-latency, persistent decoder state.

## Installation

```sh
npm install react-native-opus
```

## Usage

The `react-native-opus` library provides efficient frame-by-frame Opus decoding with persistent decoder state, perfect for real-time audio streaming applications.

## API Methods

### Primary Streaming API

- **`initializeStreamDecoder(sampleRate: number, channels: number)`**: Initializes the stream decoder with specified sample rate and channel count.
- **`decodeOpusFrame(frameData: Uint8Array)`**: Decodes a single Opus frame and returns Float32Array PCM data.
- **`resetOpusStreamDecoder()`**: Resets the stream decoder state.

### Legacy Batch API

- **`decodeMultipleOpusPackets(base64String: string, frameSize: number)`**: Decodes multiple Opus packets from a base64-encoded string. The `frameSize` parameter specifies the frame size in bytes.

## Examples

### Real-Time Streaming (Primary Use Case)

```js
import { 
  initializeStreamDecoder, 
  decodeOpusFrame, 
  resetOpusStreamDecoder 
} from 'react-native-opus';

async function streamDecodeAudio() {
  try {
    // Initialize stream decoder for 16kHz mono audio
    const initResult = await initializeStreamDecoder(16000, 1);
    if (!initResult.success) {
      throw new Error(initResult.error);
    }

    // Decode individual frames as they arrive
    const frameData = new Uint8Array([/* your opus frame bytes */]);
    const decodeResult = await decodeOpusFrame(frameData);
    
    if (decodeResult.success && decodeResult.pcmData) {
      console.log(`Decoded ${decodeResult.samplesDecoded} samples`);
      console.log('PCM data:', decodeResult.pcmData); // Float32Array
      
      // Process PCM data for real-time playback
      processAudioData(decodeResult.pcmData);
    }

    // Reset decoder when stream ends
    await resetOpusStreamDecoder();
  } catch (error) {
    console.error("Error streaming decode:", error);
  }
}

streamDecodeAudio();
```

### Streaming with Audio Processing

```js
import { 
  initializeStreamDecoder, 
  decodeOpusFrame 
} from 'react-native-opus';

class OpusStreamer {
  constructor() {
    this.initialized = false;
  }

  async initialize(sampleRate = 16000, channels = 1) {
    const result = await initializeStreamDecoder(sampleRate, channels);
    this.initialized = result.success;
    return result;
  }

  async processFrame(opusFrame) {
    if (!this.initialized) {
      throw new Error('Decoder not initialized');
    }

    const result = await decodeOpusFrame(opusFrame);
    
    if (result.success && result.pcmData) {
      // Direct access to Float32Array PCM data
      return {
        pcm: result.pcmData,
        samples: result.samplesDecoded,
        timestamp: Date.now()
      };
    }
    
    throw new Error(result.error || 'Decode failed');
  }
}

// Usage
const streamer = new OpusStreamer();
await streamer.initialize(16000, 1);

// Process frames as they arrive
const audioData = await streamer.processFrame(frameBytes);
playAudio(audioData.pcm);
```

## Key Features

- **🎯 Real-Time Streaming**: Optimized for frame-by-frame decoding with persistent decoder state
- **⚡ Low Latency**: Minimal processing overhead for real-time audio applications
- **🔄 Float32Array Output**: Direct PCM data ready for audio processing and playback
- **📱 Cross-Platform**: Native TurboModule implementation for iOS and Android
- **🧠 Memory Efficient**: Optimized buffer management for mobile devices
- **🔧 Easy Integration**: Simple API designed for streaming audio applications
- **🔄 Persistent State**: Decoder maintains state across frames for continuous streams

## Use Cases

- **Real-time voice communication apps**
- **Audio streaming applications**
- **Voice memo recording/playback**
- **Live audio processing**
- **Bluetooth audio streaming**
- **WebRTC audio pipelines**

## Contributing

See the [contributing guide](CONTRIBUTING.md) for details on contributing.

## License

MIT
