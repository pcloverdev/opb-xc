//
//  PoseLandmarker.m
//  opb
//
//  Registers the Swift PoseLandmarker class as a VisionCamera Frame Processor
//  Plugin under the JS name `detectPose`.
//

#import <Foundation/Foundation.h>
#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/FrameProcessorPluginRegistry.h>

// Generated Swift header for the `opb` module (exposes @objc(PoseLandmarker)).
#import "opb-Swift.h"

VISION_EXPORT_SWIFT_FRAME_PROCESSOR(PoseLandmarker, detectPose)
