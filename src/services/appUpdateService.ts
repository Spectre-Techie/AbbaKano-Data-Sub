import { Platform, Linking, Alert } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

export interface AppUpdateInfo {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  currentVersionCode: number;
  latestVersionCode: number;
  releaseNotes?: string;
  isMandatory?: boolean;
  storeUrl: string;
}

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.abbakano.datasub';
const PLAY_STORE_MARKET_URL = 'market://details?id=com.abbakano.datasub';

export const CURRENT_APP_VERSION = Constants.expoConfig?.version || '1.0.3';
export const CURRENT_VERSION_CODE =
  typeof Constants.expoConfig?.android?.versionCode === 'number'
    ? Constants.expoConfig.android.versionCode
    : 4;

/**
 * Compare two semver strings (e.g. '1.0.3' vs '1.0.2')
 * Returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
function compareSemver(v1: string, v2: string): number {
  const parts1 = v1.replace(/[^0-9.]/g, '').split('.').map(Number);
  const parts2 = v2.replace(/[^0-9.]/g, '').split('.').map(Number);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const a = parts1[i] || 0;
    const b = parts2[i] || 0;
    if (a > b) return 1;
    if (a < b) return -1;
  }
  return 0;
}

/**
 * Check if a new version of the app is available.
 * Queries Supabase or public endpoint, with fallback to false if offline.
 */
export async function checkForAppUpdates(): Promise<AppUpdateInfo> {
  const defaultInfo: AppUpdateInfo = {
    updateAvailable: false,
    currentVersion: CURRENT_APP_VERSION,
    latestVersion: CURRENT_APP_VERSION,
    currentVersionCode: CURRENT_VERSION_CODE,
    latestVersionCode: CURRENT_VERSION_CODE,
    storeUrl: PLAY_STORE_URL,
  };

  try {
    // 1. Try fetching from Supabase edge function or public storage
    const { data, error } = await supabase.functions.invoke('app-version', {});
    if (!error && data && typeof data === 'object') {
      const remoteVersion = String((data as any).version || CURRENT_APP_VERSION);
      const remoteCode = Number((data as any).versionCode || CURRENT_VERSION_CODE);
      const isMandatory = Boolean((data as any).isMandatory);
      const releaseNotes = typeof (data as any).releaseNotes === 'string' ? (data as any).releaseNotes : undefined;
      const storeUrl = typeof (data as any).storeUrl === 'string' ? (data as any).storeUrl : PLAY_STORE_URL;

      const hasNewerVersion =
        remoteCode > CURRENT_VERSION_CODE || compareSemver(remoteVersion, CURRENT_APP_VERSION) > 0;

      return {
        updateAvailable: hasNewerVersion,
        currentVersion: CURRENT_APP_VERSION,
        latestVersion: remoteVersion,
        currentVersionCode: CURRENT_VERSION_CODE,
        latestVersionCode: remoteCode,
        releaseNotes,
        isMandatory,
        storeUrl,
      };
    }
  } catch {
    // Silent fallback to default info
  }

  return defaultInfo;
}

/**
 * Open the Google Play Store page directly for AbbaKano DataSub
 */
export async function openAppStore(): Promise<void> {
  if (Platform.OS === 'android') {
    try {
      const canOpenMarket = await Linking.canOpenURL(PLAY_STORE_MARKET_URL);
      if (canOpenMarket) {
        await Linking.openURL(PLAY_STORE_MARKET_URL);
        return;
      }
    } catch {
      // Fall through to web url
    }
  }

  await Linking.openURL(PLAY_STORE_URL).catch(() => {
    Alert.alert(
      'Update App',
      'Please open the Google Play Store and search for "AbbaKano DataSub" to update to the latest version.'
    );
  });
}

