export default function Privacy(){
  return (
    <section style={{ padding:'24px 16px' }}>
      <div style={{ maxWidth: 900, margin:'0 auto', display:'grid', gap:12 }}>
        <h2 style={{ margin:0 }}>Privacy Policy</h2>
        <p style={{ color:'#64748b' }}>We respect your privacy. This simplified policy explains how we handle data on Relstate.</p>
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:16, background:'#fff', display:'grid', gap:10 }}>
          <div>
            <strong>What we collect</strong>
            <div style={{ color:'#64748b' }}>Account details, listings, messages, and usage analytics.</div>
          </div>
          <div>
            <strong>How it’s used</strong>
            <div style={{ color:'#64748b' }}>To operate the platform, improve features, and keep your account secure.</div>
          </div>
          <div>
            <strong>Your choices</strong>
            <div style={{ color:'#64748b' }}>You can update your profile, request data export, or delete your account.</div>
          </div>
        </div>
      </div>
    </section>
  )
}
