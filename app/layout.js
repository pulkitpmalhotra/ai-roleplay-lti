import './globals.css'

export const metadata = {
  title: 'LTI Gemini Roleplay Bot',
  description: 'AI-powered roleplay bot for guided learning in Docebo LMS',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <div className="flex flex-col min-h-screen">
          <header className="bg-primary-600 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <h1 className="text-2xl font-bold">AI Roleplay Training</h1>
            </div>
          </header>
          
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          
          <footer className="bg-gray-800 text-white py-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <p className="text-sm">© 2025 AI Roleplay Training - Powered by Gemini 2.0 Flash</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}