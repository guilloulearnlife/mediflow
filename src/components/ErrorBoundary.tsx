'use client'
import { Component, ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#060D1A] flex items-center justify-center p-6">
          <div className="bg-[#0D1B2E] border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-white mb-2">
              Oups, une erreur est survenue
            </h2>
            <p className="text-white/60 mb-6">
              {this.state.error?.message || "Quelque chose s'est mal passé"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#00E5A0] text-[#060D1A] px-6 py-3 rounded-xl font-bold hover:bg-[#00c98c] transition-colors"
            >
              Recharger la page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
