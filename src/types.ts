export interface S {
  width: number;
  height: number;
  emoji: string;
  set_name: string;
  is_animated: boolean;
  is_video: boolean;
  type: string;
  thumbnail: Thumb;
  thumb: Thumb;
  file_id: string;
  file_unique_id: string;
  file_size: number;
}

export interface Thumb {
  file_id: string;
  file_unique_id: string;
  file_size: number;
  width: number;
  height: number;
}
