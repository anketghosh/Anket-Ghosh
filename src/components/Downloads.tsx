import { useRef, useCallback, useState } from 'react'
import { DownloadedVideo } from '../types'

interface Props {
  videos: DownloadedVideo[]
  onAdd: (video: DownloadedVideo) => void
  onRemove: (id: string) => void
  onCreateReel: (video: DownloadedVideo) => void
}

// File System Access API types
declare global {
  interface Window {
    showDirectoryPicker?: (options?: { startIn?: string }) => Promise<FileSystemDirectoryHandle>
  }
}

const VIDEO_EXTS = new Set(['mp4', 'mov', 'webm', 'mkv', 'avi', 'wmv', 'm4v'])

function isVideoFile(name: string) {
  return VIDEO_EXTS.has(name.split('.').pop()?.toLowerCase() ?? '')
}

function loadVideoDuration(_file: File, url: string): Promise<number> {
  return new Promise((resolve) => {
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.src = url
    v.onloadedmetadata = () => resolve(v.duration)
    v.onerror = () => resolve(0)
  })
}

export default function Downloads({ videos, onAdd, onRemove, onCreateReel }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [scanning, setScanning] = useState(false)
  const [connectedFolder, setConnectedFolder] = useState<string | null>(null)
  const [scanCount, setScanCount] = useState(0)
  const hasFolderApi = typeof window !== 'undefined' && !!window.showDirectoryPicker

  const addFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('video/') && !isVideoFile(file.name)) return
    const url = URL.createObjectURL(file)
    const duration = await loadVideoDuration(file, url)
    onAdd({
      id: `${Date.now()}-${Math.random()}`,
      name: file.name,
      url,
      file,
      size: file.size,
      duration,
      addedAt: new Date(),
    })
  }, [onAdd])

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach((f) => addFile(f))
  }, [addFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  // Recursively scan a directory handle for video files
  const scanDirectory = useCallback(async (
    dirHandle: FileSystemDirectoryHandle,
    depth = 0
  ) => {
    if (depth > 2) return // max 2 levels deep
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file' && isVideoFile(entry.name)) {
        const f = await (entry as FileSystemFileHandle).getFile()
        await addFile(f)
        setScanCount((n) => n + 1)
      } else if (entry.kind === 'directory' && depth < 2) {
        await scanDirectory(entry as FileSystemDirectoryHandle, depth + 1)
      }
    }
  }, [addFile])

  const connectFolder = useCallback(async () => {
    if (!window.showDirectoryPicker) return
    try {
      setScanning(true)
      setScanCount(0)
      const dirHandle = await window.showDirectoryPicker({ startIn: 'downloads' })
      setConnectedFolder(dirHandle.name)
      await scanDirectory(dirHandle)
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        alert('Could not open folder: ' + err.message)
      }
    } finally {
      setScanning(false)
    }
  }, [scanDirectory])

  return (
    <div style={{ padding: 32, flex: 1, overflowY: 'auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Downloads</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Connect your local Downloads folder or drop video files to create reels
        </p>
      </div>

      {/* Connect local folder button */}
      {hasFolderApi && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '20px 24px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}>
          <div style={{ fontSize: 32 }}>🖥️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: 3 }}>
              {connectedFolder ? `Connected: ${connectedFolder}` : 'Connect Local Folder'}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              {scanning
                ? `Scanning… ${scanCount} video${scanCount !== 1 ? 's' : ''} found`
                : connectedFolder
                  ? `${scanCount} video${scanCount !== 1 ? 's' : ''} imported from your PC`
                  : 'Grant browser access to your Downloads folder on your PC'}
            </div>
          </div>
          <button
            onClick={connectFolder}
            disabled={scanning}
            style={{
              background: connectedFolder ? 'var(--surface2)' : 'var(--accent)',
              color: connectedFolder ? 'var(--text-muted)' : '#fff',
              border: '1px solid var(--border)',
              padding: '9px 18px',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 13,
              opacity: scanning ? 0.6 : 1,
              cursor: scanning ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {scanning ? 'Scanning…' : connectedFolder ? 'Re-scan Folder' : 'Open Folder'}
          </button>
        </div>
      )}

      {/* Drop zone / file picker */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        style={{
          border: '2px dashed var(--border)',
          borderRadius: 16,
          padding: '32px',
          textAlign: 'center',
          cursor: 'pointer',
          marginBottom: 32,
          transition: 'border-color 0.2s',
          background: 'var(--surface)',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        <div style={{ fontSize: 36, marginBottom: 10 }}>📂</div>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Drop video files here</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          or click to pick individual files · MP4, MOV, MKV, WebM supported
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Not supported notice */}
      {!hasFolderApi && (
        <div style={{
          background: 'rgba(255,79,106,0.08)',
          border: '1px solid rgba(255,79,106,0.3)',
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 24,
          fontSize: 13,
          color: 'var(--text-muted)',
        }}>
          ⚠️ <strong>Folder access</strong> requires Chrome or Edge. Use the drop zone or file picker above instead.
        </div>
      )}

      {/* Video list */}
      {videos.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0', fontSize: 15 }}>
          No videos yet. Connect your local Downloads folder or drop files above.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 4 }}>
            {videos.length} video{videos.length !== 1 ? 's' : ''} in Downloads
          </div>
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onRemove={() => onRemove(video.id)}
              onCreateReel={() => onCreateReel(video)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function VideoCard({ video, onRemove, onCreateReel }: {
  video: DownloadedVideo
  onRemove: () => void
  onCreateReel: () => void
}) {
  const mins = Math.floor(video.duration / 60)
  const secs = Math.floor(video.duration % 60)
  const duration = video.duration > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : '—'
  const size = (video.size / 1024 / 1024).toFixed(1)

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
    }}>
      <div style={{
        width: 64,
        height: 64,
        borderRadius: 8,
        background: 'var(--surface2)',
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        <VideoThumbnail url={video.url} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {video.name}
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, display: 'flex', gap: 16 }}>
          <span>⏱ {duration}</span>
          <span>💾 {size} MB</span>
          <span>📅 {video.addedAt.toLocaleDateString()}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          onClick={onCreateReel}
          style={{ background: 'var(--accent)', color: '#fff', padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13 }}
        >
          Create Reel
        </button>
        <button
          onClick={onRemove}
          style={{ background: 'var(--surface2)', color: 'var(--danger)', padding: '8px 12px', borderRadius: 8, fontSize: 16 }}
          title="Remove"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

function VideoThumbnail({ url }: { url: string }) {
  return (
    <video
      src={url}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      preload="metadata"
      muted
      onLoadedMetadata={(e) => {
        const v = e.currentTarget
        v.currentTime = Math.min(5, v.duration * 0.1)
      }}
    />
  )
}
