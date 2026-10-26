const {
  withDangerousMod,
  withXcodeProject,
  withPodfile,
  withAppBuildGradle,
  withMainApplication,
  IOSConfig,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MODEL_FILE = 'pose_landmarker_lite.task';
const IOS_POD = "pod 'MediaPipeTasksVision', '~> 0.10.14'";
const ANDROID_DEP = 'implementation("com.google.mediapipe:tasks-vision:0.10.14")';
const FP_PLUGIN_NAME = 'detectPose';

const IOS_SOURCES = [
  'PoseLandmarker.swift',
  'PoseLandmarker.m',
  'VideoPoseDetector.swift',
  'VideoPoseDetector.m',
];
const ANDROID_SOURCES = [
  'PoseLandmarkerFrameProcessorPlugin.kt',
  'VideoPoseDetectorModule.kt',
  'VideoPoseDetectorPackage.kt',
];
// ReactPackages (added to MainApplication.getPackages()).
const ANDROID_PACKAGES = ['VideoPoseDetectorPackage'];

const BRIDGING_IMPORTS = [
  '#import <VisionCamera/FrameProcessorPlugin.h>',
  '#import <VisionCamera/FrameProcessorPluginRegistry.h>',
  '#import <VisionCamera/Frame.h>',
  '#import <VisionCamera/VisionCameraProxyHolder.h>',
];

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

// ---------------------------------------------------------------------------
// iOS
// ---------------------------------------------------------------------------

function withIosSourceFiles(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const { platformProjectRoot, projectName, projectRoot } = cfg.modRequest;
      const targetDir = path.join(platformProjectRoot, projectName);
      const pluginIosDir = path.join(__dirname, 'ios');

      // Native source files.
      for (const file of IOS_SOURCES) {
        copyFile(path.join(pluginIosDir, file), path.join(targetDir, file));
      }

      // Bundled model.
      copyFile(
        path.join(projectRoot, 'assets', 'models', MODEL_FILE),
        path.join(targetDir, MODEL_FILE)
      );

      // Bridging header — expose VisionCamera ObjC types to Swift.
      const bridgingHeader = path.join(targetDir, `${projectName}-Bridging-Header.h`);
      if (fs.existsSync(bridgingHeader)) {
        let contents = fs.readFileSync(bridgingHeader, 'utf8');
        for (const line of BRIDGING_IMPORTS) {
          if (!contents.includes(line)) {
            contents += `\n${line}`;
          }
        }
        fs.writeFileSync(bridgingHeader, `${contents}\n`);
      }

      return cfg;
    },
  ]);
}

