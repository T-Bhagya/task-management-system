import { useState } from 'react'
import Sidebar from './Sidebar'

function Layout({ children }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div style={{ display: 'flex', backgroundColor: '#0f1117', minHeight: '100vh' }}>
      <Sidebar expanded={expanded} setExpanded={setExpanded} />
      <div style={{
        flex: 1,
        marginLeft: expanded ? '240px' : '72px',
        minHeight: '100vh',
        backgroundColor: '#0f1117'
      }}>
        {children}
      </div>
    </div>
  )
}

export default Layout