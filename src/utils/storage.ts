// src/utils/storage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export const Storage = {
  save: async (key: string, value: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`${key} 저장 실패:`, e);
    }
  },

  load: async (key: string) => {
    try {
      const data = await AsyncStorage.getItem(key);

      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error(`${key} 불러오기 실패:`, e);
      return null;
    }
  },
};
