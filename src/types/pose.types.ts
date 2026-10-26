/**
 * Pose Detection Types
 * Defines the structure for pose landmarks and detection results
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D extends Point2D {
  z: number;
}

export interface NormalizedLandmark extends Point3D {
  visibility?: number;
  presence?: number;
}

export enum PoseLandmarkType {
  NOSE = 0,
  LEFT_EYE_INNER = 1,
  LEFT_EYE = 2,
  LEFT_EYE_OUTER = 3,
  RIGHT_EYE_INNER = 4,
  RIGHT_EYE = 5,
  RIGHT_EYE_OUTER = 6,
  LEFT_EAR = 7,
  RIGHT_EAR = 8,
  MOUTH_LEFT = 9,
  MOUTH_RIGHT = 10,
  LEFT_SHOULDER = 11,
  RIGHT_SHOULDER = 12,
  LEFT_ELBOW = 13,
  RIGHT_ELBOW = 14,
  LEFT_WRIST = 15,
  RIGHT_WRIST = 16,
  LEFT_PINKY = 17,
  RIGHT_PINKY = 18,
  LEFT_INDEX = 19,
  RIGHT_INDEX = 20,
  LEFT_THUMB = 21,
  RIGHT_THUMB = 22,
  LEFT_HIP = 23,
  RIGHT_HIP = 24,
  LEFT_KNEE = 25,
  RIGHT_KNEE = 26,
  LEFT_ANKLE = 27,
  RIGHT_ANKLE = 28,
  LEFT_HEEL = 29,
  RIGHT_HEEL = 30,
  LEFT_FOOT_INDEX = 31,
  RIGHT_FOOT_INDEX = 32,
}

export interface PoseDetectionResult {
  landmarks: NormalizedLandmark[];
  worldLandmarks?: NormalizedLandmark[];
  timestamp: number;
}

export interface PerformanceMetrics {
  fps: number;
  inferenceLatency: number;
  averageLatency: number;
  frameCount: number;
}

export interface CameraConfig {
  fps: number;
  orientation: 'landscape-left' | 'landscape-right' | 'portrait';
  format?: 'yuv' | 'rgb';
}

export interface PoseConnection {
  start: PoseLandmarkType;
  end: PoseLandmarkType;
}

export const POSE_CONNECTIONS: PoseConnection[] = [
  // Face
  { start: PoseLandmarkType.LEFT_EYE, end: PoseLandmarkType.NOSE },
  { start: PoseLandmarkType.RIGHT_EYE, end: PoseLandmarkType.NOSE },
  { start: PoseLandmarkType.LEFT_EYE, end: PoseLandmarkType.LEFT_EAR },
  { start: PoseLandmarkType.RIGHT_EYE, end: PoseLandmarkType.RIGHT_EAR },
  { start: PoseLandmarkType.MOUTH_LEFT, end: PoseLandmarkType.MOUTH_RIGHT },

  // Shoulders
  { start: PoseLandmarkType.LEFT_SHOULDER, end: PoseLandmarkType.RIGHT_SHOULDER },

  // Left Arm
  { start: PoseLandmarkType.LEFT_SHOULDER, end: PoseLandmarkType.LEFT_ELBOW },
  { start: PoseLandmarkType.LEFT_ELBOW, end: PoseLandmarkType.LEFT_WRIST },
  { start: PoseLandmarkType.LEFT_WRIST, end: PoseLandmarkType.LEFT_PINKY },
  { start: PoseLandmarkType.LEFT_WRIST, end: PoseLandmarkType.LEFT_INDEX },
  { start: PoseLandmarkType.LEFT_WRIST, end: PoseLandmarkType.LEFT_THUMB },

  // Right Arm
  { start: PoseLandmarkType.RIGHT_SHOULDER, end: PoseLandmarkType.RIGHT_ELBOW },
  { start: PoseLandmarkType.RIGHT_ELBOW, end: PoseLandmarkType.RIGHT_WRIST },
  { start: PoseLandmarkType.RIGHT_WRIST, end: PoseLandmarkType.RIGHT_PINKY },
  { start: PoseLandmarkType.RIGHT_WRIST, end: PoseLandmarkType.RIGHT_INDEX },
  { start: PoseLandmarkType.RIGHT_WRIST, end: PoseLandmarkType.RIGHT_THUMB },

  // Torso
  { start: PoseLandmarkType.LEFT_SHOULDER, end: PoseLandmarkType.LEFT_HIP },
  { start: PoseLandmarkType.RIGHT_SHOULDER, end: PoseLandmarkType.RIGHT_HIP },
  { start: PoseLandmarkType.LEFT_HIP, end: PoseLandmarkType.RIGHT_HIP },

  // Left Leg
  { start: PoseLandmarkType.LEFT_HIP, end: PoseLandmarkType.LEFT_KNEE },
  { start: PoseLandmarkType.LEFT_KNEE, end: PoseLandmarkType.LEFT_ANKLE },
  { start: PoseLandmarkType.LEFT_ANKLE, end: PoseLandmarkType.LEFT_HEEL },
  { start: PoseLandmarkType.LEFT_ANKLE, end: PoseLandmarkType.LEFT_FOOT_INDEX },

  // Right Leg
  { start: PoseLandmarkType.RIGHT_HIP, end: PoseLandmarkType.RIGHT_KNEE },
  { start: PoseLandmarkType.RIGHT_KNEE, end: PoseLandmarkType.RIGHT_ANKLE },
  { start: PoseLandmarkType.RIGHT_ANKLE, end: PoseLandmarkType.RIGHT_HEEL },
  { start: PoseLandmarkType.RIGHT_ANKLE, end: PoseLandmarkType.RIGHT_FOOT_INDEX },
];

export const KEY_BASKETBALL_LANDMARKS = [
  PoseLandmarkType.LEFT_WRIST,
  PoseLandmarkType.RIGHT_WRIST,
  PoseLandmarkType.LEFT_ELBOW,
  PoseLandmarkType.RIGHT_ELBOW,
  PoseLandmarkType.LEFT_SHOULDER,
  PoseLandmarkType.RIGHT_SHOULDER,
  PoseLandmarkType.LEFT_HIP,
  PoseLandmarkType.RIGHT_HIP,
  PoseLandmarkType.LEFT_KNEE,
  PoseLandmarkType.RIGHT_KNEE,
  PoseLandmarkType.LEFT_ANKLE,
  PoseLandmarkType.RIGHT_ANKLE,
];
