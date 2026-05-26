import React, { Component, type ReactNode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

class TopBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) { return { error: e.message + '\n' + e.stack }; }
  render() {
    if (this.state.error) return (
      <pre style={{ padding: 24, color: 'red', whiteSpace: 'pre-wrap', fontSize: 12 }}>
        {this.state.error}
      </pre>
    );
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TopBoundary>
      <App />
    </TopBoundary>
  </React.StrictMode>,
)
