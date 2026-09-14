const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
// Runtime database files and short-lived lock files are not source code. On
// Windows the lock file can disappear between Metro's directory scan and its
// watcher registration, so keep the entire runtime-data directory out of Metro.
config.resolver.blockList = [/[\\/]\.yaposan[\\/].*/];
module.exports = config;
