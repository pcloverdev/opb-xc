/**
 * Permissions Handler
 * Manages camera, microphone, and media library permissions
 */

import { Platform, Alert, Linking } from 'react-native';
import { Camera } from 'react-native-vision-camera';
import * as ImagePicker from 'expo-image-picker';
import type { PermissionResult, PermissionStatus, PermissionError } from '../types';

/**
 * Convert Vision Camera permission status to our unified status
 */
function convertCameraStatus(status: string): PermissionStatus {
  switch (status) {
    case 'granted':
    case 'authorized':
      return 'granted';
    case 'denied':
    case 'not-determined':
      return 'denied';
    case 'restricted':
      return 'blocked';
    default:
      return 'unknown';
  }
}

/**
 * Convert Expo permission status to our unified status
 */
function convertExpoStatus(granted: boolean, canAskAgain: boolean): PermissionStatus {
  if (granted) return 'granted';
  if (!canAskAgain) return 'blocked';
  return 'denied';
}

/**
 * Request all required permissions
 */
export async function requestAllPermissions(): Promise<PermissionResult> {
  const result: PermissionResult = {
    camera: 'unknown',
    microphone: 'unknown',
    mediaLibrary: 'unknown',
  };

  try {
    const cameraPermission = await Camera.requestCameraPermission();
    result.camera = convertCameraStatus(cameraPermission);

    const micPermission = await Camera.requestMicrophonePermission();
    result.microphone = convertCameraStatus(micPermission);

    const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    result.mediaLibrary = convertExpoStatus(
      mediaPermission.granted,
      mediaPermission.canAskAgain
    );

    return result;
  } catch (error) {
    console.error('[Permissions] Error requesting permissions:', error);
    throw error;
  }
}

/**
 * Check current permission status without requesting
 */
export async function checkPermissions(): Promise<PermissionResult> {
  try {
    const cameraStatus = await Camera.getCameraPermissionStatus();
    const micStatus = await Camera.getMicrophonePermissionStatus();
    const mediaStatus = await ImagePicker.getMediaLibraryPermissionsAsync();

    return {
      camera: convertCameraStatus(cameraStatus),
      microphone: convertCameraStatus(micStatus),
      mediaLibrary: convertExpoStatus(mediaStatus.granted, mediaStatus.canAskAgain),
    };
  } catch (error) {
    console.error('[Permissions] Error checking permissions:', error);
    return {
      camera: 'unknown',
      microphone: 'unknown',
      mediaLibrary: 'unknown',
    };
  }
}

/**
 * Validate that all required permissions are granted
 */
export function validatePermissions(permissions: PermissionResult): PermissionError | null {
  if (permissions.camera !== 'granted') {
    return {
      type: 'camera',
      status: permissions.camera,
      message: 'Camera permission is required to analyze your shooting form',
    };
  }

  if (permissions.microphone !== 'granted') {
    return {
      type: 'microphone',
      status: permissions.microphone,
      message: 'Microphone permission is required for video recording',
    };
  }

  if (permissions.mediaLibrary !== 'granted') {
    return {
      type: 'mediaLibrary',
      status: permissions.mediaLibrary,
      message: 'Media library access is required to analyze recorded videos',
    };
  }

  return null;
}

/**
 * Show permission error alert with option to open settings
 */
export function showPermissionError(error: PermissionError): void {
  const isBlocked = error.status === 'blocked';

  Alert.alert(
    'Permission Required',
    `${error.message}.${
      isBlocked
        ? ' Please enable this permission in your device settings.'
        : ' Please grant permission to continue.'
    }`,
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      ...(isBlocked
        ? [
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings(),
            },
          ]
        : [
            {
              text: 'Grant Permission',
              onPress: async () => {
                await requestAllPermissions();
              },
            },
          ]),
    ]
  );
}

/**
 * Request permissions with error handling and alerts
 */
export async function requestPermissionsWithHandling(): Promise<boolean> {
  try {
    const permissions = await requestAllPermissions();
    const error = validatePermissions(permissions);

    if (error) {
      showPermissionError(error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Permissions] Failed to request permissions:', error);
    Alert.alert(
      'Error',
      'Failed to request permissions. Please restart the app and try again.'
    );
    return false;
  }
}

/**
 * Check if camera is available and authorized
 */
export async function isCameraReady(): Promise<boolean> {
  try {
    const status = await Camera.getCameraPermissionStatus();
    return status === 'granted';
  } catch {
    return false;
  }
}
