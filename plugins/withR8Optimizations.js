const { withGradleProperties } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to enforce R8 fullMode and optimized resource shrinking
 * addressing Google Play Console release optimization recommendations.
 */
module.exports = function withR8Optimizations(config) {
  return withGradleProperties(config, (config) => {
    const propertiesToAdd = [
      { type: 'property', key: 'android.enableR8.fullMode', value: 'true' },
      { type: 'property', key: 'android.r8.optimizedResourceShrinking', value: 'true' },
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

