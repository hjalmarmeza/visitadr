'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';

type Pregunta = { id: string; texto: string; respuestaDoctor: string; isListening?: boolean };
type ColorTheme = 'blue' | 'emerald' | 'rose' | 'amber' | 'purple';
type Cita = { id: string; doctorNombre: string; especialidad: string; fecha: string; color: ColorTheme; preguntas: Pregunta[]; recomendaciones: string; isListeningRecomendaciones?: boolean };

const COLOR_MAP = {
  blue: { bg: 'from-blue-500 to-indigo-500', text: 'text-blue-600', light: 'bg-blue-50 border-blue-100', shadow: 'shadow-blue-500/30', header: 'from-blue-700 to-indigo-700', textGradient: 'from-blue-600 to-indigo-500', border: 'border-t-blue-500' },
  emerald: { bg: 'from-emerald-400 to-teal-500', text: 'text-emerald-600', light: 'bg-emerald-50 border-emerald-100', shadow: 'shadow-emerald-500/30', header: 'from-emerald-600 to-teal-700', textGradient: 'from-emerald-500 to-teal-500', border: 'border-t-emerald-500' },
  rose: { bg: 'from-rose-400 to-red-500', text: 'text-rose-600', light: 'bg-rose-50 border-rose-100', shadow: 'shadow-rose-500/30', header: 'from-rose-600 to-red-700', textGradient: 'from-rose-500 to-red-500', border: 'border-t-rose-500' },
  amber: { bg: 'from-amber-400 to-orange-500', text: 'text-amber-600', light: 'bg-amber-50 border-amber-100', shadow: 'shadow-orange-500/30', header: 'from-amber-500 to-orange-600', textGradient: 'from-amber-500 to-orange-500', border: 'border-t-amber-500' },
  purple: { bg: 'from-purple-500 to-fuchsia-500', text: 'text-purple-600', light: 'bg-purple-50 border-purple-100', shadow: 'shadow-purple-500/30', header: 'from-purple-700 to-fuchsia-700', textGradient: 'from-purple-600 to-fuchsia-500', border: 'border-t-purple-500' },
};

