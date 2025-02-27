import { useState, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import RNFS from 'react-native-fs';
import {
  createOpusDecoder,
  decodeOpusPacket,
  destroyOpusDecoder,
  decodeOpusFile,
  decodeOpusData,
  saveDecodedDataAsWav,
} from 'react-native-opus';

const SAMPLE_RATES = [8000, 12000, 16000, 24000, 48000];

export default function App() {
  // State for decoder configuration
  const [sampleRate, setSampleRate] = useState<number>(16000);
  const [chunkSize, setChunkSize] = useState<string>('40'); // Fixed from '4096' to '40'
  const [filename, setFilename] = useState<string>('30minutes.opus');
  const [decodeMethod, setDecodeMethod] = useState<'js' | 'native'>('native');

  // State for decoder status
  const [decoderId, setDecoderId] = useState<number | null>(null);
  const [status, setStatus] = useState<string>('Ready');
  const [loading, setLoading] = useState<boolean>(false);
  const [timeTaken, setTimeTaken] = useState<number>(0);
  const [nativeProcessingTime, setNativeProcessingTime] = useState<number>(0);

  // State for decoded data
  const [totalBytesDecoded, setTotalBytesDecoded] = useState<number>(0);
  const [totalSamplesDecoded, setTotalSamplesDecoded] = useState<number>(0);
  const [decodedDataBase64, setDecodedDataBase64] = useState<string | null>(
    null
  );
  const [wavFilePath, setWavFilePath] = useState<string | null>(null);

  const measureTime = useCallback(async function <T>(
    fn: () => Promise<T>
  ): Promise<T> {
    setLoading(true);
    const start = performance.now();
    try {
      const res = await fn();
      const end = performance.now();
      const _timeTaken = end - start;
      console.log('Time taken:', _timeTaken, 'ms');
      setTimeTaken(_timeTaken);
      return res;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateDecoder = async () => {
    try {
      setStatus('Initializing decoder...');
      console.log(
        `Creating decoder with sample rate ${sampleRate}Hz and 1 channel`
      );
      const result = await createOpusDecoder(sampleRate, 1);

      if (result.success) {
        setDecoderId(result.decoderId ?? null);
        setStatus(`Decoder initialized with ID: ${result.decoderId}`);
      } else {
        setStatus(`Failed to initialize: ${result.error}`);
        console.error('Decoder initialization failed:', result.error);
      }
    } catch (error) {
      if (error instanceof Error) {
        setStatus(`Error: ${error.message}`);
      } else {
        setStatus('An unknown error occurred');
      }
      console.error('Decoder initialization error:', error);
    }
  };

  const handleDecodeFile = async () => {
    if (decoderId === null) {
      setStatus('Please initialize the decoder first');
      return;
    }

    try {
      await measureTime(async () => {
        setStatus(
          `Starting ${decodeMethod === 'native' ? 'native' : 'JavaScript'} decoding process...`
        );
        setTotalBytesDecoded(0);
        setTotalSamplesDecoded(0);
        setNativeProcessingTime(0);

        let filePath;
        if (Platform.OS === 'android') {
          filePath = `${RNFS.DocumentDirectoryPath}/${filename}`;
          const exists = await RNFS.exists(filePath);
          if (!exists) {
            try {
              await RNFS.copyFileAssets(filename, filePath);
              setStatus('Opus file copied to: ' + filePath);
            } catch (err) {
              // setStatus('Error copying Opus file: ' + err.message);
              console.error('Failed to copy asset:', err);
              return;
            }
          }
        } else {
          filePath = RNFS.MainBundlePath + '/' + filename;
          const exists = await RNFS.exists(filePath);
          if (!exists) {
            setStatus('Opus file not found in bundle');
            console.error('Opus file not found in bundle');
            return;
          }
        }

        if (decodeMethod === 'native') {
          setStatus('Decoding file natively...');
          const result = await decodeOpusFile(
            filePath,
            decoderId,
            parseInt(chunkSize, 10)
          );

          if (result.success) {
            setTotalBytesDecoded(
              (result.decodedDataBase64?.length || 0) * 0.75
            );
            setTotalSamplesDecoded(result.samplesDecoded || 0);
            setNativeProcessingTime(result.processingTimeMs || 0);
            setDecodedDataBase64(result.decodedDataBase64 || null);
            setStatus(
              `Native decoding completed: ${result.samplesDecoded} samples`
            );
          } else {
            setStatus(`Native decoding failed: ${result.error}`);
          }
        } else {
          const fileStats = await RNFS.stat(filePath);
          const fileSize = fileStats.size;
          setStatus(`File size: ${fileSize} bytes`);

          const chunkSizeNum = parseInt(chunkSize, 10);
          let position = 0;
          let totalBytes = 0;
          let totalSamples = 0;

          while (position < fileSize) {
            const length = Math.min(chunkSizeNum, fileSize - position);

            try {
              const chunkData = await RNFS.read(
                filePath,
                length,
                position,
                'base64'
              );
              const result = await decodeOpusPacket(chunkData, decoderId);

              if (result.success) {
                totalBytes += (result.decodedDataBase64?.length || 0) * 0.75;
                totalSamples += result.samplesDecoded || 0;

                if (
                  position % (chunkSizeNum * 1000) === 0 ||
                  position + length >= fileSize
                ) {
                  const progress = Math.round((position / fileSize) * 100);
                  setStatus(
                    `JS Decoding: ${progress}% (${position}/${fileSize} bytes)`
                  );
                }
              } else {
                console.warn(
                  `Decoding error at position ${position}: ${result.error}`
                );
              }
            } catch (error) {
              // console.error(`Error at position ${position}: ${error.message}`);
            }

            position += length;
          }

          setTotalBytesDecoded(totalBytes);
          setTotalSamplesDecoded(totalSamples);
          setStatus(
            `JS decoding completed: ${totalSamples} samples (${totalBytes} bytes)`
          );
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        setStatus(`Error: ${error.message}`);
      } else {
        setStatus('An unknown error occurred');
      }
      console.error('Decoding error:', error);
    }
  };

  const handleDecodeFileAsData = async () => {
    if (decoderId === null) {
      setStatus('Please initialize the decoder first');
      return;
    }

    try {
      await measureTime(async () => {
        setStatus('Starting native data decoding...');
        setTotalBytesDecoded(0);
        setTotalSamplesDecoded(0);
        setNativeProcessingTime(0);

        let filePath;
        if (Platform.OS === 'android') {
          filePath = `${RNFS.DocumentDirectoryPath}/${filename}`;
          const exists = await RNFS.exists(filePath);
          if (!exists) {
            try {
              await RNFS.copyFileAssets(filename, filePath);
              setStatus('Opus file copied to: ' + filePath);
            } catch (err) {
              // setStatus('Error copying Opus file: ' + err.message);
              console.error('Failed to copy asset:', err);
              return;
            }
          }
        } else {
          filePath = RNFS.MainBundlePath + '/' + filename;
          const exists = await RNFS.exists(filePath);
          if (!exists) {
            setStatus('Opus file not found in bundle');
            console.error('Opus file not found in bundle');
            return;
          }
        }

        const fileData = await RNFS.readFile(filePath, 'base64');
        setStatus(`File read: ${fileData.length} base64 chars`);

        const result = await decodeOpusData(
          fileData,
          decoderId,
          parseInt(chunkSize, 10)
        );

        if (result.success) {
          setTotalBytesDecoded((result.decodedDataBase64?.length || 0) * 0.75);
          setTotalSamplesDecoded(result.samplesDecoded || 0);
          setNativeProcessingTime(result.processingTimeMs || 0);
          setDecodedDataBase64(result.decodedDataBase64 || null);
          setStatus(
            `Native data decoding completed: ${result.samplesDecoded} samples`
          );
        } else {
          setStatus(`Native data decoding failed: ${result.error}`);
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        setStatus(`Error: ${error.message}`);
      } else {
        setStatus('An unknown error occurred');
      }
      console.error('Decoding error:', error);
    }
  };

  const handleSaveWav = async () => {
    if (!decodedDataBase64) {
      setStatus('No decoded data to save');
      return;
    }

    try {
      setStatus('Saving WAV file...');

      const outputDirectory =
        Platform.OS === 'android'
          ? RNFS.ExternalDirectoryPath
          : RNFS.DocumentDirectoryPath;

      const wavFileName = filename.replace(/\.[^/.]+$/, '') + '.wav';
      const outputPath = `${outputDirectory}/${wavFileName}`;

      const result = await saveDecodedDataAsWav(
        decodedDataBase64,
        outputPath,
        sampleRate,
        1
      );

      if (result.success) {
        setWavFilePath(result.filepath || null);
        setStatus(`WAV file saved to: ${result.filepath}`);
      } else {
        setStatus(`Failed to save WAV file: ${result.error}`);
      }
    } catch (error) {
      // setStatus(`Error saving WAV file: ${error.message}`);
      console.error('WAV saving error:', error);
    }
  };

  const handleDestroyDecoder = async () => {
    if (decoderId === null) {
      setStatus('No decoder to destroy');
      return;
    }

    try {
      const result = await destroyOpusDecoder(decoderId);
      if (result.success) {
        setDecoderId(null);
        setStatus('Decoder destroyed successfully');
      } else {
        setStatus(`Failed to destroy decoder: ${result.error}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        setStatus(`Error: ${error.message}`);
      } else {
        setStatus('An unknown error occurred');
      }
      console.error('Destroy decoder error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Opus Decoder Test</Text>

        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>Status:</Text>
          <Text style={styles.statusText}>{status}</Text>

          <Text style={styles.resultText}>Decoder ID:</Text>
          <Text style={styles.valueText}>
            {decoderId !== null ? decoderId : 'Not initialized'}
          </Text>

          <Text style={styles.resultText}>JS Processing Time:</Text>
          <Text style={styles.timeText}>
            {timeTaken > 0
              ? `${Math.round((timeTaken / 1000) * 100) / 100} s`
              : 'Not measured'}
          </Text>

          {nativeProcessingTime > 0 && (
            <>
              <Text style={styles.resultText}>Native Processing Time:</Text>
              <Text style={styles.timeText}>
                {`${Math.round((nativeProcessingTime / 1000) * 100) / 100} s`}
              </Text>
            </>
          )}

          <Text style={styles.resultText}>Decoded Data:</Text>
          <Text style={styles.valueText}>
            {totalBytesDecoded > 0
              ? `${Math.round(totalBytesDecoded).toLocaleString()} bytes / ${totalSamplesDecoded.toLocaleString()} samples`
              : 'No data decoded'}
          </Text>

          {wavFilePath && (
            <>
              <Text style={styles.resultText}>WAV File:</Text>
              <Text style={styles.valueText}>{wavFilePath}</Text>
            </>
          )}
        </View>

        <View style={styles.controlsContainer}>
          <Text style={styles.labelText}>Sample Rate (Hz):</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={sampleRate}
              onValueChange={(itemValue) => setSampleRate(Number(itemValue))}
              style={styles.picker}
              enabled={decoderId === null}
            >
              {SAMPLE_RATES.map((rate) => (
                <Picker.Item key={rate} label={`${rate}`} value={rate} />
              ))}
            </Picker>
          </View>

          <Text style={styles.labelText}>Chunk Size (bytes):</Text>
          <TextInput
            style={styles.textInput}
            value={chunkSize}
            onChangeText={setChunkSize}
            keyboardType="numeric"
            editable={!loading}
          />

          <Text style={styles.labelText}>Filename:</Text>
          <TextInput
            style={styles.textInput}
            value={filename}
            onChangeText={setFilename}
            editable={!loading}
          />

          <Text style={styles.labelText}>Decode Method:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={decodeMethod}
              onValueChange={(itemValue) =>
                setDecodeMethod(itemValue as 'js' | 'native')
              }
              style={styles.picker}
              enabled={!loading}
            >
              <Picker.Item label="Native (File)" value="native" />
              <Picker.Item label="JavaScript (Chunks)" value="js" />
            </Picker>
          </View>
        </View>

        {loading && (
          <ActivityIndicator
            size="large"
            color="#6200ee"
            style={styles.loader}
          />
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              (decoderId !== null || loading) && styles.disabledButton,
            ]}
            disabled={decoderId !== null || loading}
            onPress={handleCreateDecoder}
          >
            <Text style={styles.buttonText}>Create Decoder</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              (decoderId === null || loading) && styles.disabledButton,
            ]}
            disabled={decoderId === null || loading}
            onPress={handleDecodeFile}
          >
            <Text style={styles.buttonText}>
              {decodeMethod === 'native'
                ? 'Decode File (Native)'
                : 'Decode File (JS)'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              (decoderId === null || loading) && styles.disabledButton,
            ]}
            disabled={decoderId === null || loading}
            onPress={handleDecodeFileAsData}
          >
            <Text style={styles.buttonText}>Decode Binary Data</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              (!decodedDataBase64 || loading) && styles.disabledButton,
            ]}
            disabled={!decodedDataBase64 || loading}
            onPress={handleSaveWav}
          >
            <Text style={styles.buttonText}>Save as WAV</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              (decoderId === null || loading) && styles.disabledButton,
            ]}
            disabled={decoderId === null || loading}
            onPress={handleDestroyDecoder}
          >
            <Text style={styles.buttonText}>Destroy Decoder</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  resultContainer: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  controlsContainer: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  resultText: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 5,
    color: '#555',
  },
  labelText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 5,
    color: '#555',
  },
  statusText: {
    fontSize: 16,
    color: '#6200ee',
    fontWeight: '500',
    marginVertical: 5,
  },
  valueText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginVertical: 5,
  },
  timeText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6200ee',
    marginVertical: 5,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#f8f8f8',
  },
  picker: {
    height: 50,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f8f8f8',
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    backgroundColor: '#6200ee',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#6200ee',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    shadowOpacity: 0.1,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  loader: {
    marginVertical: 20,
  },
});
