import { useRef, useCallback } from 'react'
import { DownloadedVideo } from '../types'

interface Props {
  videos: DownloadedVideo[]
  onAdd: (video: DownloadedVideo) => void
  onRemove: (id: string) => void
  onCreateReel: (video: DownloadedVideo) => void
}

export default function Downloads({ videos, onAdd, onRemove, onCreateReel }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('video/')) return
      const url = URL.createObjectURL(file)
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.src = url
      video.onloadedmetadata = () => {
        onAdd({
          id: `${Date.now()}-${Math.random()}`,
          name: file.name,
          url,
          file,
          size: file.size,
          duration: video.duration,
          addedAt: new Date(),
        })
      }
    })
  }, [onAdd])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  return (
    <div style={{ padding: 32, flex: 1, overflowY: 'auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Downloads</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Add videos from your local folder to create reels
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        style={{
          border: '2px dashed var(--border)',
          borderRadius: 16,
          padding: '40px 32px',
          textAlign: 'center',
          cursor: 'pointer',
          marginBottom: 32,
          transition: 'border-color 0.2s, background 0.2s',
          background: 'var(--surface)',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Drop video files here</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          or click to browse your Downloads folder
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

      {/* Video list */}
      {videos.length === 0 ? (
        <div style={{
          textAlign: 'center',
          color: 'var(--text-muted)',
          padding: '40px 0',
          fontSize: 15,
        }}>
          No videos yet. Add a video from your local Downloads folder above.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
  const duration = `${mins}:${String(secs).padStart(2, '0')}`
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
      {/* Thumbnail / icon */}
      <div style={{
        width: 64,
        height: 64,
        borderRadius: 8,
        background: 'var(--surface2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 28,
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        <VideoThumbnail url={video.url} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 600,
          marginBottom: 4,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {video.name}
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, display: 'flex', gap: 16 }}>
          <span>⏱ {duration}</span>
          <span>💾 {size} MB</span>
          <span>📅 {video.addedAt.toLocaleDateString()}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          onClick={onCreateReel}
          style={{
            background: 'var(--accent)',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          Create Reel
        </button>
        <button
          onClick={onRemove}
          style={{
            background: 'var(--surface2)',
            color: 'var(--danger)',
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 16,
          }}
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
      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }}
      preload="metadata"
      muted
      onLoadedMetadata={(e) => {
        const v = e.currentTarget
        v.currentTime = Math.min(5, v.duration * 0.1)
      }}
    />
  )
}
