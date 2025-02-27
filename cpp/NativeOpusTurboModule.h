#if __has_include(<React-Codegen/RNOpusTurboSpecJSI.h>)
#include <React-Codegen/RNOpusTurboSpecJSI.h>
#elif __has_include("RNOpusTurboSpecJSI.h")
#include "RNOpusTurboSpecJSI.h"
#endif
#include "opus/opus.h"
#include <map>
#include <vector>
#include <chrono>
#include <string>

namespace facebook::react {
class NativeOpusTurboModule: public NativeOpusCxxSpec<NativeOpusTurboModule> {
public:
    NativeOpusTurboModule(std::shared_ptr<CallInvoker> jsInvoker);
    std::string reverseString(jsi::Runtime &rt, std::string str);
    std::vector<int> getNumbers(jsi::Runtime &rt);
    std::map<std::string, std::string> getOBject(jsi::Runtime &rt);
    jsi::Value promiseNumber(jsi::Runtime &rt, double value);
    void callMeLater(jsi::Runtime &rt, jsi::Function successCB, jsi::Function failureCB);
    std::string decodeOpus(jsi::Runtime &rt, std::string str);
    jsi::Value createOpusDecoder(jsi::Runtime &rt, double sampleRate, double channels);
    jsi::Value decodeOpusPacket(jsi::Runtime &rt, std::string packetBase64, double decoderId);
    jsi::Value destroyOpusDecoder(jsi::Runtime &rt, double decoderId);
    jsi::Value decodeOpusFile(jsi::Runtime &rt, std::string filepath, double decoderId, double chunkSize);
    jsi::Value decodeOpusData(jsi::Runtime &rt, std::string dataBase64, double decoderId, double chunkSize);
    jsi::Value saveDecodedDataAsWav(jsi::Runtime &rt, std::string decodedDataBase64, std::string filepath, double sampleRate, double channels);

private:
    // Base64 utility methods
    static std::string base64_encode(const std::vector<uint8_t>& input);
    static std::vector<uint8_t> base64_decode(const std::string& input);
    
    // Opus decoder storage
    std::map<int, OpusDecoder*> opusDecoders;
    int nextDecoderId = 1;
};
} // namespace facebook::react
