#pragma once

#include <jsi/jsi.h>
#include <ReactCommon/CallInvoker.h>
#include <ReactCommon/TurboModule.h>
#include "RNOpusSpecJSI.h" // Assumes codegen is run

#if __has_include("opus/opus.h")
#include "opus/opus.h"
#elif __has_include("opus.h")
#include "opus.h"
#else
#error "Could not find opus.h"
#endif

namespace facebook::react {

class NativeOpusTurboModule : public NativeOpusTurboModuleCxxSpec<NativeOpusTurboModule> {
public:
    static constexpr const char* kModuleName = "OpusTurbo";

    NativeOpusTurboModule(std::shared_ptr<CallInvoker> jsInvoker);

    // This method is called by the TurboModule infrastructure when the JS context is ready.
    void setJSIRuntime(jsi::Runtime &rt) override;

private:
    // All our previous JSI-bound functions remain the same
    jsi::Value decodeMultipleOpusPackets(jsi::Runtime &rt, const jsi::ArrayBuffer &packets, double packetSize);
    jsi::Value decodeOpusFrame(jsi::Runtime &rt, const jsi::ArrayBuffer &frame);
    jsi::Value saveDecodedDataAsWav(jsi::Runtime &rt, const jsi::ArrayBuffer &pcmData, const std::string &filepath, double sampleRate, double channels);

    // Other methods from the spec
    jsi::Value resetDecoderState(jsi::Runtime &rt);
    jsi::Value initializeStreamDecoder(jsi::Runtime &rt, double sampleRate, double channels);
    jsi::Value resetOpusStreamDecoder(jsi::Runtime &rt);

    // Decoder instances
    OpusDecoder* batchDecoder_ = nullptr;
    OpusDecoder* streamDecoder_ = nullptr;
    
    static constexpr opus_int32 DEFAULT_SAMPLE_RATE = 48000;
    static constexpr int DEFAULT_CHANNELS = 1;
    static constexpr int MAX_FRAME_SIZE = 5760;
};

} // namespace facebook::react