function pbxHasFile(project, basename) {
  const refs = project.pbxFileReferenceSection();
  return Object.keys(refs).some((key) => {
    const ref = refs[key];
    if (!ref || typeof ref !== 'object') return false;
    const value = ref.path || ref.name || '';
    return value.replace(/"/g, '').endsWith(basename);
  });
}

function withIosXcodeProject(config) {
  return withXcodeProject(config, (cfg) => {
    const project = cfg.modResults;
    const groupName = cfg.modRequest.projectName;

    for (const file of IOS_SOURCES) {
      if (!pbxHasFile(project, file)) {
        IOSConfig.XcodeUtils.addBuildSourceFileToGroup({
          filepath: `${groupName}/${file}`,
          groupName,
          project,
        });
      }
    }

    if (!pbxHasFile(project, MODEL_FILE)) {
      IOSConfig.XcodeUtils.addResourceFileToGroup({
        filepath: `${groupName}/${MODEL_FILE}`,
        groupName,
        project,
        isBuildFile: true,
      });
    }

    return cfg;
  });
}

function withIosPod(config) {
  return withPodfile(config, (cfg) => {
    let contents = cfg.modResults.contents;
    if (!contents.includes('MediaPipeTasksVision')) {
      // Insert the pod right after `use_expo_modules!` inside the app target.
      contents = contents.replace(
        /use_expo_modules!\n/,
        `use_expo_modules!\n  ${IOS_POD}\n`
      );
      cfg.modResults.contents = contents;
    }
    return cfg;
  });
}

// Our app-target ObjC files (PoseLandmarker.m / VideoPoseDetector.m) import
// framework headers (<React/...>, <VisionCamera/...>). Under RN 0.81's prebuilt
// React-Core, that trips -Wnon-modular-include-in-framework-module as an error
// unless the app target allows non-modular includes.
function withIosNonModularIncludes(config) {
  return withXcodeProject(config, (cfg) => {
    const project = cfg.modResults;
    const configurations = project.pbxXCBuildConfigurationSection();
    for (const key of Object.keys(configurations)) {
      const entry = configurations[key];
      const buildSettings = entry && entry.buildSettings;
      // Only real targets have PRODUCT_NAME; this scopes to the app target
      // (the Pods live in a separate project untouched by withXcodeProject).
      if (buildSettings && buildSettings.PRODUCT_NAME) {
        buildSettings.CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES = 'YES';
      }
    }
    return cfg;
  });
}

// ---------------------------------------------------------------------------
// Android
// ---------------------------------------------------------------------------

function withAndroidSourceFiles(config) {
  return withDangerousMod(config, [
    'android',
    (cfg) => {
      const { platformProjectRoot, projectRoot } = cfg.modRequest;
      const androidPackage = cfg.android.package;
      const packagePath = androidPackage.replace(/\./g, path.sep);
      const javaDir = path.join(platformProjectRoot, 'app/src/main/java', packagePath);
      fs.mkdirSync(javaDir, { recursive: true });

      // Kotlin sources — inject the app's package name.
      for (const file of ANDROID_SOURCES) {
        const ktSource = fs
          .readFileSync(path.join(__dirname, 'android', file), 'utf8')
          .replace('__PACKAGE__', androidPackage);
        fs.writeFileSync(path.join(javaDir, file), ktSource);
      }

      // Bundled model.
      copyFile(
        path.join(projectRoot, 'assets', 'models', MODEL_FILE),
        path.join(platformProjectRoot, 'app/src/main/assets', MODEL_FILE)
      );

      return cfg;
    },
  ]);
}

function withAndroidBuildGradle(config) {
  return withAppBuildGradle(config, (cfg) => {
    let contents = cfg.modResults.contents;

    // MediaPipe dependency.
    if (!contents.includes('mediapipe:tasks-vision')) {
      contents = contents.replace(
        /dependencies\s*{/,
        `dependencies {\n    ${ANDROID_DEP}`
      );
    }

    // Do not compress the .task model so MediaPipe can memory-map it.
    if (!contents.includes('noCompress += "task"') && !contents.includes("noCompress 'task'")) {
      contents = contents.replace(
        /android\s*{/,
        'android {\n    androidResources {\n        noCompress += "task"\n    }'
      );
    }

    cfg.modResults.contents = contents;
    return cfg;
  });
}

function withAndroidRegisterPlugin(config) {
  return withMainApplication(config, (cfg) => {
    let contents = cfg.modResults.contents;
    const androidPackage = cfg.android.package;

    const registryImport = 'import com.mrousavy.camera.frameprocessors.FrameProcessorPluginRegistry';
    const pluginImport = `import ${androidPackage}.PoseLandmarkerFrameProcessorPlugin`;

    if (!contents.includes(registryImport)) {
      contents = contents.replace(
        /(package [^\n]+\n)/,
        `$1\n${registryImport}\n${pluginImport}\n`
      );
    }

    const registration =
      `    FrameProcessorPluginRegistry.addFrameProcessorPlugin("${FP_PLUGIN_NAME}") { proxy, options ->\n` +
      `      PoseLandmarkerFrameProcessorPlugin(applicationContext, options)\n` +
      `    }\n`;

    if (!contents.includes('FrameProcessorPluginRegistry.addFrameProcessorPlugin')) {
      contents = contents.replace(
        /(super\.onCreate\(\)\n)/,
        `$1${registration}`
      );
    }

    // Register ReactPackages (native modules) in getPackages().apply { }.
    // These classes live in the app package, so no import is needed.
    for (const pkg of ANDROID_PACKAGES) {
      if (!contents.includes(`add(${pkg}())`)) {
        contents = contents.replace(
          /(PackageList\(this\)\.packages\.apply\s*{\n)/,
          `$1              add(${pkg}())\n`
        );
      }
    }

    cfg.modResults.contents = contents;
    return cfg;
  });
}

// ---------------------------------------------------------------------------

module.exports = function withPoseLandmarker(config) {
  config = withIosSourceFiles(config);
  config = withIosXcodeProject(config);
  config = withIosNonModularIncludes(config);
  config = withIosPod(config);
  config = withAndroidSourceFiles(config);
  config = withAndroidBuildGradle(config);
  config = withAndroidRegisterPlugin(config);
  return config;
};
