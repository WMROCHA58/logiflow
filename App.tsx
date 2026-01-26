
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Scan, History, Navigation, Package, ChevronLeft, Loader2, Globe, CheckCircle2, 
  TrendingUp, PlayCircle, Clock, Map, Share2, RotateCcw, User, LogOut, 
  CreditCard, FileText, Check, ShieldCheck, Zap, ArrowRight, Star, ExternalLink,
  Upload, FileType, FolderOpen, Headphones, Shield, Smartphone, HelpCircle,
  LayoutDashboard, Users, Activity, BarChart3, Search, Filter, ArrowUpRight,
  MoreVertical, Calendar, MapPin, Eye, MoreHorizontal, Download, Layers,
  Settings, Bell, SearchIcon, Menu, X as CloseIcon
} from 'lucide-react';
import CameraScanner from './components/CameraScanner';
import DeliveryCard from './components/DeliveryCard';
import { extractLabelData } from './services/geminiService';
import { DeliveryData, AppState, UserProfile } from './types';

const TRIAL_DAYS = 7;

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentDelivery, setCurrentDelivery] = useState<DeliveryData | null>(null);
  const [deliveryList, setDeliveryList] = useState<DeliveryData[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [appState, setAppState] = useState<AppState>(AppState.LANDING);
  const [successToast, setSuccessToast] = useState<{title: string, msg: string} | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isRouteActive, setIsRouteActive] = useState(false);
  const [importText, setImportText] = useState("");

  // Admin UI States
  const [adminTab, setAdminTab] = useState<'dashboard' | 'deliveries' | 'drivers'>('dashboard');
  const [deliveryFilter, setDeliveryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('logiflow_auth');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      setAppState(parsed.role === 'admin' ? AppState.ADMIN : AppState.IDLE);
    }
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error("GPS Error:", err)
      );
    }
  }, []);

  useEffect(() => {
    if (user && user.role !== 'admin' && appState !== AppState.SUBSCRIPTION && appState !== AppState.LANDING) {
      const now = Date.now();
      const isTrialExpired = now > user.trialEndsAt;
      const isSubscriptionActive = user.isSubscribed || user.status === 'active' || user.status === 'trialing';
      if (isTrialExpired && !isSubscriptionActive) {
        setAppState(AppState.SUBSCRIPTION);
      }
    }
  }, [user, appState]);

  useEffect(() => {
    if (user && user.role === 'driver') {
      const saved = localStorage.getItem(`logiflow_list_${user.email}`);
      if (saved) setDeliveryList(JSON.parse(saved));
    }
  }, [user]);

  const saveList = (list: DeliveryData[]) => {
    setDeliveryList(list);
    if (user) {
      localStorage.setItem(`logiflow_list_${user.email}`, JSON.stringify(list));
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const emailInput = (e.currentTarget.elements[0] as HTMLInputElement);
    const email = emailInput.value.toLowerCase();
    
    const isAdmin = email === 'admin@logiflow.com';

    const mockUser: UserProfile = {
      uid: isAdmin ? "ADMIN-LOGIFLOW-001" : `USER-${Math.random().toString(36).substr(2, 9)}`,
      email: email,
      signupDate: Date.now(),
      isSubscribed: isAdmin,
      trialEndsAt: Date.now() + (TRIAL_DAYS * 24 * 60 * 60 * 1000),
      status: isAdmin ? 'active' : 'trialing',
      role: isAdmin ? 'admin' : 'driver'
    };
    
    setUser(mockUser);
    localStorage.setItem('logiflow_auth', JSON.stringify(mockUser));
    setAppState(isAdmin ? AppState.ADMIN : AppState.IDLE);
  };

  const handleLogout = () => {
    localStorage.removeItem('logiflow_auth');
    setUser(null);
    setAppState(AppState.LANDING);
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const lines = importText.split('\n').filter(l => l.trim() !== "");
    const newDeliveries: DeliveryData[] = lines.map(line => ({
      id: `LF-IMP-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      nome: line.split(/[;,]/)[0]?.trim() || "Cliente Importado",
      endereco: line.split(/[;,]/)[1]?.trim() || line.trim(),
      bairro: "", cidade: "", pais: "Brasil", cep: "", telefone: "",
      status: 'pending', timestamp: Date.now()
    }));
    saveList([...newDeliveries, ...deliveryList]);
    setAppState(AppState.HISTORY);
    setImportText("");
  };

  const handleCapture = async (base64: string) => {
    setAppState(AppState.PROCESSING);
    try {
      const data = await extractLabelData(base64);
      setCurrentDelivery({ ...data, lat: userLocation?.lat, lng: userLocation?.lng });
      setPreviewVisible(true);
      setAppState(AppState.IDLE);
    } catch (err: any) {
      setAppState(AppState.IDLE);
    }
  };

  // --- ADMIN PANEL RENDERING ---
  const renderAdmin = () => {
    const stats = {
      total: 15820,
      activeUsers: 94,
      successRate: 98.2,
      avgTime: '16.5m',
      routes: [
        { label: 'Zona Norte', value: 88, color: 'bg-indigo-600' },
        { label: 'Zona Sul', value: 95, color: 'bg-indigo-400' },
        { label: 'Centro', value: 78, color: 'bg-indigo-500' },
        { label: 'Zona Leste', value: 62, color: 'bg-slate-400' },
      ]
    };

    // Master list data (Simulando Firebase para demonstração da lógica de ordenação)
    const masterDeliveriesRaw: DeliveryData[] = [
      { id: 'LF-X01', nome: 'Zilda Maria', endereco: 'Rua das Flores, 100', status: 'pending', cep: '01234-567', telefone: '(11) 98888-7777', cidade: 'São Paulo', timestamp: Date.now() } as DeliveryData,
      { id: 'LF-A02', nome: 'Alvaro Neto', endereco: 'Av. Paulista, 1500', status: 'on_way', cep: '01311-200', telefone: '(11) 97777-6666', cidade: 'São Paulo', timestamp: Date.now() } as DeliveryData,
      { id: 'LF-C03', nome: 'Bianca Lima', endereco: 'Rua Augusta, 400', status: 'delivered', cep: '01412-000', telefone: '(11) 96666-5555', cidade: 'São Paulo', timestamp: Date.now() } as DeliveryData,
      { id: 'LF-D04', nome: 'Carlos Andre', endereco: 'Rua Haddock Lobo, 12', status: 'pending', cep: '01414-001', telefone: '(11) 95555-4444', cidade: 'São Paulo', timestamp: Date.now() } as DeliveryData,
      { id: 'LF-E05', nome: 'Dandara Paz', endereco: 'Rua Oscar Freire, 99', status: 'on_way', cep: '01426-000', telefone: '(11) 94444-3333', cidade: 'São Paulo', timestamp: Date.now() } as DeliveryData,
      { id: 'LF-F06', nome: 'Beatriz Silva', endereco: 'Rua Bela Cintra, 45', status: 'pending', cep: '01415-000', telefone: '(11) 93333-2222', cidade: 'São Paulo', timestamp: Date.now() } as DeliveryData,
    ];

    // Lógica de Ordenação Automática Solicitada: Prioridade Status -> Nome
    const prioridadeStatus: Record<string, number> = { 
      "pending": 1,   // "pendente"
      "on_way": 2,    // "em andamento"
      "delivered": 3  // "concluída"
    };

    const sortedDeliveries = [...masterDeliveriesRaw].sort((a, b) => {
      const p1 = prioridadeStatus[a.status || ""] || 99;
      const p2 = prioridadeStatus[b.status || ""] || 99;

      // Primeiro Critério: Status
      if (p1 !== p2) return p1 - p2;
      
      // Segundo Critério: Nome (Alfabético)
      return (a.nome || "").localeCompare(b.nome || "");
    }).filter(d => {
      if (deliveryFilter !== 'all' && d.status !== deliveryFilter) return false;
      if (searchQuery && !(d.nome?.toLowerCase().includes(searchQuery.toLowerCase()) || d.id?.toLowerCase().includes(searchQuery.toLowerCase()) || d.cep?.includes(searchQuery))) return false;
      return true;
    });

    const mockDrivers = [
      { name: 'Carlos Lima', email: 'carlos.l@logiflow.com', lastAccess: 'Agora', processed: 142, status: 'online' },
      { name: 'Paula Sousa', email: 'paula.s@logiflow.com', lastAccess: '5m atrás', processed: 98, status: 'online' },
      { name: 'Marcos Roberto', email: 'marcos.r@logiflow.com', lastAccess: '1h atrás', processed: 456, status: 'offline' },
    ];

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans text-slate-900 antialiased overflow-hidden">
        {/* Sidebar */}
        <aside className={`fixed inset-0 lg:relative lg:flex w-full lg:w-72 bg-slate-950 p-6 flex-col gap-10 z-[100] transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="flex items-center justify-between lg:justify-start gap-4 px-2">
             <div className="flex items-center gap-3">
               <div className="bg-indigo-600 p-2 rounded-xl shadow-xl shadow-indigo-600/30">
                 <ShieldCheck className="w-6 h-6 text-white" />
               </div>
               <div>
                  <h1 className="text-xl font-black tracking-tighter uppercase italic leading-none text-white">LogiFlow</h1>
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Admin Control</span>
               </div>
             </div>
             <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2 text-white">
               <CloseIcon className="w-6 h-6" />
             </button>
          </div>

          <nav className="flex flex-col gap-1 mt-4">
             {[
               { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
               { id: 'deliveries', label: 'Master Entregas', icon: Layers },
               { id: 'drivers', label: 'Gestão de Frota', icon: Users },
             ].map((tab) => (
               <button 
                  key={tab.id}
                  onClick={() => { setAdminTab(tab.id as any); setIsMobileMenuOpen(false); }}
                  className={`flex items-center gap-4 p-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${adminTab === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}
               >
                  <tab.icon className="w-5 h-5" /> {tab.label}
               </button>
             ))}
             <div className="h-px bg-white/5 my-6 mx-4"></div>
             <button className="flex items-center gap-4 p-4 text-slate-500 hover:text-white transition-all text-[11px] font-black uppercase tracking-widest"><BarChart3 className="w-5 h-5" /> Estatísticas</button>
             <button className="flex items-center gap-4 p-4 text-slate-500 hover:text-white transition-all text-[11px] font-black uppercase tracking-widest"><Settings className="w-5 h-5" /> Configurações</button>
          </nav>

          <div className="mt-auto pt-10 px-4 border-t border-white/5">
             <button onClick={handleLogout} className="flex items-center gap-4 text-rose-400 hover:text-rose-300 transition-all text-[11px] font-black uppercase tracking-widest group">
                <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Sair
             </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto h-screen relative flex flex-col">
           <header className="h-24 bg-white border-b border-slate-200 px-8 lg:px-12 flex items-center justify-between sticky top-0 z-40">
              <div className="flex items-center gap-4">
                 <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 bg-slate-100 rounded-xl"><Menu className="w-6 h-6 text-slate-600" /></button>
                 <h2 className="text-2xl font-black text-slate-900 tracking-tighter">
                   {adminTab === 'dashboard' ? 'Overview Geral' : adminTab === 'deliveries' ? 'Mestre de Logística' : 'Performance Frota'}
                 </h2>
              </div>
              <div className="flex items-center gap-6">
                 <div className="hidden md:flex relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Pesquisar registros..." 
                      className="pl-12 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 outline-none w-64 lg:w-80"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                 </div>
                 <button className="p-3 bg-slate-50 text-slate-400 rounded-xl relative"><Bell className="w-5 h-5" /><span className="absolute top-2.5 right-2.5 w-2 h-2 bg-indigo-600 rounded-full border-2 border-white"></span></button>
                 <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xs">AD</div>
              </div>
           </header>

           <div className="p-8 lg:p-12 space-y-12">
             {adminTab === 'dashboard' && (
               <div className="animate-in fade-in duration-700 space-y-12">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
                    {[
                      { label: 'Total Entregas', value: stats.total.toLocaleString(), icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-100', trend: '+14.2%' },
                      { label: 'Usuários Ativos', value: stats.activeUsers, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100', trend: '+8' },
                      { label: 'Taxa Sucesso', value: `${stats.successRate}%`, icon: CheckCircle2, color: 'text-indigo-600', bg: 'bg-indigo-100', trend: '+1.5%' },
                      { label: 'Tempo Médio', value: stats.avgTime, icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-100', trend: '-2m' }
                    ].map((s, i) => (
                      <div key={i} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all group overflow-hidden relative">
                        <div className="flex justify-between items-start mb-6">
                           <div className={`${s.bg} ${s.color} p-4 rounded-2xl group-hover:scale-110 transition-transform relative z-10`}><s.icon className="w-6 h-6" /></div>
                           <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full relative z-10">{s.trend}</span>
                        </div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 relative z-10">{s.label}</p>
                        <h4 className="text-3xl font-black text-slate-900 relative z-10">{s.value}</h4>
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-slate-50 rounded-full group-hover:bg-indigo-50 transition-colors"></div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                     <div className="xl:col-span-2 bg-white p-10 lg:p-14 rounded-[3rem] border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-12">
                           <div>
                              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">Volume por Rota Ativa</h3>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Tráfego geográfico real-time</p>
                           </div>
                        </div>
                        <div className="space-y-10">
                           {stats.routes.map((r, i) => (
                             <div key={i} className="space-y-4">
                                <div className="flex justify-between items-center px-1">
                                   <span className="text-xs font-black text-slate-700 uppercase tracking-widest">{r.label}</span>
                                   <span className="text-sm font-black text-slate-900">{r.value}%</span>
                                </div>
                                <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                                   <div className={`h-full ${r.color} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${r.value}%` }} />
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>
                     <div className="bg-indigo-600 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
                        <div className="relative z-10">
                           <Activity className="w-12 h-12 mb-8 text-white/40" />
                           <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-4">IA Engine Status</h3>
                           <p className="text-sm opacity-80 leading-relaxed font-medium mb-10">Processamento de etiquetas com 99.8% de uptime via Gemini API.</p>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white/10 p-5 rounded-3xl border border-white/5 text-center">
                                 <p className="text-[10px] font-black uppercase opacity-60">Precisão</p>
                                 <p className="text-xl font-black">99.4%</p>
                              </div>
                              <div className="bg-white/10 p-5 rounded-3xl border border-white/5 text-center">
                                 <p className="text-[10px] font-black uppercase opacity-60">Latência</p>
                                 <p className="text-xl font-black">1.1s</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
             )}

             {adminTab === 'deliveries' && (
               <div className="animate-in slide-in-from-right duration-500 space-y-10">
                  <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                     <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12">
                        <div className="flex bg-slate-100 p-2 rounded-2xl">
                           {['all', 'pending', 'on_way', 'delivered'].map((tab) => (
                             <button 
                                key={tab}
                                onClick={() => setDeliveryFilter(tab)}
                                className={`px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${deliveryFilter === tab ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                             >
                               {tab === 'all' ? 'Tudo' : tab === 'pending' ? 'Pendentes' : tab === 'on_way' ? 'Em Rota' : 'Concluídas'}
                             </button>
                           ))}
                        </div>
                        <button className="bg-indigo-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-2"><Download className="w-4 h-4" /> Exportar CSV</button>
                     </div>
                     <div className="overflow-x-auto rounded-3xl border border-slate-50">
                        <table className="w-full text-left">
                           <thead>
                              <tr className="bg-slate-50/50">
                                 <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">#</th>
                                 <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Nome</th>
                                 <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Endereço</th>
                                 <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">CEP</th>
                                 <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Telefone</th>
                                 <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                                 <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Ações</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50">
                              {sortedDeliveries.map((d, i) => (
                                 <tr key={i} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-10 py-8 text-xs font-black text-indigo-600">{i + 1}</td>
                                    <td className="px-10 py-8 text-sm font-bold text-slate-900">{d.nome}</td>
                                    <td className="px-10 py-8 text-sm text-slate-500 font-medium max-w-xs truncate">{d.endereco}</td>
                                    <td className="px-10 py-8 text-sm text-slate-900 font-bold">{d.cep}</td>
                                    <td className="px-10 py-8 text-sm text-slate-700">{d.telefone}</td>
                                    <td className="px-10 py-8">
                                       <span className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-full ${
                                         d.status === 'delivered' ? 'bg-emerald-100 text-emerald-600' :
                                         d.status === 'on_way' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
                                       }`}>
                                          {d.status === 'delivered' ? 'Concluída' : d.status === 'on_way' ? 'Em Rota' : 'Pendente'}
                                       </span>
                                    </td>
                                    <td className="px-10 py-8"><button className="p-3 bg-white border border-slate-100 rounded-xl hover:text-indigo-600"><Eye className="w-4 h-4" /></button></td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </div>
             )}

             {adminTab === 'drivers' && (
               <div className="animate-in slide-in-from-right duration-500 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                  {mockDrivers.map((drv, i) => (
                     <div key={i} className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all">
                        <div className="flex justify-between items-start mb-10">
                           <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-4xl font-black shadow-lg ${drv.status === 'online' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                              {drv.name.charAt(0)}
                           </div>
                           <div className="text-right">
                              <span className={`text-[10px] font-black uppercase px-4 py-2 rounded-full ${drv.status === 'online' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>{drv.status}</span>
                              <p className="text-[10px] font-bold text-slate-400 mt-3 uppercase tracking-widest">{drv.lastAccess}</p>
                           </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">{drv.name}</h3>
                        <p className="text-sm font-medium text-slate-400 mb-10">{drv.email}</p>
                        <div className="grid grid-cols-2 gap-6 mb-10">
                           <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Volume</p>
                              <p className="text-2xl font-black text-slate-900">{drv.processed}</p>
                           </div>
                           <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Avaliação</p>
                              <p className="text-2xl font-black text-indigo-600">4.9/5</p>
                           </div>
                        </div>
                        <button className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">Ver Detalhes</button>
                     </div>
                  ))}
               </div>
             )}
           </div>
        </main>
      </div>
    );
  };

  const renderLanding = () => (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500 overflow-y-auto font-sans">
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-8 py-5 flex justify-between items-center max-w-md mx-auto">
        <div className="flex items-center gap-2">
          <Navigation className="w-7 h-7 text-indigo-500 fill-current" />
          <h1 className="text-xl font-black italic uppercase tracking-tighter">LogiFlow</h1>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => setAppState(AppState.LOGIN)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Entrar</button>
          <button onClick={() => setAppState(AppState.LOGIN)} className="bg-indigo-600 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20">Grátis</button>
        </div>
      </nav>
      <section className="pt-40 pb-20 px-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-600/20 via-transparent to-transparent opacity-50 -z-10" />
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-full mb-8">
          <ShieldCheck className="w-4 h-4 text-indigo-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Inteligência Artificial de Elite</span>
        </div>
        <h2 className="text-5xl md:text-6xl font-black italic uppercase leading-[0.9] tracking-tighter mb-10 max-w-xs md:max-w-md mx-auto">O Copiloto das Suas <span className="text-indigo-500">Entregas</span>.</h2>
        <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-12 max-w-sm mx-auto">Escale sua produtividade. Scanner instantâneo, roteirização autônoma e voz guiada.</p>
        <button onClick={() => setAppState(AppState.LOGIN)} className="w-full bg-indigo-600 py-6 rounded-3xl font-black uppercase tracking-widest text-[13px] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-2xl shadow-indigo-600/40">Começar 7 Dias Grátis <ArrowRight className="w-5 h-5" /></button>
      </section>
      <section className="px-8 space-y-4 mb-20 max-w-md mx-auto">
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white/5 border border-white/10 p-8 rounded-[3rem] group hover:bg-indigo-600/10 transition-all">
            <Scan className="w-12 h-12 text-indigo-500 mb-6 group-hover:scale-110 transition-transform" />
            <h4 className="text-2xl font-black uppercase italic mb-3">Scanner IA</h4>
            <p className="text-slate-400 text-xs leading-loose font-medium">Extração inteligente com LogiFlow Engine Pro.</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-8 rounded-[3rem] group hover:bg-indigo-600/10 transition-all">
            <Map className="w-12 h-12 text-blue-500 mb-6 group-hover:scale-110 transition-transform" />
            <h4 className="text-2xl font-black uppercase italic mb-3">Rotas Smart</h4>
            <p className="text-slate-400 text-xs leading-loose font-medium">Sincronização automática para dados em tempo real.</p>
          </div>
        </div>
      </section>
      <footer className="bg-white p-12 text-slate-900 rounded-t-[4rem] text-center">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Navigation className="w-7 h-7 text-indigo-600 fill-current" />
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">LogiFlow</h1>
        </div>
        <p className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.3em]">© 2024 LogiFlow Engine. Todos os direitos reservados.</p>
      </footer>
    </div>
  );

  const renderLogin = () => (
    <div className="min-h-screen bg-slate-50 p-8 flex flex-col justify-center animate-in fade-in duration-500 max-w-md mx-auto">
      <div className="flex flex-col items-center mb-16">
        <Navigation className="w-20 h-20 text-indigo-600 fill-current mb-6" />
        <h2 className="text-5xl font-black uppercase italic tracking-tighter text-slate-900">Login</h2>
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-3">Identidade Digital LogiFlow</p>
      </div>
      <form onSubmit={handleLogin} className="space-y-8">
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest px-2">E-mail Corporativo</label>
          <input required type="email" placeholder="nome@empresa.com" className="w-full p-6 bg-white border border-slate-200 rounded-[1.5rem] font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm" />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest px-2">Senha de Acesso</label>
          <input required type="password" placeholder="••••••••" className="w-full p-6 bg-white border border-slate-200 rounded-[1.5rem] font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm" />
        </div>
        <button type="submit" className="w-full bg-indigo-600 text-white py-6 rounded-[1.5rem] font-black uppercase tracking-widest text-[13px] shadow-2xl shadow-indigo-600/30 active:scale-95 transition-all">Iniciar Sessão</button>
      </form>
      <button onClick={() => setAppState(AppState.LANDING)} className="mt-12 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center w-full hover:text-slate-600 transition-colors">Voltar para Home</button>
    </div>
  );

  const renderContent = () => {
    if (appState === AppState.LANDING) return renderLanding();
    if (appState === AppState.LOGIN) return renderLogin();
    if (appState === AppState.ADMIN) return renderAdmin();
    
    // DRIVER APP: Untouched logic
    if (appState === AppState.SUBSCRIPTION) return (
       <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <CreditCard className="w-16 h-16 text-amber-600 mb-6" />
          <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-4">Teste Grátis Encerrado</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-10 max-w-xs">Seu período de teste terminou. Ative sua assinatura para continuar.</p>
          <button onClick={() => setAppState(AppState.LANDING)} className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black uppercase tracking-widest text-[12px]">Ver Planos</button>
       </div>
    );

    if (appState === AppState.IMPORT) return (
      <div className="pt-20 px-8 pb-36 min-h-screen bg-white max-w-md mx-auto">
        <header className="flex items-center gap-4 mb-10">
          <button onClick={() => setAppState(AppState.IDLE)} className="p-3 bg-slate-50 rounded-2xl border border-slate-100"><ChevronLeft className="w-6 h-6 text-slate-900" /></button>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">Importar</h2>
        </header>
        <textarea value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Endereços (um por linha)..." className="w-full h-60 p-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] font-bold text-sm focus:ring-4 focus:ring-indigo-500/5 outline-none" />
        <button onClick={handleImport} className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black uppercase tracking-widest text-[12px] mt-4 shadow-xl shadow-indigo-600/20 active:scale-95">Processar Lista</button>
      </div>
    );

    if (appState === AppState.SCANNING || appState === AppState.PROCESSING) {
      return (
        <div className="fixed inset-0 z-50 bg-black">
          <CameraScanner onCapture={handleCapture} isProcessing={appState === AppState.PROCESSING} onClose={() => setAppState(AppState.IDLE)} onOpenList={() => setAppState(AppState.HISTORY)} hasLastDelivery={deliveryList.length > 0} />
          {appState === AppState.PROCESSING && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center z-[70]">
              <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-4" />
              <p className="text-white font-black uppercase tracking-widest text-[10px]">LogiFlow Engine Extraindo...</p>
            </div>
          )}
        </div>
      );
    }

    if (appState === AppState.HISTORY) {
      return (
        <div className="pt-10 px-0 pb-40 animate-in slide-in-from-right duration-300 min-h-screen max-w-md mx-auto">
          <header className="px-6 mb-8 flex items-center justify-between">
             <div className="flex items-center gap-4">
               <button onClick={() => setAppState(AppState.IDLE)} className="p-3 bg-white shadow-sm rounded-2xl border border-slate-100"><ChevronLeft className="w-6 h-6 text-slate-900" /></button>
               <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">Meu Roteiro</h2>
             </div>
             <button onClick={() => setAppState(AppState.IMPORT)} className="bg-indigo-100 p-3 rounded-full border border-indigo-200"><Upload className="w-4 h-4 text-indigo-600" /></button>
          </header>
          <div className="flex flex-col gap-1">
            {deliveryList.map((item, idx) => (
              <DeliveryCard key={item.id} data={item} index={idx + 1} onClear={() => saveList(deliveryList.filter(d => d.id !== item.id))} isListItem={true} onComplete={() => saveList(deliveryList.map(d => d.id === item.id ? {...d, status: 'delivered'} : d))} onStartNavigation={() => saveList(deliveryList.map(d => d.id === item.id ? {...d, status: 'on_way'} : d))} />
            ))}
            {deliveryList.length > 0 && !isRouteActive && (
              <div className="px-6 mt-10 mb-20">
                <button onClick={() => { setIsRouteActive(true); saveList([...deliveryList].sort((a,b) => a.status === 'delivered' ? 1 : -1)); }} className="w-full bg-emerald-600 py-6 rounded-[2rem] font-black uppercase tracking-widest text-[11px] text-white flex items-center justify-center gap-4 shadow-xl shadow-emerald-600/20 active:scale-95"><PlayCircle className="w-6 h-6" /> Iniciar Rota</button>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="p-8 space-y-10 pb-40 relative max-w-md mx-auto">
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="bg-slate-900 p-4 rounded-[2rem] text-indigo-500 shadow-xl border border-white/5"><Navigation className="w-8 h-8 fill-current" /></div>
             <div><h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none text-slate-900">LogiFlow</h1><span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Driver Pro v2</span></div>
          </div>
          <button onClick={handleLogout} className="p-4 bg-white rounded-[2rem] shadow-lg border border-slate-50 active:scale-90 transition-all"><LogOut className="w-8 h-8 text-slate-900" /></button>
        </header>
        <div className="bg-slate-950 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl border border-white/5 group">
           <div className="relative z-10">
              <h2 className="text-5xl font-black italic uppercase mb-2 leading-[0.9] tracking-tighter">Fast<br/>Delivery.</h2>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-2">Extração instantânea via Gemini IA</p>
              <button onClick={() => setAppState(AppState.SCANNING)} className="w-full bg-indigo-600 py-8 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[12px] mt-10 flex items-center justify-center gap-4 shadow-2xl shadow-indigo-600/40 active:scale-95 transition-all"><Scan className="w-8 h-8" /> Iniciar Coleta</button>
           </div>
           <Globe className="absolute -bottom-20 -right-20 w-80 h-80 text-white/5 group-hover:text-white/10 transition-colors" />
        </div>
        <div className="grid grid-cols-2 gap-6">
           <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col items-center active:scale-95 transition-all" onClick={() => setAppState(AppState.HISTORY)}>
              <Package className="w-8 h-8 text-indigo-600 mb-2" />
              <p className="text-3xl font-black text-slate-900 leading-none">{deliveryList.filter(d => d.status !== 'delivered').length}</p>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mt-1">Pendentes</p>
           </div>
           <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col items-center cursor-pointer active:scale-95 transition-all" onClick={() => setAppState(AppState.IMPORT)}>
              <FileText className="w-8 h-8 text-emerald-500 mb-2" />
              <p className="text-3xl font-black text-slate-900 leading-none">Import</p>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mt-1">Colar Lista</p>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 relative selection:bg-indigo-100 overflow-x-hidden">
      {successToast && (
        <div className="fixed top-24 left-6 right-6 z-[120] animate-in slide-in-from-top duration-400 max-w-md mx-auto">
           <div className="bg-emerald-600 p-5 rounded-[2rem] shadow-2xl flex items-center gap-4 text-white border border-white/10">
              <CheckCircle2 className="w-7 h-7" />
              <div><p className="font-black uppercase tracking-widest text-[10px]">{successToast.title}</p><p className="text-[9px] font-medium opacity-80 uppercase">{successToast.msg}</p></div>
           </div>
        </div>
      )}
      <main className="relative z-10">{renderContent()}</main>
      {previewVisible && currentDelivery && (
        <div className="fixed inset-0 z-[110] bg-slate-950/40 backdrop-blur-[2px] flex items-end justify-center animate-in fade-in duration-300">
          <div className="w-full max-w-md">
            <DeliveryCard 
              data={currentDelivery} 
              onClear={() => setPreviewVisible(false)} 
              onConfirm={() => { saveList([{ ...currentDelivery, status: 'pending' }, ...deliveryList]); setCurrentDelivery(null); setPreviewVisible(false); setAppState(AppState.HISTORY); }} 
              onSave={(updated) => setCurrentDelivery(updated)} 
            />
          </div>
        </div>
      )}
      {user && user.role !== 'admin' && appState !== AppState.LANDING && appState !== AppState.LOGIN && appState !== AppState.SCANNING && appState !== AppState.SUBSCRIPTION && (
        <div style={{ height: '90px' }} className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-100 px-12 flex justify-between items-center z-40 shadow-[0_-15px_40px_rgba(0,0,0,0.05)]">
           <button onClick={() => setAppState(AppState.IDLE)} className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${appState === AppState.IDLE ? 'text-indigo-600' : 'text-slate-400'}`}><Package className="w-6 h-6" /><span className="text-[9px] font-black uppercase tracking-widest">Início</span></button>
           <button onClick={() => setAppState(AppState.SCANNING)} className="bg-indigo-600 p-5 rounded-full text-white -translate-y-10 shadow-2xl shadow-indigo-600/40 border-[8px] border-slate-50 active:scale-90 transition-all"><Scan className="w-8 h-8" /></button>
           <button onClick={() => setAppState(AppState.HISTORY)} className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${appState === AppState.HISTORY ? 'text-indigo-600' : 'text-slate-400'}`}><History className="w-6 h-6" /><span className="text-[9px] font-black uppercase tracking-widest">Lista</span></button>
        </div>
      )}
    </div>
  );
};

export default App;
