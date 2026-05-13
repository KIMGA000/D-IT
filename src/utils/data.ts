// src/utils/date.ts
export const getStatus = (endYmd: string) => {
  if (!endYmd) return "-";

  // 1. 오늘 날짜 구하기 (시간은 00:00:00으로 초기화해서 날짜만 비교)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 2. 마감 날짜 구하기 (YYYYMMDD 형식을 날짜 객체로 변환)
  const year = parseInt(endYmd.substring(0, 4));
  const month = parseInt(endYmd.substring(4, 6)) - 1;
  const day = parseInt(endYmd.substring(6, 8));
  const targetDate = new Date(year, month, day);

  // 3. 두 날짜의 차이 계산 (밀리초 단위를 일 단위로 변환)
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // 4. 결과 반환
  if (diffDays < 0) return "마감";
  if (diffDays === 0) return "D-Day";
  return `D-${diffDays}`;
};
