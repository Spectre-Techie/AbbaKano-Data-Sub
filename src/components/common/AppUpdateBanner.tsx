import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PaletteType, Rounded, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { checkForAppUpdates, openAppStore, AppUpdateInfo } from '@/services/appUpdateService';

interface AppUpdateBannerProps {
  onDismiss?: () => void;
}

export const AppUpdateBanner: React.FC<AppUpdateBannerProps> = ({ onDismiss }) => {
  const { theme: Palette } = useApp();
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const info = await checkForAppUpdates();
      if (mounted && info.updateAvailable) {
        setUpdateInfo(info);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!updateInfo || !updateInfo.updateAvailable || dismissed) {
    return null;
  }

  const handleUpdate = () => {
    void openAppStore();
  };

  const handleClose = () => {
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  return (
    <View style={[styles.container, { backgroundColor: Palette.primaryContainer, borderColor: Palette.primary }]}>
      <View style={styles.iconBox}>
        <MaterialIcons name="system-update" size={20} color="#FFFFFF" />
      </View>

      <View style={styles.contentBox}>
        <View style={styles.titleRow}>
          <Text style={styles.titleText}>Update Available (v{updateInfo.latestVersion})</Text>
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        </View>
        <Text style={styles.bodyText} numberOfLines={2}>
          {updateInfo.releaseNotes || 'A new version with performance improvements and bug fixes is ready.'}
        </Text>
      </View>

      <View style={styles.actionsBox}>
        <Pressable
          style={({ pressed }) => [styles.updateBtn, pressed && { opacity: 0.85 }]}
          onPress={handleUpdate}
        >
          <Text style={styles.updateBtnText}>Update</Text>
          <MaterialIcons name="arrow-forward" size={14} color="#FFFFFF" />
        </Pressable>

        {!updateInfo.isMandatory && (
          <Pressable hitSlop={8} onPress={handleClose} style={styles.closeBtn}>
            <MaterialIcons name="close" size={16} color="rgba(255, 255, 255, 0.7)" />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.four,
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
    borderRadius: Rounded.xl,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentBox: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Typography.family,
  },
  newBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Rounded.full,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Typography.family,
  },
  bodyText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: Typography.family,
    lineHeight: 15,
  },
  actionsBox: {
    alignItems: 'center',
    gap: 6,
  },
  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Rounded.md,
  },
  updateBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Typography.family,
  },
  closeBtn: {
    padding: 2,
  },
});

