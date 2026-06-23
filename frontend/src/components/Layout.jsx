import { useState } from 'react'
import Sidebar from './Sidebar'
import { THEME } from '../theme'

function Layout({ children }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div style={{ display: 'flex', backgroundColor: THEME.colors.mainBg, minHeight: '100vh' }}>
      <Sidebar expanded={expanded} setExpanded={setExpanded} />
      <div style={{
        flex: 1,
        marginLeft: expanded ? '240px' : '72px',
        minHeight: '100vh',
        backgroundColor: THEME.colors.mainBg
      }}>
        {children}
      </div>
    </div>
  )
}

export default Layout