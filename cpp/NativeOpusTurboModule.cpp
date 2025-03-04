#include "NativeOpusTurboModule.h"
#include <algorithm>
#include <cstdlib>
#include <string>

namespace facebook::react {

NativeOpusTurboModule::NativeOpusTurboModule(std::shared_ptr<CallInvoker> jsinvoker)
    : NativeOpusTurboCxxSpec(std::move(jsinvoker)) {}

std::string NativeOpusTurboModule::reverseString(jsi::Runtime &rt, std::string str) {
    std::reverse(str.begin(), str.end());
    return str;
}

std::vector<int> NativeOpusTurboModule::getNumbers(jsi::Runtime &rt) {
    std::vector<int> numbers;
    for (int i = 0; i < 10; ++i) {
        numbers.push_back(i);
    }
    return numbers;
}

std::map<std::string, std::string> NativeOpusTurboModule::getOBject(jsi::Runtime &rt) {
    return { {"result", "success"} };
}

jsi::Value NativeOpusTurboModule::promiseNumber(jsi::Runtime &rt, double number) {
    jsi::Function promiseConstructor = rt.global().getPropertyAsFunction(rt, "Promise");
    return promiseConstructor.callAsConstructor(rt,
        jsi::Function::createFromHostFunction(
            rt,
            jsi::PropNameID::forAscii(rt, "promiseArg"),
            2,
            [number](jsi::Runtime& runtime,
                     const jsi::Value& thisValue,
                     const jsi::Value* arguments,
                     std::size_t count) -> jsi::Value {
                jsi::Function resolve = arguments[0].asObject(runtime).asFunction(runtime);
                resolve.call(runtime, number);
                return jsi::Value::undefined();
            }
        )
    );
}

void NativeOpusTurboModule::callMeLater(jsi::Runtime &rt, jsi::Function successCB, jsi::Function failureCB) {
    bool callSuccess = std::rand() % 2;
    if (callSuccess) {
        successCB.call(rt);
    } else {
        failureCB.call(rt);
    }
}

std::string NativeOpusTurboModule::decodeOpus(jsi::Runtime &rt, std::string str) {
    return "Decoded: " + str;
}

// Base64 encoding/decoding utility methods
std::string NativeOpusTurboModule::base64_encode(const std::vector<uint8_t>& input) {
    static const char* encoding_table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    static const int mod_table[] = {0, 2, 1};
    
    size_t input_length = input.size();
    size_t output_length = 4 * ((input_length + 2) / 3);
    
    std::string encoded_data(output_length, '\0');
    size_t i, j;
    
    for (i = 0, j = 0; i < input_length;) {
        uint32_t octet_a = i < input_length ? input[i++] : 0;
        uint32_t octet_b = i < input_length ? input[i++] : 0;
        uint32_t octet_c = i < input_length ? input[i++] : 0;
        
        uint32_t triple = (octet_a << 16) + (octet_b << 8) + octet_c;
        
        encoded_data[j++] = encoding_table[(triple >> 18) & 0x3F];
        encoded_data[j++] = encoding_table[(triple >> 12) & 0x3F];
        encoded_data[j++] = encoding_table[(triple >> 6) & 0x3F];
        encoded_data[j++] = encoding_table[triple & 0x3F];
    }
    
    for (i = 0; i < mod_table[input_length % 3]; i++)
        encoded_data[output_length - 1 - i] = '=';
    
    return encoded_data;
}

std::vector<uint8_t> NativeOpusTurboModule::base64_decode(const std::string& input) {
    static const int decoding_table[256] = {
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, 62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1,
        -1, -1, -1, -1, -1,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14,
        15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1, -1, 26, 27, 28,
        29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48,
        49, 50, 51, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1
    };
    
    size_t input_length = input.size();
    if (input_length % 4 != 0) return {};
    
    size_t output_length = input_length / 4 * 3;
    if (input.length() >= 1 && input[input_length - 1] == '=') output_length--;
    if (input.length() >= 2 && input[input_length - 2] == '=') output_length--;
    
    std::vector<uint8_t> decoded_data(output_length);
    
    for (size_t i = 0, j = 0; i < input_length;) {
        uint32_t sextet_a = input[i] == '=' ? 0 & i++ : decoding_table[static_cast<int>(input[i++])];
        uint32_t sextet_b = input[i] == '=' ? 0 & i++ : decoding_table[static_cast<int>(input[i++])];
        uint32_t sextet_c = input[i] == '=' ? 0 & i++ : decoding_table[static_cast<int>(input[i++])];
        uint32_t sextet_d = input[i] == '=' ? 0 & i++ : decoding_table[static_cast<int>(input[i++])];
        
        uint32_t triple = (sextet_a << 18) + (sextet_b << 12) + (sextet_c << 6) + sextet_d;
        
        if (j < output_length) decoded_data[j++] = (triple >> 16) & 0xFF;
        if (j < output_length) decoded_data[j++] = (triple >> 8) & 0xFF;
        if (j < output_length) decoded_data[j++] = triple & 0xFF;
    }
    
    return decoded_data;
}

jsi::Value NativeOpusTurboModule::createOpusDecoder(jsi::Runtime &rt, double sampleRate, double channels) {
    int error = 0;
    OpusDecoder* decoder = opus_decoder_create((opus_int32)sampleRate, (int)channels, &error);
    
    jsi::Object result = jsi::Object(rt);
    
    if (error != OPUS_OK || !decoder) {
        result.setProperty(rt, "success", false);
        result.setProperty(rt, "error", jsi::String::createFromUtf8(rt, "Failed to create Opus decoder"));
        return result;
    }
    
    int decoderId = nextDecoderId++;
    opusDecoders[decoderId] = decoder;
    
    result.setProperty(rt, "success", true);
    result.setProperty(rt, "decoderId", decoderId);
    return result;
}

jsi::Value NativeOpusTurboModule::decodeOpusPacket(jsi::Runtime &rt, std::string packetBase64, double decoderId) {
    int id = (int)decoderId;
    jsi::Object result = jsi::Object(rt);
    
    if (opusDecoders.find(id) == opusDecoders.end()) {
        result.setProperty(rt, "success", false);
        result.setProperty(rt, "error", jsi::String::createFromUtf8(rt, "Invalid decoder ID"));
        return result;
    }
    
    OpusDecoder* decoder = opusDecoders[id];
    
    // Decode base64 string to bytes
    std::vector<uint8_t> inputData = base64_decode(packetBase64);
    
    if (inputData.empty()) {
        result.setProperty(rt, "success", false);
        result.setProperty(rt, "error", jsi::String::createFromUtf8(rt, "Empty or invalid base64 input"));
        return result;
    }
    
    // Create output buffer (you mentioned 40 bytes → 320 bytes)
    // For 48kHz stereo, we'll allocate enough space
    opus_int16 outputBuffer[960]; // 10ms of 48kHz stereo audio
    
    // Decode the packet
    int samplesDecoded = opus_decode(decoder, 
                                  inputData.data(), 
                                  inputData.size(), 
                                  outputBuffer, 
                                  960,  // Max frame size
                                  0);   // No FEC
    
    if (samplesDecoded < 0) {
        result.setProperty(rt, "success", false);
        result.setProperty(rt, "error", jsi::String::createFromUtf8(rt, "Decoding error"));
        return result;
    }
    
    // Calculate output size in bytes (each sample is 2 bytes)
    size_t outputSize = samplesDecoded * sizeof(opus_int16);
    
    // Convert decoded PCM data to base64
    std::vector<uint8_t> outputBytes(reinterpret_cast<uint8_t*>(outputBuffer), 
                                   reinterpret_cast<uint8_t*>(outputBuffer) + outputSize);
    std::string outputBase64 = base64_encode(outputBytes);
    
    result.setProperty(rt, "success", true);
    result.setProperty(rt, "decodedDataBase64", jsi::String::createFromUtf8(rt, outputBase64));
    result.setProperty(rt, "samplesDecoded", samplesDecoded);
    return result;
}

jsi::Value NativeOpusTurboModule::destroyOpusDecoder(jsi::Runtime &rt, double decoderId) {
    int id = (int)decoderId;
    jsi::Object result = jsi::Object(rt);
    
    if (opusDecoders.find(id) == opusDecoders.end()) {
        result.setProperty(rt, "success", false);
        result.setProperty(rt, "error", jsi::String::createFromUtf8(rt, "Invalid decoder ID"));
        return result;
    }
    
    opus_decoder_destroy(opusDecoders[id]);
    opusDecoders.erase(id);
    
    result.setProperty(rt, "success", true);
    return result;
}

jsi::Value NativeOpusTurboModule::decodeOpusFile(jsi::Runtime &rt, std::string filepath, double decoderId, double chunkSize) {
    int id = (int)decoderId;
    jsi::Object result = jsi::Object(rt);
    
    // Validate decoder ID
    if (opusDecoders.find(id) == opusDecoders.end()) {
        result.setProperty(rt, "success", false);
        result.setProperty(rt, "error", jsi::String::createFromUtf8(rt, "Invalid decoder ID"));
        return result;
    }
    
    OpusDecoder* decoder = opusDecoders[id];
    
    // Start timer for performance measurement
    auto startTime = std::chrono::high_resolution_clock::now();
    
    try {
        // Open file
        FILE* file = fopen(filepath.c_str(), "rb");
        if (!file) {
            result.setProperty(rt, "success", false);
            result.setProperty(rt, "error", jsi::String::createFromUtf8(rt, "Failed to open file"));
            return result;
        }
        
        // Get file size
        fseek(file, 0, SEEK_END);
        long fileSize = ftell(file);
        fseek(file, 0, SEEK_SET);
        
        // Prepare buffers for decoding
        int chunkSizeInt = (int)chunkSize;
        std::vector<uint8_t> inputBuffer(chunkSizeInt);
        std::vector<opus_int16> outputBuffer;
        outputBuffer.reserve(fileSize * 8); // Estimate output size (40 bytes -> ~320 bytes)
        
        int totalSamplesDecoded = 0;
        
        // Process file in chunks
        while (!feof(file)) {
            size_t bytesRead = fread(inputBuffer.data(), 1, chunkSizeInt, file);
            if (bytesRead == 0) break;
            
            // Resize input buffer to actual bytes read
            if (bytesRead < chunkSizeInt) {
                inputBuffer.resize(bytesRead);
            }
            
            // Temporary buffer for decoded samples
            opus_int16 tempBuffer[960]; // 10ms of 48kHz stereo audio
            
            // Decode the packet
            int samplesDecoded = opus_decode(
                decoder, 
                inputBuffer.data(), 
                bytesRead, 
                tempBuffer, 
                960,  // Max frame size
                0     // No FEC
            );
            
            if (samplesDecoded < 0) {
                // Handle error but continue processing
                continue;
            }
            
            // Add decoded samples to output buffer
            outputBuffer.insert(
                outputBuffer.end(),
                tempBuffer,
                tempBuffer + samplesDecoded
            );
            
            totalSamplesDecoded += samplesDecoded;
        }
        
        fclose(file);
        
        // Calculate output size in bytes (each sample is 2 bytes)
        size_t outputSize = outputBuffer.size() * sizeof(opus_int16);
        
        // Convert decoded PCM data to base64
        std::vector<uint8_t> outputBytes(
            reinterpret_cast<uint8_t*>(outputBuffer.data()), 
            reinterpret_cast<uint8_t*>(outputBuffer.data()) + outputSize
        );
        
        std::string outputBase64 = base64_encode(outputBytes);
        
        // End timer and calculate processing time
        auto endTime = std::chrono::high_resolution_clock::now();
        double processingTime = std::chrono::duration<double, std::milli>(endTime - startTime).count();
        
        // Return results
        result.setProperty(rt, "success", true);
        result.setProperty(rt, "decodedDataBase64", jsi::String::createFromUtf8(rt, outputBase64));
        result.setProperty(rt, "samplesDecoded", totalSamplesDecoded);
        result.setProperty(rt, "processingTimeMs", processingTime);
        
    } catch (const std::exception& e) {
        result.setProperty(rt, "success", false);
        result.setProperty(rt, "error", jsi::String::createFromUtf8(rt, e.what()));
    }
    
    return result;
}

jsi::Value NativeOpusTurboModule::decodeOpusData(jsi::Runtime &rt, std::string dataBase64, double decoderId, double chunkSize) {
    int id = (int)decoderId;
    jsi::Object result = jsi::Object(rt);
    
    // Validate decoder ID
    if (opusDecoders.find(id) == opusDecoders.end()) {
        result.setProperty(rt, "success", false);
        result.setProperty(rt, "error", jsi::String::createFromUtf8(rt, "Invalid decoder ID"));
        return result;
    }
    
    OpusDecoder* decoder = opusDecoders[id];
    
    // Start timer for performance measurement
    auto startTime = std::chrono::high_resolution_clock::now();
    
    try {
        // Decode base64 input data
        std::vector<uint8_t> inputData = base64_decode(dataBase64);
        
        if (inputData.empty()) {
            result.setProperty(rt, "success", false);
            result.setProperty(rt, "error", jsi::String::createFromUtf8(rt, "Empty or invalid base64 input"));
            return result;
        }
        
        // Prepare buffers for decoding
        int chunkSizeInt = (int)chunkSize;
        std::vector<opus_int16> outputBuffer;
        outputBuffer.reserve(inputData.size() * 8); // Estimate output size (40 bytes -> ~320 bytes)
        
        int totalSamplesDecoded = 0;
        
        // Process data in chunks
        for (size_t offset = 0; offset < inputData.size(); offset += chunkSizeInt) {
            // Calculate size of this chunk
            size_t chunkBytes = std::min(chunkSizeInt, (int)(inputData.size() - offset));
            
            // Temporary buffer for decoded samples
            opus_int16 tempBuffer[960]; // 10ms of 48kHz stereo audio
            
            // Decode the packet
            int samplesDecoded = opus_decode(
                decoder, 
                inputData.data() + offset, 
                chunkBytes, 
                tempBuffer, 
                960,  // Max frame size
                0     // No FEC
            );
            
            if (samplesDecoded < 0) {
                // Handle error but continue processing
                continue;
            }
            
            // Add decoded samples to output buffer
            outputBuffer.insert(
                outputBuffer.end(),
                tempBuffer,
                tempBuffer + samplesDecoded
            );
            
            totalSamplesDecoded += samplesDecoded;
        }
        
        // Calculate output size in bytes (each sample is 2 bytes)
        size_t outputSize = outputBuffer.size() * sizeof(opus_int16);
        
        // Convert decoded PCM data to base64
        std::vector<uint8_t> outputBytes(
            reinterpret_cast<uint8_t*>(outputBuffer.data()), 
            reinterpret_cast<uint8_t*>(outputBuffer.data()) + outputSize
        );
        
        std::string outputBase64 = base64_encode(outputBytes);
        
        // End timer and calculate processing time
        auto endTime = std::chrono::high_resolution_clock::now();
        double processingTime = std::chrono::duration<double, std::milli>(endTime - startTime).count();
        
        // Return results
        result.setProperty(rt, "success", true);
        result.setProperty(rt, "decodedDataBase64", jsi::String::createFromUtf8(rt, outputBase64));
        result.setProperty(rt, "samplesDecoded", totalSamplesDecoded);
        result.setProperty(rt, "processingTimeMs", processingTime);
        
    } catch (const std::exception& e) {
        result.setProperty(rt, "success", false);
        result.setProperty(rt, "error", jsi::String::createFromUtf8(rt, e.what()));
    }
    
    return result;
}

jsi::Value NativeOpusTurboModule::saveDecodedDataAsWav(jsi::Runtime &rt, std::string decodedDataBase64, std::string filepath, double sampleRate, double channels) {
    jsi::Object result = jsi::Object(rt);
    
    try {
        // Decode base64 to PCM data
        std::vector<uint8_t> decodedBytes = base64_decode(decodedDataBase64);
        
        // PCM data is 16-bit samples
        size_t numSamples = decodedBytes.size() / 2;
        
        // Open file for writing
        FILE* file = fopen(filepath.c_str(), "wb");
        if (!file) {
            result.setProperty(rt, "success", false);
            result.setProperty(rt, "error", jsi::String::createFromUtf8(rt, "Failed to open output file"));
            return result;
        }
        
        // WAV Header constants
        const char* RIFF = "RIFF";
        const char* WAVE = "WAVE";
        const char* FMT = "fmt ";
        const char* DATA = "data";
        
        // WAV file header calculation
        int sampleRateInt = static_cast<int>(sampleRate);
        int channelsInt = static_cast<int>(channels);
        int bitsPerSample = 16;  // PCM 16-bit
        int byteRate = sampleRateInt * channelsInt * bitsPerSample / 8;
        int blockAlign = channelsInt * bitsPerSample / 8;
        int dataSize = decodedBytes.size();
        int fileSize = 36 + dataSize;  // 36 is the size of the WAV header minus 8
        
        // Write WAV header
        // RIFF chunk
        fwrite(RIFF, 1, 4, file);
        fwrite(&fileSize, 4, 1, file);
        fwrite(WAVE, 1, 4, file);
        
        // fmt chunk
        fwrite(FMT, 1, 4, file);
        int fmtSize = 16;  // PCM format size
        fwrite(&fmtSize, 4, 1, file);
        short audioFormat = 1;  // PCM = 1
        fwrite(&audioFormat, 2, 1, file);
        fwrite(&channelsInt, 2, 1, file);
        fwrite(&sampleRateInt, 4, 1, file);
        fwrite(&byteRate, 4, 1, file);
        fwrite(&blockAlign, 2, 1, file);
        fwrite(&bitsPerSample, 2, 1, file);
        
        // data chunk
        fwrite(DATA, 1, 4, file);
        fwrite(&dataSize, 4, 1, file);
        
        // Write the actual PCM data
        fwrite(decodedBytes.data(), 1, decodedBytes.size(), file);
        
        fclose(file);
        
        result.setProperty(rt, "success", true);
        result.setProperty(rt, "filepath", jsi::String::createFromUtf8(rt, filepath));
        
    } catch (const std::exception& e) {
        result.setProperty(rt, "success", false);
        result.setProperty(rt, "error", jsi::String::createFromUtf8(rt, e.what()));
    }
    
    return result;
}

} // namespace facebook::react
