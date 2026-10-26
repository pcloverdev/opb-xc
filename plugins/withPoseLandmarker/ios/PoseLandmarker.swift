//
//  PoseLandmarker.swift
//  opb
//
//  VisionCamera Frame Processor Plugin that runs MediaPipe Pose Landmarker
//  on each camera frame and returns 33 normalized body landmarks.
//
//  Registered from JS as `detectPose` (see PoseLandmarker.m).
//  The VisionCamera / Frame types are exposed to Swift via the bridging header
//  (opb-Bridging-Header.h), so no `import VisionCamera` is required here.
//

import Foundation
import CoreMedia
import MediaPipeTasksVision

@objc(PoseLandmarker)
public class PoseLandmarker: FrameProcessorPlugin {

  private var landmarker: MediaPipeTasksVision.PoseLandmarker?

  public override init(proxy: VisionCameraProxyHolder, options: [AnyHashable: Any]! = [:]) {
    super.init(proxy: proxy, options: options)
    setupLandmarker(options: options)
  }

  private func setupLandmarker(options: [AnyHashable: Any]?) {
    guard let modelPath = Bundle.main.path(forResource: "pose_landmarker_lite", ofType: "task") else {
      NSLog("[PoseLandmarker] Model file pose_landmarker_lite.task not found in bundle.")
      return
    }

    let detectionConfidence = (options?["minDetectionConfidence"] as? NSNumber)?.floatValue ?? 0.5
    let presenceConfidence = (options?["minTrackingConfidence"] as? NSNumber)?.floatValue ?? 0.5

    let landmarkerOptions = PoseLandmarkerOptions()
    landmarkerOptions.baseOptions.modelAssetPath = modelPath
    landmarkerOptions.runningMode = .video
    landmarkerOptions.numPoses = 1
    landmarkerOptions.minPoseDetectionConfidence = detectionConfidence
    landmarkerOptions.minPosePresenceConfidence = presenceConfidence
    landmarkerOptions.minTrackingConfidence = presenceConfidence

    do {
      landmarker = try MediaPipeTasksVision.PoseLandmarker(options: landmarkerOptions)
      NSLog("[PoseLandmarker] Initialized successfully.")
    } catch {
      NSLog("[PoseLandmarker] Failed to initialize: \(error.localizedDescription)")
    }
  }

  public override func callback(_ frame: Frame, withArguments arguments: [AnyHashable: Any]?) -> Any? {
    guard let landmarker = landmarker else { return nil }

    let buffer = frame.buffer
    let timestampMs = Int(CMTimeGetSeconds(CMSampleBufferGetPresentationTimeStamp(buffer)) * 1000)

    do {
      let image = try MPImage(sampleBuffer: buffer, orientation: frame.orientation)
      let result = try landmarker.detect(videoFrame: image, timestampInMilliseconds: timestampMs)

      guard let pose = result.landmarks.first else {
        return [] // No person detected in this frame.
      }

      return pose.map { landmark -> [String: Any] in
        return [
          "x": landmark.x,
          "y": landmark.y,
          "z": landmark.z,
          "visibility": landmark.visibility?.floatValue ?? 1.0,
        ]
      }
    } catch {
      NSLog("[PoseLandmarker] Detection error: \(error.localizedDescription)")
      return nil
    }
  }
}
