/*
  Reusable Card component with clean elevation, rounded corners, header, body, and footer.
  Usage:
    <Card>
      <Card.Header title="Title" subtitle="Optional subtitle">
        <button>Action</button>
      </Card.Header>
      <Card.Body>Content</Card.Body>
      <Card.Footer>
        <button>Cancel</button>
        <button>Save</button>
      </Card.Footer>
    </Card>
*/

function Surface({ as: As = 'div', style, hover = false, children, ...rest }) {
  const base = {
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    background: '#fff',
    boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
    transition: 'box-shadow 160ms ease, transform 160ms ease',
  }
  const hoverStyle = hover ? {
    cursor: 'default',
  } : {}
  return (
    <As
      style={{ ...base, ...(style || {}) }}
      onMouseEnter={(e)=>{ if (hover) e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.08)'; if (hover) e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={(e)=>{ if (hover) e.currentTarget.style.boxShadow = base.boxShadow; if (hover) e.currentTarget.style.transform = 'none' }}
      {...rest}
    >
      {children}
    </As>
  )
}

function Header({ title, subtitle, children, style }) {
  return (
    <div style={{ padding: 16, borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...(style||{}) }}>
      <div>
        {title && <div style={{ fontWeight: 700 }}>{title}</div>}
        {subtitle && <div style={{ fontSize: 12, color: '#6b7280' }}>{subtitle}</div>}
      </div>
      {children && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function Body({ children, style }) {
  return (
    <div style={{ padding: 16, ...(style||{}) }}>
      {children}
    </div>
  )
}

function Footer({ children, align = 'end', style }) {
  const justify = align === 'start' ? 'flex-start' : align === 'center' ? 'center' : 'flex-end'
  return (
    <div style={{ padding: 12, borderTop: '1px solid #f3f4f6', display: 'flex', gap: 8, justifyContent: justify, ...(style||{}) }}>
      {children}
    </div>
  )
}

export default function Card({ hover = false, style, children, as }) {
  return (
    <Surface as={as} hover={hover} style={style}>
      {children}
    </Surface>
  )
}

Card.Header = Header
Card.Body = Body
Card.Footer = Footer
Card.Surface = Surface
