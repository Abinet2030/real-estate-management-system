export default function Help(){
  return (
    <section style={{ padding:'24px 16px' }}>
      <div style={{ maxWidth: 900, margin:'0 auto', display:'grid', gap:12 }}>
        <h2 style={{ margin:0 }}>Help Center</h2>
        <p style={{ color:'#64748b' }}>Find answers to common questions and learn how to use Relstate.</p>
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:16, background:'#fff', display:'grid', gap:8 }}>
          <div>
            <strong>Managing listings</strong>
            <div style={{ color:'#64748b' }}>Use the Seller Dashboard to add, edit, and organize your properties.</div>
          </div>
          <div>
            <strong>Inquiries & offers</strong>
            <div style={{ color:'#64748b' }}>Respond to buyer messages and negotiate offers from the Inquiries & Offers tab.</div>
          </div>
          <div>
            <strong>Need more help?</strong>
            <div style={{ color:'#64748b' }}>Contact support from your Seller Dashboard or email hello@relstate.example.</div>
          </div>
        </div>
      </div>
    </section>
  )
}
