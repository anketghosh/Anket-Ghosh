export type Tab = 'downloads' | 'create-reel'

export interface DownloadedVideo {
  id: string
  name: string
  url: string
  file: File
  size: number
  duration: number
  addedAt: Date
}

export interface ReelConfig {
  video: DownloadedVideo
  startTime: number
  endTime: number
  title: string
  aspectRatio: '9:16' | '1:1' | '16:9'
}
