module.exports = {
  packagerConfig: {
    icon: 'assets/img/pi.png'
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-deb',
      config: {},
    }
  ],
};