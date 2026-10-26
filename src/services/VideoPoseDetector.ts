/**
 * VideoPoseDetector
 * JS bridge to the native module that extracts a frame from a video file at a
 * given timestamp and runs MediaPipe Pose Landmarker (IMAGE mode) on it.
 */

import { NativeModules } from 'react-native';
import type { NormalizedLandmark, PoseDetectionResult } from '../types';

interface VideoPoseDetectorModule {
  detectPoseInFrame(uri: string, timestampMs: number): Promise<NormalizedLandmark[]>;
}

const VideoPoseDetector = NativeModules.VideoPoseDetector as VideoPoseDetectorModule | undefined;

/**
 * Detects a pose in the video frame at `timestampMs`.
 * Returns `null` if the native module is unavailable (e.g. running before a
 * native build) — callers can treat that as "no overlay".
 */
export async function detectPoseInVideoFrame(
  uri: string,
  timestampMs: number
): Promise<PoseDetectionResult | null> {
  if (!VideoPoseDetector) {
    console.warn(
      '[VideoPoseDetector] Native module unavailable. Run a native build (npx expo run:ios / run:android).'
    );
    return null;
  }

  const landmarks = await VideoPoseDetector.detectPoseInFrame(uri, Math.max(0, Math.round(timestampMs)));
  return { landmarks: landmarks ?? [], timestamp: Date.now() };
}

export const isVideoPoseDetectorAvailable = (): boolean => VideoPoseDetector != null;
