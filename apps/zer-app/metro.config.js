const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// expo-sqlite ships a WebAssembly SQLite build for web.
// Metro needs to resolve .wasm files as assets.
if (config.resolver && !config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

module.exports = config;
