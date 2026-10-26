/**
 * Pose Frame Processor
 * Runs the native MediaPipe Pose Landmarker VisionCamera plugin on each camera
 * frame (on the worklet thread) and dispatches results back to the JS thread.
 */

import { useMemo } from 'react';
import {
  useFrameProcessor,
  VisionCameraProxy,
  runAtTargetFps,
} from 'react-native-vision-camera';
import type { Frame } from 'react-native-vision-camera';
import { Worklets } from 'react-native-worklets-core';
import type { NormalizedLandmark, PoseDetectionResult } from '../types';

// Native plugin registered as `detectPose` on iOS (PoseLandmarker.m) and
// Android (MainApplication). Returns an array of { x, y, z, visibility }.
const plugin = VisionCameraProxy.initFrameProcessorPlugin('detectPose', {
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});

function detectPoseNative(frame: Frame): NormalizedLandmark[] | null {
  'worklet';
  if (plugin == null) {
    throw new Error(
      'Failed to load "detectPose" frame processor plugin. Did you run a native build after adding the config plugin?'
    );
  }
  return plugin.call(frame) as unknown as NormalizedLandmark[] | null;
}

/**
 * Callback invoked on the JS thread with each detected pose and the measured
 * native inference latency (ms).
 */
export type OnPoseFrame = (result: PoseDetectionResult, latencyMs: number) => void;

/**
 * Returns a VisionCamera frame processor that detects poses at `targetFps`.
 */
export function usePoseFrameProcessor(onPoseFrame: OnPoseFrame, targetFps: number = 30) {
  const dispatch = useMemo(
    () =>
      Worklets.createRunOnJS((landmarks: NormalizedLandmark[], latencyMs: number) => {
        onPoseFrame({ landmarks, timestamp: Date.now() }, latencyMs);
      }),
    [onPoseFrame]
  );

  return useFrameProcessor(
    (frame) => {
      'worklet';
      runAtTargetFps(targetFps, () => {
        'worklet';
        const start = performance.now();
        const landmarks = detectPoseNative(frame);
        const latencyMs = performance.now() - start;

        if (landmarks == null) {
          return;
        }
        dispatch(landmarks, latencyMs);
      });
    },
    [dispatch, targetFps]
  );
}
