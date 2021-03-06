/* ========== Concat ========== */
export interface ConcatItem {
  id: string;
  value: string;
  filename: string;
}

/* ========== VideoCut ========== */
export interface CutItem {
  id: string;
  file: string;       // 文件位置
  name: string;       // 文件名称
  startTime?: string; // 开始时间
  endTime?: string;   // 结束时间
}