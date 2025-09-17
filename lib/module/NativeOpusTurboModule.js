import { TurboModuleRegistry } from 'react-native';
// Note: The high-performance decoding functions are not part of the spec because
// they are injected directly via JSI and bypass the TurboModule bridge for performance.
export default TurboModuleRegistry.getEnforcing('OpusTurbo');
//# sourceMappingURL=NativeOpusTurboModule.js.map