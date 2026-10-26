/**
 * SkeletonRenderer
 * High-performance Skia-based pose skeleton visualization
 * Renders joints and connections on top of camera feed
 */

import React, { useMemo } from 'react';
import { Canvas, Circle, Line, vec } from '@shopify/react-native-skia';
import type { PoseDetectionResult, NormalizedLandmark } from '../../types';
import { POSE_CONNECTIONS, KEY_BASKETBALL_LANDMARKS } from '../../types';

interface SkeletonRendererProps {
  poseResult: PoseDetectionResult | null;
  width: number;
  height: number;
  showAllLandmarks?: boolean;
  jointColor?: string;
  connectionColor?: string;
  highlightColor?: string;
}

export const SkeletonRenderer: React.FC<SkeletonRendererProps> = ({
  poseResult,
  width,
  height,
  showAllLandmarks = true,
  jointColor = '#00FF00',
  connectionColor = '#00FF00',
  highlightColor = '#FF00FF',
}) => {
  const landmarks = poseResult?.landmarks;

  const visibleLandmarks = useMemo(() => {
    if (!landmarks) return [];

    return landmarks
      .map((landmark, index) => ({
        ...landmark,
        index,
        x: landmark.x * width,
        y: landmark.y * height,
      }))
      .filter((landmark) => {
        const minVisibility = 0.5;
        return (landmark.visibility ?? 1) > minVisibility;
      });
  }, [landmarks, width, height]);

  const connections = useMemo(() => {
    if (!landmarks || visibleLandmarks.length === 0) return [];

    return POSE_CONNECTIONS.map((connection) => {
      const start = visibleLandmarks.find((l) => l.index === connection.start);
      const end = visibleLandmarks.find((l) => l.index === connection.end);

      if (!start || !end) return null;

      return {
        start: vec(start.x, start.y),
        end: vec(end.x, end.y),
      };
    }).filter((conn): conn is { start: any; end: any } => conn !== null);
  }, [landmarks, visibleLandmarks]);

  if (!poseResult || !landmarks) {
    return null;
  }

  return (
    <Canvas style={{ width, height, position: 'absolute' }}>
      {connections.map((connection, index) => (
        <Line
          key={`connection-${index}`}
          p1={connection.start}
          p2={connection.end}
          color={connectionColor}
          style="stroke"
          strokeWidth={3}
        />
      ))}

      {visibleLandmarks.map((landmark) => {
        const isKeyLandmark = KEY_BASKETBALL_LANDMARKS.includes(landmark.index);
        const radius = isKeyLandmark ? 8 : 5;
        const color = isKeyLandmark && !showAllLandmarks ? highlightColor : jointColor;

        if (!showAllLandmarks && !isKeyLandmark) {
          return null;
        }

        return (
          <Circle
            key={`landmark-${landmark.index}`}
            cx={landmark.x}
            cy={landmark.y}
            r={radius}
            color={color}
            opacity={landmark.visibility ?? 1}
          />
        );
      })}
    </Canvas>
  );
};
