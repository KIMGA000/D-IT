// src/utils/storage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export const Storage = {
  /** * 1. 데이터를 저장하는 함수 (save)
   * 핸드폰 저장소에 데이터를 넣을 때 사용합니다.
   */
  save: async (key: string, value: any) => {
    try {
      /**
       * [공부 포인트: JSON.stringify]
       * 핸드폰 저장소는 '글자'만 알아듣습니다.
       * 그래서 우리가 가진 복잡한 자격증 리스트(객체)를
       * 하나의 긴 문자열(글자)로 납작하게 눌러서 저장하는 과정입니다.
       */
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`${key} 저장 실패:`, e);
    }
  },

  /** * 2. 데이터를 불러오는 함수 (load)
   * 저장했던 메모를 다시 꺼내올 때 사용합니다.
   */
  load: async (key: string) => {
    try {
      const data = await AsyncStorage.getItem(key);

      /**
       * [공부 포인트: JSON.parse]
       * 아까 납작하게 눌러서 글자로 저장했던 데이터를
       * 다시 우리가 쓸 수 있는 말랑말랑한 '객체' 형태로 복구하는 과정입니다.
       * 데이터가 없으면 null(빈값)을 돌려줍니다.
       */
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error(`${key} 불러오기 실패:`, e);
      return null;
    }
  },
};
