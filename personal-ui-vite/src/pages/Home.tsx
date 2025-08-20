import AssistantChat from '../components/assistant/AssistantChat';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-4">
      <div className="container mx-auto max-w-6xl">
        <header className="text-center py-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🏋️ Personal SweatBot
          </h1>
          <p className="text-gray-300 text-lg">
            המאמן הכושר האישי שלך בעברית עם בינה מלאכותית
          </p>
          <div className="mt-4 text-sm text-gray-400">
            Vite + React + Assistant-UI + Python AI - No Cache Issues! 🎉
          </div>
          <div className="mt-4">
            <Link 
              to="/demo" 
              className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors mr-2"
            >
              🎨 View Visualizations Demo
            </Link>
            <Link 
              to="/test" 
              className="inline-block bg-secondary hover:bg-secondary/90 text-secondary-foreground px-4 py-2 rounded-lg transition-colors"
            >
              🧪 Test Interface
            </Link>
          </div>
        </header>

        <main className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 shadow-2xl">
          <AssistantChat />
        </main>

        <footer className="text-center py-8">
          <div className="text-gray-500 text-sm">
            🤖 מופעל על ידי Assistant-UI + FastAPI + Whisper + Hebrew NLP | Vite ⚡
          </div>
        </footer>
      </div>
    </div>
  );
}