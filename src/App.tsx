import { useState, useCallback } from 'react'
import { Tab, DownloadedVideo } from './types'
import Sidebar from './components/Sidebar'
import Downloads from './components/Downloads'
import CreateReel from './components/CreateReel'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('downloads')
  const [videos, setVideos] = useState<DownloadedVideo[]>([])
  const [reelTarget, setReelTarget] = useState<DownloadedVideo | null>(null)

  const handleAdd = useCallback((video: DownloadedVideo) => {
    setVideos((prev) => {
      if (prev.some((v) => v.name === video.name && v.size === video.size)) return prev
      return [video, ...prev]
    })
  }, [])

  const handleRemove = useCallback((id: string) => {
    setVideos((prev) => {
      const removed = prev.find((v) => v.id === id)
      if (removed) URL.revokeObjectURL(removed.url)
      return prev.filter((v) => v.id !== id)
    })
    setReelTarget((prev) => (prev?.id === id ? null : prev))
  }, [])

  const handleCreateReel = useCallback((video: DownloadedVideo) => {
    setReelTarget(video)
    setActiveTab('create-reel')
  }, [])

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        downloadCount={videos.length}
      />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {activeTab === 'downloads' && (
          <Downloads
            videos={videos}
            onAdd={handleAdd}
            onRemove={handleRemove}
            onCreateReel={handleCreateReel}
          />
        )}
        {activeTab === 'create-reel' && (
          <CreateReel
            videos={videos}
            selectedVideo={reelTarget}
            onGoToDownloads={() => setActiveTab('downloads')}
          />
        )}
      </main>
    </div>
  )
}
