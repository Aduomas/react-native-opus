#include "NativeOpusTurboModule.h"
#include <vector>
#include <cstring>
#include <cstdio>

namespace facebook::react {

NativeOpusTurboModule::NativeOpusTurboModule(std::shared_ptr<CallInvoker> jsInvoker)
    : NativeOpusTurboModuleCxxSpec(std::move(jsInvoker)) {
    int error = 0;
    batchDecoder_ = opus_decoder_create(DEFAULT_SAMPLE_RATE, DEFAULT_CHANNELS, &error);
    if (error != OPUS_OK || !batchDecoder_) {
        batchDecoder_ = nullptr;
    }
}

NativeOpusTurboModule::~NativeOpusTurboModule() {
    if (batchDecoder_) {
        opus_decoder_destroy(batchDecoder_);
        batchDecoder_ = nullptr;
    }
    if (streamDecoder_) {
        opus_decoder_destroy(streamDecoder_);
        streamDecoder_ = nullptr;
    }
}

void NativeOpusTurboModule::installJSIBindingsWithRuntime(jsi::Runtime &rt, std::shared_ptr<CallInvoker> callInvoker) {
    auto decodeMultipleFunc = jsi::Function::createFromHostFunction(
        rt,
        jsi::PropNameID::forAscii(rt, "__decodeMultipleOpusPackets"),
        2,
        [this](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *args, size_t count) -> jsi::Value {
            if (count != 2 || !args[0].isObject() || !args[0].asObject(rt).isArrayBuffer(rt) || !args[1].isNumber()) {
                throw jsi::JSError(rt, "Invalid arguments for __decodeMultipleOpusPackets");
            }
            auto buffer = args[0].asObject(rt).getArrayBuffer(rt);
            double packetSize = args[1].asNumber();
            return this->decodeMultipleOpusPackets(rt, buffer, packetSize);
        });
    rt.global().setProperty(rt, "__decodeMultipleOpusPackets", std::move(decodeMultipleFunc));

    auto decodeFrameFunc = jsi::Function::createFromHostFunction(
        rt,
        jsi::PropNameID::forAscii(rt, "__decodeOpusFrame"),
        1,
        [this](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *args, size_t count) -> jsi::Value {
            if (count != 1 || !args[0].isObject() || !args[0].asObject(rt).isArrayBuffer(rt)) {
                throw jsi::JSError(rt, "Invalid arguments for __decodeOpusFrame");
            }
            auto buffer = args[0].asObject(rt).getArrayBuffer(rt);
            return this->decodeOpusFrame(rt, buffer);
        });
    rt.global().setProperty(rt, "__decodeOpusFrame", std::move(decodeFrameFunc));

    auto saveWavFunc = jsi::Function::createFromHostFunction(
        rt,
        jsi::PropNameID::forAscii(rt, "__saveArrayBufferAsWav"),
        5,
        [this](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *args, size_t count) -> jsi::Value {
            if (count != 5 || !args[0].isObject() || !args[0].asObject(rt).isArrayBuffer(rt) || !args[1].isString()) {
                throw jsi::JSError(rt, "Invalid arguments for __saveArrayBufferAsWav");
            }
            auto buffer = args[0].asObject(rt).getArrayBuffer(rt);
            auto filepath = args[1].asString(rt).utf8(rt);
            double sampleRate = args[2].asNumber();
            double channels = args[3].asNumber();
            auto format = args[4].asString(rt).utf8(rt);
            return this->saveArrayBufferAsWav(rt, buffer, filepath, sampleRate, channels, format);
        });
    rt.global().setProperty(rt, "__saveArrayBufferAsWav", std::move(saveWavFunc));
}

jsi::Value NativeOpusTurboModule::decodeMultipleOpusPackets(jsi::Runtime &rt, const jsi::ArrayBuffer &packets, double packetSize) {
    jsi::Object result(rt);
    if (!batchDecoder_) {
        result.setProperty(rt, "success", false);
        result.setProperty(rt, "error", jsi::String::createFromUtf8(rt, "Batch decoder not initialized"));
        return result;
    }
    
    int packetSizeInt = static_cast<int>(packetSize);
    if (packetSizeInt <= 0) {
        result.setProperty(rt, "success", false);
        result.setProperty(rt, "error", jsi::String::createFromUtf8(rt, "Packet size must be positive"));
        return result;
    }

    const unsigned char* inputData = packets.data(rt);
    size_t inputSize = packets.size(rt);
    std::vector<opus_int16> pcmOutput;
    pcmOutput.reserve(inputSize * 20);

    for (size_t offset = 0; (offset + packetSizeInt) <= inputSize; offset += packetSizeInt) {
        opus_int16 frameBuffer[MAX_FRAME_SIZE * DEFAULT_CHANNELS];
        int samplesDecoded = opus_decode(
            batchDecoder_,
            inputData + offset,
            packetSizeInt,
            frameBuffer,
            MAX_FRAME_SIZE,
            0
        );

        if (samplesDecoded > 0) {
            pcmOutput.insert(pcmOutput.end(), frameBuffer, frameBuffer + samplesDecoded * DEFAULT_CHANNELS);
        }
    }

    size_t outputByteLength = pcmOutput.size() * sizeof(opus_int16);
    
    // Create ArrayBuffer using JavaScript constructor
    auto arrayBufferCtor = rt.global().getPropertyAsFunction(rt, "ArrayBuffer");
    auto bufferObject = arrayBufferCtor.callAsConstructor(rt, static_cast<int>(outputByteLength)).asObject(rt);
    auto decodedBuffer = bufferObject.getArrayBuffer(rt);
    memcpy(decodedBuffer.data(rt), pcmOutput.data(), outputByteLength);
    
    result.setProperty(rt, "success", true);
    result.setProperty(rt, "data", std::move(bufferObject));
    return result;
}

jsi::Value NativeOpusTurboModule::decodeOpusFrame(jsi::Runtime &rt, const jsi::ArrayBuffer &frame) {
    jsi::Object result(rt);
    if (!streamDecoder_) {
        result.setProperty(rt, "success", false);
        result.setProperty(rt, "error", jsi::String::createFromUtf8(rt, "Stream decoder not initialized. Call initializeStreamDecoder first"));
        return result;
    }

    float pcmBuffer[MAX_FRAME_SIZE * DEFAULT_CHANNELS];
    int samplesDecoded = opus_decode_float(
        streamDecoder_,
        frame.data(rt),
        static_cast<opus_int32>(frame.size(rt)),
        pcmBuffer,
        MAX_FRAME_SIZE,
        0
    );

    if (samplesDecoded < 0) {
        result.setProperty(rt, "success", false);
        result.setProperty(rt, "error", jsi::String::createFromUtf8(rt, opus_strerror(samplesDecoded)));
        return result;
    }

    size_t outputByteLength = samplesDecoded * DEFAULT_CHANNELS * sizeof(float);
    
    // Create ArrayBuffer using JavaScript constructor
    auto arrayBufferCtor = rt.global().getPropertyAsFunction(rt, "ArrayBuffer");
    auto bufferObject = arrayBufferCtor.callAsConstructor(rt, static_cast<int>(outputByteLength)).asObject(rt);
    auto decodedBuffer = bufferObject.getArrayBuffer(rt);
    memcpy(decodedBuffer.data(rt), pcmBuffer, outputByteLength);

    result.setProperty(rt, "success", true);
    result.setProperty(rt, "data", std::move(bufferObject));
    return result;
}

jsi::Value NativeOpusTurboModule::saveArrayBufferAsWav(jsi::Runtime &rt, const jsi::ArrayBuffer &pcmData, const std::string &filepath, double sampleRate, double channels, const std::string &format) {
    jsi::Object result(rt);
    FILE* file = fopen(filepath.c_str(), "wb");
    if (!file) {
        result.setProperty(rt, "success", false);
        result.setProperty(rt, "error", jsi::String::createFromUtf8(rt, "Failed to open output file"));
        return result;
    }

    int sampleRateInt = static_cast<int>(sampleRate);
    int channelsInt = static_cast<int>(channels);
    int bitsPerSample = 16;
    int dataSize = static_cast<int>(pcmData.size(rt));

    fwrite("RIFF", 1, 4, file);
    int chunkSize = 36 + dataSize;
    fwrite(&chunkSize, 4, 1, file);
    fwrite("WAVE", 1, 4, file);
    fwrite("fmt ", 1, 4, file);
    int subchunk1Size = 16;
    fwrite(&subchunk1Size, 4, 1, file);
    short audioFormat = 1;
    fwrite(&audioFormat, 2, 1, file);
    short numChannels = static_cast<short>(channelsInt);
    fwrite(&numChannels, 2, 1, file);
    fwrite(&sampleRateInt, 4, 1, file);
    int byteRate = sampleRateInt * channelsInt * bitsPerSample / 8;
    fwrite(&byteRate, 4, 1, file);
    short blockAlign = static_cast<short>(channelsInt * bitsPerSample / 8);
    fwrite(&blockAlign, 2, 1, file);
    short bps = static_cast<short>(bitsPerSample);
    fwrite(&bps, 2, 1, file);
    fwrite("data", 1, 4, file);
    fwrite(&dataSize, 4, 1, file);

    fwrite(pcmData.data(rt), 1, dataSize, file);
    fclose(file);

    result.setProperty(rt, "success", true);
    result.setProperty(rt, "filepath", jsi::String::createFromUtf8(rt, filepath));
    return result;
}

jsi::Object NativeOpusTurboModule::initializeStreamDecoder(jsi::Runtime &rt, double sampleRate, double channels) {
    jsi::Object result(rt);
    if (streamDecoder_) {
        opus_decoder_destroy(streamDecoder_);
        streamDecoder_ = nullptr;
    }

    int error = 0;
    streamDecoder_ = opus_decoder_create(static_cast<opus_int32>(sampleRate), static_cast<int>(channels), &error);

    if (error != OPUS_OK || !streamDecoder_) {
        result.setProperty(rt, "success", false);
        result.setProperty(rt, "error", jsi::String::createFromUtf8(rt, opus_strerror(error)));
        streamDecoder_ = nullptr;
    } else {
        result.setProperty(rt, "success", true);
    }
    return result;
}

jsi::Object NativeOpusTurboModule::resetDecoderState(jsi::Runtime &rt) {
    jsi::Object result(rt);
    if (!batchDecoder_) {
        result.setProperty(rt, "success", false);
        result.setProperty(rt, "error", jsi::String::createFromUtf8(rt, "Batch decoder not initialized"));
        return result;
    }
    int error = opus_decoder_ctl(batchDecoder_, OPUS_RESET_STATE);
    result.setProperty(rt, "success", error == OPUS_OK);
    if (error != OPUS_OK) {
        result.setProperty(rt, "error", jsi::String::createFromUtf8(rt, opus_strerror(error)));
    }
    return result;
}

jsi::Object NativeOpusTurboModule::resetOpusStreamDecoder(jsi::Runtime &rt) {
    jsi::Object result(rt);
    if (!streamDecoder_) {
        result.setProperty(rt, "success", false);
        result.setProperty(rt, "error", jsi::String::createFromUtf8(rt, "Stream decoder not initialized"));
        return result;
    }
    int error = opus_decoder_ctl(streamDecoder_, OPUS_RESET_STATE);
    result.setProperty(rt, "success", error == OPUS_OK);
    if (error != OPUS_OK) {
        result.setProperty(rt, "error", jsi::String::createFromUtf8(rt, opus_strerror(error)));
    }
    return result;
}

} // namespace facebook::react
