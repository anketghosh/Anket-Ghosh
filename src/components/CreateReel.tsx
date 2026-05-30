import { useRef, useState, useCallback, useEffect } from 'react'
import { DownloadedVideo, ReelConfig } from '../types'

interface Props {
  videos: DownloadedVideo[]
  selectedVideo: DownloadedVideo | null
  onGoToDownloads: () => void
}

const ASPECT_RATIOS: Array<{ label: string; value: ReelConfig['aspectRatio']; desc: string }> = [
  { label: '9:16', value: '9:16', desc: 'Stories / Reels' },
  { label: '1:1', value: '1:1', desc: 'Square' },
  { label: '16:9', value: '16:9', desc: 'Landscape' },
]

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

export default function CreateReel({ videos, selectedVideo, onGoToDownloads }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [video, setVideo] = useState<DownloadedVideo | null>(selectedVideo)
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(60)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [title, setTitle] = useState('')
  const [aspectRatio, setAspectRatio] = useState<ReelConfig['aspectRatio']>('9:16')
  const [exported, setExported] = useState(false)

  useEffect(() => {
    if (selectedVideo) {
      setVideo(selectedVideo)
      setTitle(selectedVideo.name.replace(/\.[^.]+$/, ''))
      setStartTime(0)
      setEndTime(Math.min(60, selectedVideo.duration))
      setExported(false)
    }
  }, [selectedVideo])

  useEffect(() => {
    if (video) {
      setEndTime(Math.min(60, video.duration))
      setStartTime(0)
    }
  }, [video])

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    setCurrentTime(v.currentTime)
    if (v.currentTime >= endTime) {
      v.pause()
      v.currentTime = startTime
      setIsPlaying(false)
    }
  }, [endTime, startTime])

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (isPlaying) {
      v.pause()
      setIsPlaying(false)
    } else {
      v.currentTime = startTime
      v.play()
      setIsPlaying(true)
    }
  }

  const handleStartChange = (val: number) => {
    const clamped = Math.min(val, endTime - 1)
    setStartTime(clamped)
    if (videoRef.current) videoRef.current.currentTime = clamped
  }

  const handleEndChange = (val: number) => {
    const clamped = Math.max(val, startTime + 1)
    setEndTime(clamped)
  }

  const handleExport = () => {
    if (!video) return
    const duration = endTime - startTime
    alert(
      `Reel ready!\n\n` +
      `Title: ${title || video.name}\n` +
      `Video: ${video.name}\n` +
      `Clip: ${formatTime(startTime)} → ${formatTime(endTime)} (${Math.round(duration)}s)\n` +
      `Aspect Ratio: ${aspectRatio}\n\n` +
      `In production this would encode and download the reel clip.`
    )
    setExported(true)
  }

  const duration = video?.duration ?? 0

  if (!video && videos.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 32 }}>
        <div style={{ fontSize: 56 }}>🎬</div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>No videos in Downloads</div>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: 340 }}>
          Add your "1 Hour Deep Sleep" video (or any video) to the Downloads section first.
        </p>
        <button
          onClick={onGoToDownloads}
          style={{ background: 'var(--accent)', color: '#fff', padding: '10px 24px', borderRadius: 8, fontWeight: 600, fontSize: 15 }}
        >
          Go to Downloads
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: 32, flex: 1, overflowY: 'auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Create Reel</h1>
        <p style={{ color: 'var(--text-muted)' }}>Trim your video and export it as a reel</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        {/* Left: video + trim */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Video selector */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Source video</label>
            <select
              value={video?.id ?? ''}
              onChange={(e) => {
                const v = videos.find(v => v.id === e.target.value)
                if (v) { setVideo(v); setExported(false) }
              }}
              style={{
                width: '100%',
                background: 'var(--surface2)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 14,
              }}
            >
              {videos.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          {/* Preview */}
          {video && (
            <div style={{
              background: '#000',
              borderRadius: 12,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              aspectRatio: aspectRatio === '9:16' ? '9/16' : aspectRatio === '1:1' ? '1' : '16/9',
              maxHeight: 420,
              position: 'relative',
            }}>
              <video
                ref={videoRef}
                src={video.url}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
              <button
                onClick={togglePlay}
                style={{
                  position: 'absolute',
                  bottom: 12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,0.7)',
                  color: '#fff',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderRadius: 24,
                  padding: '8px 24px',
                  fontSize: 14,
                  fontWeight: 600,
                  backdropFilter: 'blur(4px)',
                }}
              >
                {isPlaying ? '⏸ Pause' : '▶ Preview Reel'}
              </button>
            </div>
          )}

          {/* Trim controls */}
          {video && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 16 }}>Trim Clip</div>

              {/* Timeline bar */}
              <div style={{ position: 'relative', height: 48, marginBottom: 16 }}>
                <div style={{
                  position: 'absolute',
                  left: 0, right: 0, top: '50%',
                  transform: 'translateY(-50%)',
                  height: 8,
                  background: 'var(--surface2)',
                  borderRadius: 4,
                }} />
                {/* Selected range highlight */}
                <div style={{
                  position: 'absolute',
                  left: `${(startTime / duration) * 100}%`,
                  width: `${((endTime - startTime) / duration) * 100}%`,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  height: 8,
                  background: 'var(--accent)',
                  borderRadius: 4,
                }} />
                {/* Playhead */}
                {duration > 0 && (
                  <div style={{
                    position: 'absolute',
                    left: `${(currentTime / duration) * 100}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 3,
                    height: 28,
                    background: '#fff',
                    borderRadius: 2,
                  }} />
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Start</span>
                    <span style={{ color: 'var(--accent-light)', fontWeight: 600 }}>{formatTime(startTime)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={duration}
                    step={0.1}
                    value={startTime}
                    style={{ width: '100%' }}
                    onChange={(e) => handleStartChange(Number(e.target.value))}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                    <span style={{ color: 'var(--text-muted)' }}>End</span>
                    <span style={{ color: 'var(--accent-light)', fontWeight: 600 }}>{formatTime(endTime)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={duration}
                    step={0.1}
                    value={endTime}
                    style={{ width: '100%' }}
                    onChange={(e) => handleEndChange(Number(e.target.value))}
                  />
                </div>
              </div>

              <div style={{
                marginTop: 16,
                padding: '10px 14px',
                background: 'var(--surface2)',
                borderRadius: 8,
                fontSize: 13,
                color: 'var(--text-muted)',
                display: 'flex',
                justifyContent: 'space-between',
              }}>
                <span>Reel duration</span>
                <span style={{ color: endTime - startTime > 90 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                  {Math.round(endTime - startTime)}s
                  {endTime - startTime > 90 && ' (too long for Reels)'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: settings + export */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Reel title */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Reel title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="1 Hour Deep Sleep"
              style={{
                width: '100%',
                background: 'var(--surface2)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>

          {/* Aspect ratio */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Aspect ratio</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ASPECT_RATIOS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setAspectRatio(r.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: aspectRatio === r.value ? 'var(--accent)' : 'var(--surface2)',
                    color: aspectRatio === r.value ? '#fff' : 'var(--text)',
                    border: '1px solid',
                    borderColor: aspectRatio === r.value ? 'var(--accent)' : 'var(--border)',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: 15, width: 36 }}>{r.label}</span>
                  <span style={{ fontSize: 13, opacity: 0.8 }}>{r.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          {video && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Reel summary</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <Row label="Source" value={video.name.length > 24 ? video.name.slice(0, 24) + '…' : video.name} />
                <Row label="Clip" value={`${formatTime(startTime)} → ${formatTime(endTime)}`} />
                <Row label="Duration" value={`${Math.round(endTime - startTime)} seconds`} />
                <Row label="Format" value={aspectRatio} />
              </div>
            </div>
          )}

          {/* Export button */}
          <button
            onClick={handleExport}
            disabled={!video}
            style={{
              background: exported ? 'var(--success)' : 'var(--accent)',
              color: '#fff',
              padding: '14px 0',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 16,
              opacity: !video ? 0.4 : 1,
              cursor: !video ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {exported ? '✓ Reel Exported!' : '⬇ Export Reel'}
          </button>

          {exported && (
            <div style={{
              padding: '12px 14px',
              background: 'rgba(61, 219, 165, 0.1)',
              border: '1px solid var(--success)',
              borderRadius: 10,
              fontSize: 13,
              color: 'var(--success)',
              textAlign: 'center',
            }}>
              Your reel is ready. In a full implementation, the trimmed clip would be downloaded automatically.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  )
}
