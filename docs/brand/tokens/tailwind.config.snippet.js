// Paste inside module.exports.theme.extend (or the `extend` block of tailwind.config)
// Source: docs/brand/brand.md
({
  colors: {
    ink: '#0A0A0A',
    paper: '#FAFAF7',
    signal: '#FF385C',
    verified: '#00A699',
    graphite: '#6F6F76',
  },
  fontFamily: {
    display: ['"Bricolage Grotesque"', 'sans-serif'],
    mono: ['"Reddit Mono"', 'monospace'],
    body: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
  },
  fontSize: {
    h1: ['64px', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
    h2: ['40px', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
    h3: ['24px', { lineHeight: '1.2' }],
    body: ['17px', { lineHeight: '1.6' }],
    caption: ['12px', { letterSpacing: '0.12em' }],
  },
  borderRadius: {
    brand: '0px',
    symbol: '21%',
  },
  boxShadow: {
    card: '0 1px 0 rgba(255,255,255,0.08)',
  },
})
