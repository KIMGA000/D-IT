// src/services/supabase.ts
import { createClient } from "@supabase/supabase-js";

// Expo에서 클라이언트 환경 변수를 사용하려면 EXPO_PUBLIC_ 접두사가 필요합니다.
// .env 파일의 변수명을 EXPO_PUBLIC_SUPABASE_URL 등으로 수정해주세요.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// 환경 변수가 제대로 설정되었는지 확인합니다.
// 설정되지 않았다면 에러를 발생시켜 앱 실행을 중단합니다.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL and Anon Key must be set in environment variables.",
  );
}

// createClient를 통해 DB와 통신할 수 있는 클라이언트 객체를 생성하여 내보냄(export)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