export default function DoctorViewScreen() {
  const router = useRouter();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [selectedCitaId, setSelectedCitaId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const recognitionRef = useRef<any>(null);
  const targetInputRef = useRef<{ tipo: 'pregunta' | 'recomendacion', id?: string } | null>(null);

  useEffect(() => {
    const getTodayLimaStr = () => {
      const d = new Date();
      const limaTime = new Date(d.toLocaleString('en-US', { timeZone: 'America/Lima' }));
      const year = limaTime.getFullYear();
      const month = String(limaTime.getMonth() + 1).padStart(2, '0');
      const day = String(limaTime.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // ⚡️ Firestore Listener (Sincronización en Tiempo Real con Admin y Pacientes)
    const unsubscribe = onSnapshot(collection(db, 'citas'), (snapshot) => {
      const parsed = snapshot.docs.map(doc => doc.data() as Cita);
      const hoy = getTodayLimaStr();
      const citasDeHoy = parsed.filter(c => c.fecha === hoy);
      
      setCitas(prevCitas => {
        return citasDeHoy.map(nuevaCita => {
          const prevCita = prevCitas.find(c => c.id === nuevaCita.id);
          return {
            ...nuevaCita, 
            color: nuevaCita.color || 'blue',
            // Preservamos el estado de los micrófonos si estábamos dictando
            isListeningRecomendaciones: prevCita ? prevCita.isListeningRecomendaciones : false,
            preguntas: nuevaCita.preguntas.map(p => ({ 
              ...p, 
              isListening: prevCita ? (prevCita.preguntas.find(op => op.id === p.id)?.isListening || false) : false
            }))
          };
        });
      });
      setIsLoaded(true);
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'es-ES';

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }

          const target = targetInputRef.current;
          if (!selectedCitaId) return;

          setCitas(prev => {
            const citaActiva = prev.find(c => c.id === selectedCitaId);
            if (!citaActiva) return prev;
            
            let nuevaCita = { ...citaActiva };
            if (target?.tipo === 'recomendacion') {
              nuevaCita.recomendaciones = currentTranscript;
            } else if (target?.tipo === 'pregunta') {
              nuevaCita.preguntas = citaActiva.preguntas.map(p => p.id === target.id ? { ...p, respuestaDoctor: currentTranscript } : p);
            }
            
            // ⚡️ Guardar en Firestore de forma ultra-rápida (sincroniza en background)
            const citaParaGuardar = { ...nuevaCita };
            delete citaParaGuardar.isListeningRecomendaciones;
            citaParaGuardar.preguntas = citaParaGuardar.preguntas.map(p => { const { isListening, ...rest } = p; return rest; });
            setDoc(doc(db, 'citas', nuevaCita.id), citaParaGuardar);

            return prev.map(c => c.id === nuevaCita.id ? nuevaCita : c);
          });
        };

        recognition.onend = () => {
          setCitas(prev => prev.map(c => ({
            ...c,
            isListeningRecomendaciones: false,
            preguntas: c.preguntas.map(p => ({ ...p, isListening: false }))
          })));
        };

        recognitionRef.current = recognition;
      }
    }
  }, [selectedCitaId]);

  const handleRespuestaManual = (preguntaId: string, nuevoTexto: string) => {
    setCitas(prev => {
      const citaActiva = prev.find(c => c.id === selectedCitaId);
      if (!citaActiva) return prev;
      
      const nuevaCita = {
        ...citaActiva,
        preguntas: citaActiva.preguntas.map(p => p.id === preguntaId ? { ...p, respuestaDoctor: nuevoTexto } : p)
      };
      
      const citaParaGuardar = { ...nuevaCita };
      delete citaParaGuardar.isListeningRecomendaciones;
      citaParaGuardar.preguntas = citaParaGuardar.preguntas.map(p => { const { isListening, ...rest } = p; return rest; });
      setDoc(doc(db, 'citas', nuevaCita.id), citaParaGuardar);

      return prev.map(c => c.id === nuevaCita.id ? nuevaCita : c);
    });
  };

  const handleRecomendacionManual = (nuevoTexto: string) => {
    setCitas(prev => {
      const citaActiva = prev.find(c => c.id === selectedCitaId);
      if (!citaActiva) return prev;
      
      const nuevaCita = { ...citaActiva, recomendaciones: nuevoTexto };
      
      const citaParaGuardar = { ...nuevaCita };
      delete citaParaGuardar.isListeningRecomendaciones;
      citaParaGuardar.preguntas = citaParaGuardar.preguntas.map(p => { const { isListening, ...rest } = p; return rest; });
      setDoc(doc(db, 'citas', nuevaCita.id), citaParaGuardar);

      return prev.map(c => c.id === nuevaCita.id ? nuevaCita : c);
    });
  };

  const toggleListeningPregunta = (preguntaId: string) => {
    const citaActual = citas.find(c => c.id === selectedCitaId);
    if (!citaActual) return;
    
    const isCurrentlyListening = citaActual.preguntas.find(p => p.id === preguntaId)?.isListening;
    
    if (isCurrentlyListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.stop();
      targetInputRef.current = { tipo: 'pregunta', id: preguntaId };
      setCitas(prev => prev.map(c => c.id === selectedCitaId ? {
        ...c,
        isListeningRecomendaciones: false,
        preguntas: c.preguntas.map(p => p.id === preguntaId ? { ...p, isListening: true } : { ...p, isListening: false })
      } : c));
      recognitionRef.current?.start();
    }
  };

  const toggleListeningRecomendaciones = () => {
    const citaActual = citas.find(c => c.id === selectedCitaId);
    if (!citaActual) return;

    if (citaActual.isListeningRecomendaciones) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.stop();
      targetInputRef.current = { tipo: 'recomendacion' };
      setCitas(prev => prev.map(c => c.id === selectedCitaId ? {
        ...c,
        isListeningRecomendaciones: true,
        preguntas: c.preguntas.map(p => ({ ...p, isListening: false }))
      } : c));
      recognitionRef.current?.start();
    }
  };

  const toggleLeerPregunta = (id: string, texto: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speakingId === id) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
      return;
    }

    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'es-ES';
    utterance.rate = 0.95; 
    utterance.pitch = 0.8; 

    const voices = window.speechSynthesis.getVoices();
    const spanishVoices = voices.filter(v => v.lang.startsWith('es'));
    const maleVoice = spanishVoices.find(v => /pablo|jorge|diego|carlos|hombre|male/i.test(v.name));
    
    if (maleVoice) {
      utterance.voice = maleVoice;
      utterance.pitch = 1.0; 
    }

    utterance.onstart = () => {
      setSpeakingId(id);
      setIsPaused(false);
    };
    utterance.onend = () => {
      setSpeakingId(null);
      setIsPaused(false);
    };
    utterance.onerror = () => {
      setSpeakingId(null);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isLoaded) return null;

  if (!selectedCitaId) {
    return (
    <div className="min-h-screen bg-transparent flex flex-col font-sans">
        <header className="bg-gradient-to-r from-blue-600 to-teal-500 text-white p-8 shadow-[0_15px_40px_-10px_rgba(20,184,166,0.4)] rounded-b-[2.5rem] mb-10 flex justify-between items-center relative z-10 border-b border-teal-400/30">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">Menú de Doctores</h1>
            <p className="text-teal-50 mt-1 text-lg font-medium drop-shadow-sm">Citas programadas para la fecha de hoy</p>
          </div>
          <button onClick={() => router.push('/')} className="w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full shadow-sm border border-white/20 flex items-center justify-center text-white transition-all transform active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
          </button>
        </header>

        <main className="space-y-6 flex-1 px-6 md:px-12 max-w-3xl w-full mx-auto pb-12">
            {citas.length === 0 ? (
              <div className="bg-white rounded-[2rem] p-10 text-center border border-black/5 shadow-sm">
                 <p className="text-slate-500 text-xl font-medium">No hay ninguna cita programada para hoy.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {citas.map((cita, index) => {
                  const theme = COLOR_MAP[cita.color || 'blue'];
                  return (
                  <div 
                    key={cita.id} 
                    onClick={() => setSelectedCitaId(cita.id)}
                    style={{ animationDelay: `${index * 100}ms` }}
                    className="group bg-white rounded-[2rem] p-8 border border-black/5 shadow-[0_1px_2px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] cursor-pointer transform hover:-translate-y-1 transition-all duration-200 animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className={`w-16 h-16 bg-gradient-to-tr ${theme.bg} rounded-2xl flex items-center justify-center shadow-lg ${theme.shadow}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className={`text-3xl font-bold text-[#111827] transition-colors group-hover:${theme.text}`}>{cita.doctorNombre}</h3>
                          <p className="text-slate-500 text-lg font-medium">{cita.especialidad || 'Consulta Médica'}</p>
                        </div>
                      </div>
                      <div className={`${theme.light} px-4 py-3 rounded-xl border text-center`}>
                        <p className={`text-xs font-bold ${theme.text} opacity-70 uppercase tracking-wider mb-1`}>Consultas</p>
                        <p className={`text-2xl font-bold ${theme.text} leading-none`}>{cita.preguntas.length}</p>
                      </div>
                    </div>
                  </div>
                )})}
              </div>
            )}
          </main>
      </div>
    );
  }

  const citaActiva = citas.find(c => c.id === selectedCitaId);
  if (!citaActiva) return null;
  const activeTheme = COLOR_MAP[citaActiva.color || 'blue'];

  return (
    <div className="min-h-screen bg-transparent flex flex-col pb-12 font-sans selection:bg-teal-100 animate-in slide-in-from-right-8 fade-in duration-300">
      
      {/* Header con color de fondo vibrante para separar la zona */}
      <header className={`bg-gradient-to-r ${activeTheme.header} text-white border-b border-black/10 p-8 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.3)] rounded-b-[2.5rem] mb-10 relative z-10 flex justify-between items-start`}>
        <div className="mt-2">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-sm font-bold text-white/70 uppercase tracking-widest">Consulta en Curso</h1>
            <span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide bg-white/20 backdrop-blur-md border border-white/30 shadow-sm text-white">
              {citaActiva.especialidad}
            </span>
          </div>
          <h2 className="text-5xl font-extrabold tracking-tight text-white pb-1 drop-shadow-md">
            {citaActiva.doctorNombre}
          </h2>
        </div>
        
        <button 
          onClick={() => {
            recognitionRef.current?.stop();
            if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
            setSelectedCitaId(null);
          }}
          className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-2xl shadow-sm border border-white/20 transition-all font-bold flex items-center gap-2 transform active:scale-95 backdrop-blur-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Menú
        </button>
      </header>

      <main className="flex-1 px-4 space-y-12 max-w-2xl mx-auto w-full">
        {citaActiva.preguntas.length > 0 && (
          <section>
            <h3 className="text-2xl font-bold text-[#111827] mb-6 tracking-tight flex items-center">
              <span className={`${activeTheme.light} ${activeTheme.text} w-8 h-8 flex items-center justify-center rounded-full mr-3 text-sm font-bold border`}>1</span>
              Consultas de la familia
            </h3>
            
            <div className="space-y-8">
              {citaActiva.preguntas.map((pregunta) => {
                const isCurrentlySpeaking = speakingId === pregunta.id;
                
                return (
                <div key={pregunta.id} className="bg-white rounded-[2rem] shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.05)] border border-black/5 overflow-hidden transition-all duration-200">
                  
                  <div className="bg-[#fcfcfd] p-6 border-b border-slate-100 flex justify-between items-start gap-4">
                    <p className="text-xl font-medium text-[#111827] leading-relaxed">"{pregunta.texto}"</p>
                    
                    <button 
                      onClick={() => toggleLeerPregunta(pregunta.id, pregunta.texto)}
                      className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm ${isCurrentlySpeaking && !isPaused ? `bg-gradient-to-tr ${activeTheme.bg} text-white` : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                      title="Escuchar pregunta en voz alta"
                    >
                      {isCurrentlySpeaking && !isPaused ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  
                  <div className="p-6 bg-white">
                    <p className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest">Su Respuesta</p>
                    <div className="flex gap-4 items-start">
                      <button 
                        onClick={() => toggleListeningPregunta(pregunta.id)}
                        className="relative shrink-0 w-14 h-14 group outline-none"
                      >
                        {pregunta.isListening && (
                          <div className="absolute inset-0 bg-red-500 rounded-full blur-xl opacity-60 animate-pulse"></div>
                        )}
                        <div className={`absolute inset-0 rounded-full shadow-lg transform group-active:scale-90 transition-all duration-[150ms] flex items-center justify-center ${
                          pregunta.isListening ? 'bg-gradient-to-tr from-red-500 to-rose-400 scale-105' : `bg-gradient-to-tr ${activeTheme.bg}`
                        }`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        </div>
                      </button>
                      
                      <div className="flex-1 min-h-[4rem] bg-[#f8fafc] rounded-2xl p-4 border border-black/5 flex items-start focus-within:ring-2 focus-within:ring-black/5 focus-within:bg-white transition-all">
                        <textarea
                          className="w-full bg-transparent resize-none outline-none text-[#111827] text-lg leading-relaxed placeholder-slate-400"
                          placeholder="Toque el orbe para hablar o escriba aquí..."
                          value={pregunta.respuestaDoctor || ''}
                          onChange={(e) => handleRespuestaManual(pregunta.id, e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          </section>
        )}

        <section>
          <h3 className="text-2xl font-bold text-[#111827] mb-6 tracking-tight flex items-center">
            <span className={`${activeTheme.light} ${activeTheme.text} w-8 h-8 flex items-center justify-center rounded-full mr-3 text-sm font-bold border`}>2</span>
            Recomendaciones Generales
          </h3>
          
          <div className="bg-white rounded-[2rem] shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.05)] border border-black/5 p-8">
             <p className="text-slate-500 mb-6 text-lg">Dicte indicaciones, recetas o pasos a seguir.</p>
             
             <div className="flex gap-5 items-start">
                <button 
                  onClick={toggleListeningRecomendaciones}
                  className="relative shrink-0 w-16 h-16 group outline-none"
                >
                  {citaActiva.isListeningRecomendaciones && (
                    <div className="absolute inset-0 bg-red-500 rounded-full blur-xl opacity-60 animate-pulse"></div>
                  )}
                  <div className={`absolute inset-0 rounded-full shadow-lg transform group-active:scale-90 transition-all duration-[150ms] flex items-center justify-center ${
                    citaActiva.isListeningRecomendaciones ? 'bg-gradient-to-tr from-red-500 to-rose-400 scale-105' : `bg-gradient-to-tr ${activeTheme.bg}`
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                </button>
                
                <div className="flex-1 min-h-[7rem] bg-[#f8fafc] rounded-2xl p-5 border border-black/5 focus-within:ring-2 focus-within:ring-black/5 focus-within:bg-white transition-all">
                  <textarea
                    className="w-full bg-transparent resize-none outline-none text-[#111827] text-xl leading-relaxed placeholder-slate-400"
                    placeholder="Toque el orbe para hablar o escriba sus recomendaciones aquí..."
                    value={citaActiva.recomendaciones || ''}
                    onChange={(e) => handleRecomendacionManual(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
          </div>
        </section>

        <div className="pt-8 flex justify-center">
          <button 
            onClick={() => {
              recognitionRef.current?.stop();
              if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
              setSelectedCitaId(null);
            }}
            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-lg px-8 py-4 rounded-2xl shadow-sm transition-all duration-200 transform active:scale-95 flex items-center gap-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al Menú Principal
          </button>
        </div>
      </main>
    </div>
  );
}
