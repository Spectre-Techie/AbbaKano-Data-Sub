const { withGradleProperties } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to enforce R8 fullMode, optimized resource shrinking,
 * and edge-to-edge support addressing Google Play Console release recommendations.
 */
module.exports = function withR8Optimizations(config) {
  return withGradleProperties(config, (config) => {
    const propertiesToAdd = [
      { type: 'property', key: 'android.enableR8.fullMode', value: 'true' },
      { type: 'property', key: 'android.r8.optimizedResourceShrinking', value: 'true' },
      { type: 'property', key: 'edgeToEdgeEnabled', value: 'true' },
    ];

    propertiesToAdd.forEach((prop) => {
      const existing = config.modResults.find(
        (item) => item.type === 'property' && item.key === prop.key
      );
      if (existing) {
        existing.value = prop.value;
      } else {
        config.modResults.push(prop);
      }
    });

    return config;
  });
};

