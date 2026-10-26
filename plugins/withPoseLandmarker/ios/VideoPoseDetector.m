//
//  VideoPoseDetector.m
//  opb
//
//  Exposes the Swift VideoPoseDetector class to React Native as a native module.
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(VideoPoseDetector, NSObject)

RCT_EXTERN_METHOD(detectPoseInFrame:(NSString *)uri
                  timestampMs:(nonnull NSNumber *)timestampMs
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
