import { Tab } from '../types'

interface Props {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  downloadCount: number
}

export default function Sidebar({ activeTab, onTabChange, downloadCount }: Props) {
  return (
    <aside style={{
      width: 220,
      minHeight: '100vh',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      flexShrink: 0,
    }}>
      <div style={{ padding: '0 20px 28px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-light)', letterSpacing: -0.5 }}>
          ReelCraft
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
          Local video to reel
        </div>
      </div>

      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <NavItem
          icon="⬇"
          label="Downloads"
          badge={downloadCount}
          active={activeTab === 'downloads'}
          onClick={() => onTabChange('downloads')}
        />
        <NavItem
          icon="✂"
          label="Create Reel"
          active={activeTab === 'create-reel'}
          onClick={() => onTabChange('create-reel')}
        />
      </nav>
    </aside>
  )
}

function NavItem({ icon, label, badge, active, onClick }: {
  icon: string
  label: string
  badge?: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        borderRadius: 8,
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? '#fff' : 'var(--text-muted)',
        fontWeight: active ? 600 : 400,
        width: '100%',
        textAlign: 'left',
        transition: 'all 0.15s',
      }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span style={{
          background: active ? 'rgba(255,255,255,0.25)' : 'var(--accent)',
          color: '#fff',
          borderRadius: 10,
          padding: '1px 7px',
          fontSize: 12,
          fontWeight: 600,
        }}>
          {badge}
        </span>
      )}
    </button>
  )
}
