'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

type Pregunta = { id: string; texto: string; respuestaDoctor: string };
type ColorTheme = 'blue' | 'emerald' | 'rose' | 'amber' | 'purple';
type Cita = { id: string; doctorNombre: string; especialidad: string; fecha: string; color: ColorTheme; preguntas: Pregunta[]; recomendaciones: string };

const COLOR_MAP = {
  blue: { bg: 'from-blue-500 to-indigo-500', text: 'text-blue-600', light: 'bg-blue-50 border-blue-100', shadow: 'shadow-blue-500/30' },
  emerald: { bg: 'from-emerald-400 to-teal-500', text: 'text-emerald-600', light: 'bg-emerald-50 border-emerald-100', shadow: 'shadow-emerald-500/30' },
  rose: { bg: 'from-rose-400 to-red-500', text: 'text-rose-600', light: 'bg-rose-50 border-rose-100', shadow: 'shadow-rose-500/30' },
  amber: { bg: 'from-amber-400 to-orange-500', text: 'text-amber-600', light: 'bg-amber-50 border-amber-100', shadow: 'shadow-amber-500/30' },
  purple: { bg: 'from-purple-500 to-fuchsia-500', text: 'text-purple-600', light: 'bg-purple-50 border-purple-100', shadow: 'shadow-purple-500/30' },
};

