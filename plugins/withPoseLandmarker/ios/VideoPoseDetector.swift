//
//  VideoPoseDetector.swift
//  opb
//
//  React Native module that extracts a frame from a video file at a given
//  timestamp and runs MediaPipe Pose Landmarker (IMAGE mode) on it.
//
//  Exposed to JS as `NativeModules.VideoPoseDetector` (see VideoPoseDetector.m).
//

import Foundation
import UIKit
import AVFoundation
import MediaPipeTasksVision
import React

@objc(VideoPoseDetector)
class VideoPoseDetector: NSObject {

  private var landmarker: MediaPipeTasksVision.PoseLandmarker?

  private func getLandmarker() -> MediaPipeTasksVision.PoseLandmarker? {
    if let existing = landmarker { return existing }
    guard let modelPath = Bundle.main.path(forResource: "pose_landmarker_lite", ofType: "task") else {
      return nil
    }
    let options = PoseLandmarkerOptions()
    options.baseOptions.modelAssetPath = modelPath
    options.runningMode = .image
    options.numPoses = 1
    landmarker = try? MediaPipeTasksVision.PoseLandmarker(options: options)
    return landmarker
  }

  @objc(detectPoseInFrame:timestampMs:resolver:rejecter:)
  func detectPoseInFrame(_ uri: String,
                         timestampMs: NSNumber,
                         resolver resolve: @escaping RCTPromiseResolveBlock,
                         rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard let landmarker = getLandmarker() else {
      reject("NO_MODEL", "Failed to load pose_landmarker_lite.task", nil)
      return
    }
    guard let url = URL(string: uri) else {
      reject("BAD_URI", "Invalid video URI: \(uri)", nil)
      return
    }

    let asset = AVURLAsset(url: url)
    let generator = AVAssetImageGenerator(asset: asset)
    generator.appliesPreferredTrackTransform = true
    generator.requestedTimeToleranceBefore = .zero
    generator.requestedTimeToleranceAfter = .zero

    let time = CMTime(value: CMTimeValue(timestampMs.doubleValue), timescale: 1000)

    do {
      let cgImage = try generator.copyCGImage(at: time, actualTime: nil)
      let uiImage = UIImage(cgImage: cgImage)
      let mpImage = try MPImage(uiImage: uiImage)
      let result = try landmarker.detect(image: mpImage)

      guard let pose = result.landmarks.first else {
        resolve([]) // No person detected.
        return
      }

      let landmarks = pose.map { lm -> [String: Any] in
        return [
          "x": lm.x,
          "y": lm.y,
          "z": lm.z,
          "visibility": lm.visibility?.floatValue ?? 1.0,
        ]
      }
      resolve(landmarks)
    } catch {
      reject("DETECT_ERROR", error.localizedDescription, error)
    }
  }

  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
