'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); // ⚡️ Feedback inmediato
    
    // Obtener fecha actual en la zona horaria de Lima (UTC-5)
    const d = new Date();
    const limaTime = new Date(d.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    
    const day = String(limaTime.getDate()).padStart(2, '0');
    const month = String(limaTime.getMonth() + 1).padStart(2, '0');
    const year = limaTime.getFullYear();
    
    const validDoctorPin = `${day}${month}${year}`;

    if (pin === 'Admin') {
      router.push('/admin');
    } else if (pin === validDoctorPin) {
      router.push('/chat');
    } else {
      setError('El código ingresado es incorrecto.');
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden selection:bg-teal-200">
      
      <div className="relative z-10 max-w-md w-full bg-white rounded-[2.5rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] p-10 border border-white/50 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        <div className="flex justify-center mb-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-teal-400 rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
            <div className="relative w-24 h-24 bg-gradient-to-tr from-blue-500 to-teal-400 rounded-3xl flex items-center justify-center transform group-hover:scale-105 transition-all duration-300 shadow-xl border border-white/50">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="48" height="48" viewBox="0 0 24 24" 
                fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" 
                className="text-white drop-shadow-sm"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                <path d="M3.6 9h3.4L9 15l3-9 2 4h3.5"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500 mb-2 tracking-tight">
            Mi Visita al Doctor
          </h1>
          <p className="text-slate-500 text-lg font-medium">
            Ingrese su clave de acceso
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative group">
            <input
              id="pin"
              type="password"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError('');
              }}
              className="w-full px-6 py-4 text-center text-2xl font-bold tracking-widest text-slate-800 bg-[#f8fafc] border-2 border-transparent focus:outline-none focus:border-teal-400/40 focus:bg-white focus:ring-4 focus:ring-teal-400/10 rounded-2xl transition-all duration-200 placeholder:text-slate-300 placeholder:tracking-normal shadow-inner"
              placeholder="Contraseña"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-2xl text-center animate-in zoom-in-95 duration-200">
              <p className="font-semibold">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-gradient-to-tr from-blue-600 to-teal-500 hover:brightness-110 text-white font-bold text-xl py-4 rounded-2xl shadow-[0_4px_14px_rgba(20,184,166,0.39)] transform active:scale-95 transition-all duration-200 flex justify-center items-center gap-2 ${isLoading ? 'opacity-80 cursor-wait' : ''}`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Conectando...
              </>
            ) : (
              <>
                Ingresar
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