export default function AdminScreen() {
  const router = useRouter();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [editingCita, setEditingCita] = useState<Cita | null>(null);
  const [activeTab, setActiveTab] = useState<'pendientes' | 'historial'>('pendientes');
  const [isLoaded, setIsLoaded] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    const t = new Date().toISOString().split('T')[1].substring(0, 8);
    setLogs(prev => [...prev, `[${t}] ${msg}`]);
  };

  const getTodayLimaStr = () => {
    const d = new Date();
    const limaTime = new Date(d.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    const year = limaTime.getFullYear();
    const month = String(limaTime.getMonth() + 1).padStart(2, '0');
    const day = String(limaTime.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    addLog('Componente Admin montado en navegador');
    addLog('Iniciando conexión a Firebase...');
    const startTime = Date.now();

    try {
      // ⚡️ Firestore Listener (Sincronización en Tiempo Real)
      const unsubscribe = onSnapshot(collection(db, 'citas'), (snapshot) => {
        const elapsed = Date.now() - startTime;
        addLog(`✅ Datos recibidos en ${elapsed}ms`);
        const fetchedCitas = snapshot.docs.map(doc => doc.data() as Cita);
        setCitas(fetchedCitas);
        setIsLoaded(true);
      }, (error) => {
        addLog(`❌ Error Firestore: ${error.message}`);
      });
      
      return () => unsubscribe();
    } catch (err: any) {
      addLog(`❌ Crash Sincrónico: ${err.message}`);
    }
  }, []);

  const handleCrearNuevaCita = () => {
    const nueva: Cita = {
      id: Date.now().toString(),
      doctorNombre: '',
      especialidad: '',
      fecha: getTodayLimaStr(),
      color: 'blue',
      preguntas: [{ id: '1', texto: '', respuestaDoctor: '' }],
      recomendaciones: ''
    };
    setEditingCita(nueva);
    setView('edit');
  };

  const handleEditarCita = (cita: Cita) => {
    if (cita.preguntas.length === 0) {
      cita.preguntas = [{ id: Date.now().toString(), texto: '', respuestaDoctor: '' }];
    }
    if (!cita.fecha) cita.fecha = getTodayLimaStr();
    if (!cita.color) cita.color = 'blue';
    setEditingCita(cita);
    setView('edit');
  };

  const handleEliminarCita = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if(confirm("¿Estás seguro de eliminar esta cita?")) {
      deleteDoc(doc(db, 'citas', id)); // Fire and forget (ultra rápido)
    }
  };

  const getAutoColor = (text: string): ColorTheme => {
    const t = text.toLowerCase();
    // Asignaciones por semántica
    if (t.includes('cardio') || t.includes('coraz')) return 'rose';
    if (t.includes('nutri') || t.includes('gastro') || t.includes('diet')) return 'emerald';
    if (t.includes('neuro') || t.includes('psico')) return 'purple';
    if (t.includes('pedia') || t.includes('derma')) return 'amber';
    
    // Si no coincide con ninguna palabra clave, genera un color aleatorio pero consistente basado en las letras
    const hash = t.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors: ColorTheme[] = ['blue', 'emerald', 'rose', 'amber', 'purple'];
    return colors[hash % colors.length] || 'blue';
  };

  const handleGuardarEdicion = () => {
    if (!editingCita) return;
    const preguntasSaneadas = editingCita.preguntas.filter(p => p.texto.trim() !== '');
    
    // Autoasignación inteligente de color basada en la especialidad
    const colorAutomatico = getAutoColor(editingCita.especialidad || editingCita.doctorNombre || 'General');
    const citaFinal = { ...editingCita, preguntas: preguntasSaneadas, color: colorAutomatico };

    // ⚡️ Guardar en Firestore (Sin "await" para que sea instantáneo)
    setDoc(doc(db, 'citas', citaFinal.id), citaFinal);
    
    setView('list');
    setEditingCita(null);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative">
        <div className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-6 animate-bounce">
          <svg className="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Conectando...</h2>
        <p className="text-slate-500 text-center mb-8">Sincronizando con la nube de Firebase de forma segura</p>
        
        {/* PANEL DE DIAGNÓSTICO */}
        <div className="w-full max-w-md bg-black/80 rounded-xl p-4 text-xs font-mono text-green-400 shadow-2xl absolute bottom-10 left-1/2 -translate-x-1/2">
          <h3 className="text-white border-b border-white/20 pb-2 mb-2">🔴 DIAGNÓSTICO EN VIVO:</h3>
          {logs.map((log, i) => (
            <div key={i} className="mb-1">{log}</div>
          ))}
        </div>
      </div>
    );
  }

  const todayStr = getTodayLimaStr();
  const citasPendientes = citas.filter(c => c.fecha >= todayStr);
  const citasPasadas = citas.filter(c => c.fecha < todayStr);
  
  const displayCitas = activeTab === 'pendientes' ? citasPendientes : citasPasadas;

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-sans">
        <header className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-8 shadow-[0_15px_40px_-10px_rgba(79,70,229,0.4)] rounded-b-[2.5rem] mb-10 flex justify-between items-center relative z-10 border-b border-indigo-400/30">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">Panel Familiar</h1>
            <p className="text-indigo-100 mt-1 text-lg font-medium drop-shadow-sm">Gestión de citas médicas</p>
          </div>
          <button onClick={() => router.push('/')} className="w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full shadow-sm border border-white/20 flex items-center justify-center text-white transition-all transform active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
          </button>
        </header>

        <div className="flex-1 px-6 md:px-12 max-w-3xl w-full mx-auto pb-12 space-y-10">

        {view === 'list' && (
          <main className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
              <div className="flex bg-slate-200/60 p-1.5 rounded-2xl w-fit">
                <button 
                  onClick={() => setActiveTab('pendientes')}
                  className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${activeTab === 'pendientes' ? 'bg-white text-[#111827] shadow-[0_1px_3px_rgba(0,0,0,0.1)]' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Próximas y Hoy
                </button>
                <button 
                  onClick={() => setActiveTab('historial')}
                  className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${activeTab === 'historial' ? 'bg-white text-[#111827] shadow-[0_1px_3px_rgba(0,0,0,0.1)]' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Historial Pasado
                </button>
              </div>

              <button 
                onClick={handleCrearNuevaCita}
                className="bg-gradient-to-r from-blue-600 to-teal-500 hover:brightness-110 text-white font-medium px-6 py-3 rounded-2xl shadow-[0_4px_14px_rgba(20,184,166,0.3)] transform active:scale-95 transition-all duration-150 shrink-0 border border-teal-400/20"
              >
                + Nueva Cita
              </button>
            </div>

            {displayCitas.length === 0 ? (
              <div className="bg-white rounded-[2rem] p-10 text-center border border-black/5 shadow-sm">
                <p className="text-slate-500 text-lg">No hay citas en esta sección.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {displayCitas.map((cita, index) => {
                  const theme = COLOR_MAP[cita.color || 'blue'];
                  return (
                  <div 
                    key={cita.id} 
                    onClick={() => handleEditarCita(cita)}
                    style={{ animationDelay: `${index * 100}ms` }}
                    className="group bg-white rounded-[2rem] p-6 border border-black/5 shadow-[0_1px_2px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] cursor-pointer transform hover:-translate-y-1 transition-all duration-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4 animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
                  >
                    <div>
                      <div className="flex items-center gap-4 mb-2">
                        <div className={`w-14 h-14 bg-gradient-to-tr ${theme.bg} rounded-2xl flex items-center justify-center shadow-lg ${theme.shadow}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-[#111827] leading-none mb-1">{cita.doctorNombre || 'Sin Nombre'}</h3>
                          <div className="flex items-center gap-2 mt-2">
                             <p className={`${theme.text} font-bold text-sm tracking-wide`}>{cita.especialidad || 'General'}</p>
                             <span className="text-slate-300">•</span>
                             <p className="text-slate-500 text-sm font-medium">{cita.fecha.split('-').reverse().join('/')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                      <div className={`text-right ${theme.light} px-4 py-2 rounded-xl border`}>
                        <p className={`text-xs font-bold ${theme.text} opacity-70 uppercase tracking-wider`}>Consultas</p>
                        <p className={`text-xl font-bold ${theme.text} text-center leading-tight`}>{cita.preguntas.length}</p>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEliminarCita(cita.id); }}
                        className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      </button>
                    </div>
                  </div>
                )})}
              </div>
            )}
          </main>
        )}

        {view === 'edit' && editingCita && (
          <main className="bg-white rounded-[2rem] p-8 md:p-10 border border-black/5 shadow-[0_1px_2px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.04)] space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold tracking-tight text-[#111827]">Configurar Cita</h2>
              <button onClick={() => setView('list')} className="text-slate-400 hover:text-slate-600 font-medium">Volver</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* REMOVIDO: El selector de color manual. Ahora es automático. */}

              <div className="space-y-2 md:col-span-1">
                <label className="text-sm font-medium text-slate-500 uppercase tracking-wider">Fecha</label>
                <input 
                  type="date" 
                  value={editingCita.fecha}
                  onChange={e => setEditingCita({...editingCita, fecha: e.target.value})}
                  className="w-full bg-[#f4f4f5] border border-transparent focus:border-blue-500/30 focus:bg-white focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-5 py-4 text-[#111827] outline-none transition-all duration-200"
                />
              </div>
              <div className="space-y-2 md:col-span-1">
                <label className="text-sm font-medium text-slate-500 uppercase tracking-wider">Doctor</label>
                <input 
                  type="text" 
                  value={editingCita.doctorNombre}
                  onChange={e => setEditingCita({...editingCita, doctorNombre: e.target.value})}
                  placeholder="Ej. Dr. Pérez"
                  className="w-full bg-[#f4f4f5] border border-transparent focus:border-blue-500/30 focus:bg-white focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-5 py-4 text-[#111827] outline-none transition-all duration-200"
                />
              </div>
              <div className="space-y-2 md:col-span-1">
                <label className="text-sm font-medium text-slate-500 uppercase tracking-wider">Especialidad</label>
                <input 
                  type="text" 
                  value={editingCita.especialidad}
                  onChange={e => setEditingCita({...editingCita, especialidad: e.target.value})}
                  placeholder="Ej. Cardiología"
                  className="w-full bg-[#f4f4f5] border border-transparent focus:border-blue-500/30 focus:bg-white focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-5 py-4 text-[#111827] outline-none transition-all duration-200"
                />
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="space-y-6">
              <h2 className="text-2xl font-semibold tracking-tight text-[#111827]">Consultas y Preguntas</h2>
              
              <div className="space-y-4">
                {editingCita.preguntas.map((p, i) => (
                  <div key={p.id} className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${COLOR_MAP[editingCita.color].light} ${COLOR_MAP[editingCita.color].text} flex items-center justify-center font-bold text-sm shrink-0 border`}>{i + 1}</div>
                      <input 
                        type="text" 
                        value={p.texto}
                        onChange={e => {
                          const nuevas = [...editingCita.preguntas];
                          nuevas[i].texto = e.target.value;
                          setEditingCita({...editingCita, preguntas: nuevas});
                        }}
                        placeholder="Escribe tu consulta aquí..."
                        className={`w-full bg-[#f4f4f5] border border-transparent focus:border-transparent focus:bg-white focus:ring-4 focus:ring-black/5 rounded-2xl px-5 py-4 text-[#111827] outline-none transition-all duration-200`}
                      />
                    </div>
                    {p.respuestaDoctor && (
                       <div className="ml-11 bg-slate-50 text-slate-700 p-4 rounded-2xl text-[15px] border border-slate-100 leading-relaxed shadow-sm">
                         <strong className="text-slate-900">Respuesta del Dr:</strong> <br/> {p.respuestaDoctor}
                       </div>
                    )}
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setEditingCita({...editingCita, preguntas: [...editingCita.preguntas, { id: Date.now().toString(), texto: '', respuestaDoctor: '' }]})}
                className="text-blue-600 font-medium px-4 py-2 hover:bg-blue-50 rounded-xl transition-colors duration-150"
              >
                + Agregar otra consulta
              </button>
            </div>

            <div className="pt-4 flex items-center justify-end">
              <button 
                onClick={handleGuardarEdicion}
                className={`bg-gradient-to-tr ${COLOR_MAP[editingCita.color].bg} ${COLOR_MAP[editingCita.color].shadow} shadow-lg hover:brightness-110 text-white font-medium text-lg px-8 py-4 rounded-2xl transform active:scale-95 transition-all duration-[150ms]`}
              >
                Guardar Cita
              </button>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
