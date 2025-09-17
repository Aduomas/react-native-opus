/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Pressable,
  Alert,
  useColorScheme,
} from 'react-native';
import {
  decodeMultipleOpusPackets,
  initializeStreamDecoder,
  decodeOpusFrame,
} from 'react-native-opus'; // Assuming your library is 'react-native-opus'
import { Buffer } from 'buffer'; // Import Buffer to handle Base64 decoding

// --- Data Preparation ---
// The original hardcoded base64 Opus string.
const BASE64_OPUS_STRING =
  'uA3h1qD6BNyQQaeaz4swEG+XHNgqhWbncGOgmzi4gqsM1711/j5+abgOBe9pOrbHBo5lmump9wE+3x91yI4/Yk4pK1LZUT11nOc50WV/1PS4DhEgJfmFU2BhZaj1QwuXqwdkP0mEby+/mm+pccXy9n7FSw/IJ6MsuBomEXSjlOJ238qLOTUfsRf0CLMq3247Amh+KA0LHBBJ1+GKZqVWWrgantUAwgPUMZuL+tVTI7gBTwupR3ea48LzdFuPS3yUMyHZ5FsAkSm4Dl6pFFnRR6LY+UCoMTBNb2DZHplGKtv/F+PK2XbW9fwgM4/PRK4q';

// Decode the Base64 string into a raw binary buffer ONCE.
// The .buffer property gives us the underlying ArrayBuffer needed by our JSI functions.
const OPUS_ARRAY_BUFFER = Buffer.from(BASE64_OPUS_STRING, 'base64').buffer;

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [decodedResult, setDecodedResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamResult, setStreamResult] = useState<string | null>(null);
  const [isStreamLoading, setIsStreamLoading] = useState(false);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#000000' : '#F5F5F5',
    flex: 1,
  };

  const handleDecodePress = async () => {
    setIsLoading(true);
    setDecodedResult(null);
    console.log('Attempting to decode ArrayBuffer...');
    try {
      // --- UPDATED CALL ---
      // Pass the prepared ArrayBuffer directly. The packet size is 40.
      const pcmData = await decodeMultipleOpusPackets(OPUS_ARRAY_BUFFER, 40);

      console.log('Decoding successful, received Int16Array:', pcmData);
      
      // --- UPDATED RESULT HANDLING ---
      // Displaying raw PCM data is not user-friendly. Show a success message instead.
      setDecodedResult(`Success! Decoded ${pcmData.length} PCM samples.`);

    } catch (error) {
      console.error('Decoding failed:', error);
      setDecodedResult(null);
      Alert.alert(
        'Decoding Error',
        error instanceof Error ? error.message : 'An unknown error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleStreamDecodePress = async () => {
    setIsStreamLoading(true);
    setStreamResult(null);
    console.log('Attempting to stream decode...');
    try {
      // Initialize stream decoder (API is the same)
      const initResult = await initializeStreamDecoder(16000, 1);
      console.log('Stream decoder initialized:', initResult);

      if (!initResult.success) {
        throw new Error(initResult.error || 'Failed to initialize stream decoder');
      }

      // --- UPDATED FRAME PREPARATION ---
      // Create a single frame from our ArrayBuffer (first 40 bytes)
      const frameData = new Uint8Array(OPUS_ARRAY_BUFFER.slice(0, 40));

      // --- UPDATED CALL ---
      // Decode the frame by passing the Uint8Array directly
      const pcmDataFrame = await decodeOpusFrame(frameData);

      console.log('Frame decode successful, received Float32Array:', pcmDataFrame);

      // --- UPDATED RESULT HANDLING ---
      // A successful promise returns the data directly. Failure throws an error.
      setStreamResult(`Stream decode succeeded! Decoded ${pcmDataFrame.length} float samples.`);

    } catch (error) {
      console.error('Stream decoding failed:', error);
      setStreamResult(null);
      Alert.alert(
        'Stream Decoding Error',
        error instanceof Error ? error.message : 'An unknown error occurred'
      );
    } finally {
      setIsStreamLoading(false);
    }
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={backgroundStyle.backgroundColor} />
      <View style={styles.container}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            isDarkMode ? styles.buttonDark : styles.buttonLight,
            pressed && (isDarkMode ? styles.buttonDarkPressed : styles.buttonLightPressed),
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleDecodePress}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, isDarkMode ? styles.buttonTextDark : styles.buttonTextLight]}>
            {isLoading ? 'Decoding...' : 'Decode Opus Buffer'}
          </Text>
        </Pressable>
        {decodedResult && (
           <Text style={[styles.resultText, isDarkMode ? styles.resultTextDark : styles.resultTextLight]}>
             {decodedResult}
           </Text>
        )}
        
        <Pressable
          style={({ pressed }) => [
            styles.button,
            isDarkMode ? styles.buttonDark : styles.buttonLight,
            pressed && (isDarkMode ? styles.buttonDarkPressed : styles.buttonLightPressed),
            isStreamLoading && styles.buttonDisabled,
          ]}
          onPress={handleStreamDecodePress}
          disabled={isStreamLoading}
        >
          <Text style={[styles.buttonText, isDarkMode ? styles.buttonTextDark : styles.buttonTextLight]}>
            {isStreamLoading ? 'Decoding...' : 'Test Stream Decode'}
          </Text>
        </Pressable>
        {streamResult && (
           <Text style={[styles.resultText, isDarkMode ? styles.resultTextDark : styles.resultTextLight]}>
             {streamResult}
           </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

// Styles remain the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonDark: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
  },
  buttonLight: {
    backgroundColor: '#000000',
    shadowColor: '#000000',
  },
  buttonDarkPressed: {
     backgroundColor: '#EAEAEA',
     transform: [{ scale: 0.98 }],
  },
  buttonLightPressed: {
     backgroundColor: '#333333',
     transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  buttonTextDark: {
    color: '#000000',
  },
  buttonTextLight: {
     color: '#FFFFFF',
  },
  resultText: {
    marginTop: 20,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  resultTextDark: {
    color: '#D8D8D8',
  },
  resultTextLight: {
    color: '#333333',
  },
});

export default App;