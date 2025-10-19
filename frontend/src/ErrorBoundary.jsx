import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error('App crashed:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, fontFamily: 'system-ui' }}>
          <h1>Something went wrong.</h1>
          <p style={{ color: '#b91c1c' }}>{String(this.state.error?.message || this.state.error)}</p>
          <p>Please check the browser console for details. You can refresh the page to retry.</p>
        </div>
      )
    }
    return this.props.children
  }
}
