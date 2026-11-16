const { withInfoPlist } = require('expo/config-plugins');

const DEV_LAUNCHER_BONJOUR_SERVICE = '_expo._tcp';

function withoutDevLauncherLocalNetworkKeys(config) {
  return withInfoPlist(config, (plistConfig) => {
    const services = (plistConfig.modResults.NSBonjourServices ?? []).filter(
      (service) => service !== DEV_LAUNCHER_BONJOUR_SERVICE,
    );
    if (services.length > 0) {
      plistConfig.modResults.NSBonjourServices = services;
    } else {
      delete plistConfig.modResults.NSBonjourServices;
    }
    delete plistConfig.modResults.NSLocalNetworkUsageDescription;
    return plistConfig;
  });
}

module.exports = ({ config }) =>
  process.env.EAS_BUILD_PROFILE === 'production' ? withoutDevLauncherLocalNetworkKeys(config) : config;
