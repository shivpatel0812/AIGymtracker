import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';
export const isAndroid = Platform.OS === 'android';
export const isIOS = Platform.OS === 'ios';
export const isNative = !isWeb;

export const safeRequire = (moduleName: string) => {
  try {
    return require(moduleName);
  } catch (error) {
    console.warn(`Module ${moduleName} not available on this platform`);
    return null;
  }
};

export const withPlatformCheck = <T>(fn: () => T, fallback: T): T => {
  try {
    return fn();
  } catch (error) {
    console.warn('Platform-specific feature not available:', error);
    return fallback;
  }
};