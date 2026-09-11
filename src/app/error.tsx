'use client';

export default function Error({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <div className="p-10 min-h-screen bg-red-50 flex flex-col items-center justify-center font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full border border-red-100">
        <h1 className="text-2xl font-bold text-red-600 mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Error Detectado
        </h1>
        <p className="text-slate-700 mb-4">
          Por favor, copia este texto rojo y envíaselo al asistente para que pueda solucionarlo inmediatamente:
        </p>
        <div className="bg-red-50 p-4 rounded-lg overflow-auto max-h-64 mb-6">
          <code className="text-red-600 text-sm font-mono whitespace-pre-wrap">
            {error.message}
          </code>
        </div>
        <button 
          onClick={() => reset()}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
