module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./app/assets/fonts'],

  dependencies: {
    'react-native-pager-view': {
      platforms: {
        android: null, // disables codegen / native linking for Android
      },
    },
  },
};
