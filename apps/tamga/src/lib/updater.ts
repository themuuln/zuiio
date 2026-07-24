import { useState, useEffect } from "react";
import * as Updates from "expo-updates";
import { Platform } from "react-native";

export interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  availableVersion: string | null;
  isDownloading: boolean;
  isInstalling: boolean;
  error: string | null;
}

export function useUpdater() {
  const [info, setInfo] = useState<UpdateInfo>({
    available: false,
    currentVersion: Updates.channel ?? "development",
    availableVersion: null,
    isDownloading: false,
    isInstalling: false,
    error: null,
  });

  const checkForUpdate = async () => {
    try {
      if (Platform.OS === "web") return;

      const update = await Updates.checkForUpdateAsync();
      setInfo((prev) => ({
        ...prev,
        available: update.isAvailable,
        availableVersion: (update.manifest as any)?.version ?? null,
      }));
    } catch (err) {
      setInfo((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Шалгахад алдаа гарлаа",
      }));
    }
  };

  const downloadAndInstall = async () => {
    try {
      setInfo((prev) => ({ ...prev, isDownloading: true, error: null }));

      const update = await Updates.checkForUpdateAsync();
      if (!update.isAvailable) {
        setInfo((prev) => ({ ...prev, isDownloading: false }));
        return;
      }

      await Updates.fetchUpdateAsync();

      setInfo((prev) => ({ ...prev, isDownloading: false, isInstalling: true }));

      await Updates.reloadAsync();
    } catch (err) {
      setInfo((prev) => ({
        ...prev,
        isDownloading: false,
        isInstalling: false,
        error: err instanceof Error ? err.message : "Шинэчлэхэд алдаа гарлаа",
      }));
    }
  };

  useEffect(() => {
    checkForUpdate();
  }, []);

  return {
    ...info,
    checkForUpdate,
    downloadAndInstall,
  };
}
