/**
 * Permission Types
 * Defines permission states and request results
 */

export type PermissionStatus = 'granted' | 'denied' | 'blocked' | 'unknown';

export interface PermissionResult {
  camera: PermissionStatus;
  microphone: PermissionStatus;
  mediaLibrary: PermissionStatus;
}

export interface PermissionError {
  type: 'camera' | 'microphone' | 'mediaLibrary';
  status: PermissionStatus;
  message: string;
}
