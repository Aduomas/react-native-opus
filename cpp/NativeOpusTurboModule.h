#pragma once

#include <jsi/jsi.h>
#include <ReactCommon/CallInvoker.h>
#include <ReactCommon/TurboModule.h>
#include "RNOpusSpecJSI.h"

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
    ~NativeOpusTurboModule();

    void installJSIBindingsWithRuntime(jsi::Runtime &rt, std::shared_ptr<CallInvoker> callInvoker);
    
    jsi::Object initializeStreamDecoder(jsi::Runtime &rt, double sampleRate, double channels);
    jsi::Object resetDecoderState(jsi::Runtime &rt);
    jsi::Object resetOpusStreamDecoder(jsi::Runtime &rt);

private:
    jsi::Value decodeMultipleOpusPackets(jsi::Runtime &rt, const jsi::ArrayBuffer &packets, double packetSize);
    jsi::Value decodeOpusFrame(jsi::Runtime &rt, const jsi::ArrayBuffer &frame);
    jsi::Value saveArrayBufferAsWav(jsi::Runtime &rt, const jsi::ArrayBuffer &pcmData, const std::string &filepath, double sampleRate, double channels, const std::string &format);

    OpusDecoder* batchDecoder_ = nullptr;
    OpusDecoder* streamDecoder_ = nullptr;
    
    static constexpr opus_int32 DEFAULT_SAMPLE_RATE = 16000;
    static constexpr int DEFAULT_CHANNELS = 1;
    static constexpr int MAX_FRAME_SIZE = 5760;
};

} // namespace facebook::react
