import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Item, UserSpecs } from "../types";

// 저장 키값 (냉장고 이름표라고 생각하면 됩니다)
const STORAGE_KEY_JOBS = "@saved_jobs";
const STORAGE_KEY_SPECS = "@user_specs";

interface SavedContextType {
  savedJobs: Item[];
  toggleSave: (job: Item) => void;
  userSpecs: UserSpecs;
  addSpec: (cert: any) => void;
  removeSpec: (cert: any) => void;
}

const SavedContext = createContext<SavedContextType | undefined>(undefined);

export const SavedProvider = ({ children }: { children: React.ReactNode }) => {
  const [savedJobs, setSavedJobs] = useState<Item[]>([]);
  const [userSpecs, setUserSpecs] = useState<UserSpecs>({
    certificates: [],
    toeic: 0,
  });

  // [1] 앱이 처음 켜질 때: 휴대폰(브라우저)에 저장된 데이터 가져오기
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const storedJobs = await AsyncStorage.getItem(STORAGE_KEY_JOBS);
        const storedSpecs = await AsyncStorage.getItem(STORAGE_KEY_SPECS);

        if (storedJobs) setSavedJobs(JSON.parse(storedJobs));
        if (storedSpecs) setUserSpecs(JSON.parse(storedSpecs));

        console.log("✅ 데이터 복구 완료!");
      } catch (e) {
        console.error("데이터 로드 실패:", e);
      }
    };
    loadPersistedData();
  }, []);

  // [2] 데이터가 바뀔 때마다 자동으로 저장하기
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(savedJobs));
        await AsyncStorage.setItem(
          STORAGE_KEY_SPECS,
          JSON.stringify(userSpecs),
        );
      } catch (e) {
        console.error("데이터 저장 실패:", e);
      }
    };
    saveData();
  }, [savedJobs, userSpecs]);

  // [기능: 찜하기/해제]
  const toggleSave = (job: Item) => {
    setSavedJobs((prev) => {
      const isExist = prev.find((item) => item.id === job.id);
      if (isExist) {
        return prev.filter((item) => item.id !== job.id);
      } else {
        return [...prev, job];
      }
    });
  };

  // [기능: 자격증 추가]
  const addSpec = (cert: any) => {
    if (!cert || !cert.standard_name) return;
    setUserSpecs((prev) => {
      const isExist = prev.certificates.find(
        (c) => c.standard_name === cert.standard_name && c.grade === cert.grade,
      );
      if (isExist) return prev;

      return { ...prev, certificates: [...prev.certificates, cert] };
    });
  };

  // [기능: 자격증 삭제]
  const removeSpec = (cert: any) => {
    setUserSpecs((prev) => ({
      ...prev,
      certificates: prev.certificates.filter(
        (c) => c.standard_name !== cert.standard_name || c.grade !== cert.grade,
      ),
    }));
  };

  return (
    <SavedContext.Provider
      value={{ savedJobs, toggleSave, userSpecs, addSpec, removeSpec }}>
      {children}
    </SavedContext.Provider>
  );
};

export const useSaved = () => {
  const context = useContext(SavedContext);
  if (!context)
    throw new Error("useSaved는 SavedProvider 안에서만 쓸 수 있습니다.");
  return context;
};
