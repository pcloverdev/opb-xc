module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // VisionCamera frame processors run on react-native-worklets-core.
    // This plugin transforms the `'worklet'` functions used by the pose
    // frame processor. babel-preset-expo automatically appends
    // `react-native-worklets/plugin` (Reanimated 4) LAST, so this must be
    // listed before it.
    plugins: ['react-native-worklets-core/plugin'],
  };
};
