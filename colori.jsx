import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Circle,
  LayoutDashboard,
  Settings,
  Plus,
  Zap,
  Palette,
  Rocket,
  Sun,
  Moon,
  Search,
  Bell,
  ChevronRight,
  ChevronDown,
  Mail,
  Lock,
  CreditCard,
  ShoppingCart,
  Layers,
  Table as TableIcon,
  MessageSquare,
  AlertCircle,
  Clock,
  User,
  MoreVertical,
  Star,
} from "lucide-react";

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState(null);

  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Analisi Gradienti Mesh",
      completed: true,
      description: "Estrazione dei codici HEX dall'immagine originale.",
    },
    {
      id: 2,
      title: "Definizione Design System",
      completed: true,
      description: "Creazione dei componenti atomici per Light e Dark mode.",
    },
    {
      id: 3,
      title: "Sviluppo Logica Toggle",
      completed: true,
      description: "Implementazione dello stato per il cambio tema dinamico.",
    },
    {
      id: 4,
      title: "Test di Contrasto",
      completed: false,
      description:
        "Verificare la leggibilità dei testi sulle sfumature chiare.",
    },
    {
      id: 5,
      title: "Deploy Applicazione",
      completed: false,
      description:
        "Pubblicazione della versione finale con supporto multitema.",
    },
  ]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const toggleTask = (id) =>
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );

  const themeClasses = {
    bg: isDarkMode
      ? "bg-slate-950 text-slate-100"
      : "bg-slate-50 text-slate-900",
    sidebar: isDarkMode
      ? "bg-slate-900/50 border-white/5"
      : "bg-white/80 border-slate-200",
    card: isDarkMode
      ? "bg-slate-900/40 border-white/5 shadow-none"
      : "bg-white border-slate-100 shadow-xl shadow-slate-200/50",
    input: isDarkMode
      ? "bg-white/5 border-white/10 text-white placeholder-slate-500"
      : "bg-white border-slate-200 text-slate-900 placeholder-slate-400",
    textMuted: isDarkMode ? "text-slate-400" : "text-slate-500",
    border: isDarkMode ? "border-white/5" : "border-slate-200",
    taskBg: (comp) =>
      isDarkMode
        ? comp
          ? "bg-purple-500/10 border-purple-500/20"
          : "bg-white/5 border-transparent hover:border-white/10"
        : comp
          ? "bg-purple-50 border-purple-100"
          : "bg-white border-slate-100 hover:border-purple-100 hover:shadow-md",
  };

  // --- COMPONENTI INTERNI ---

  const Badge = ({ children, color = "purple" }) => (
    <span
      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
        color === "purple"
          ? "bg-purple-500/10 text-purple-500"
          : "bg-blue-500/10 text-blue-500"
      }`}
    >
      {children}
    </span>
  );

  const Accordion = ({ title, content, id }) => (
    <div className={`border-b transition-all ${themeClasses.border}`}>
      <button
        onClick={() => setActiveAccordion(activeAccordion === id ? null : id)}
        className="w-full py-4 flex justify-between items-center text-left font-bold"
      >
        {title}
        <ChevronDown
          className={`transition-transform ${activeAccordion === id ? "rotate-180" : ""}`}
          size={18}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${activeAccordion === id ? "max-h-40 pb-4 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <p className={themeClasses.textMuted}>{content}</p>
      </div>
    </div>
  );

  const FlipBox = ({ frontTitle, backText }) => (
    <div className="group h-48 [perspective:1000px]">
      <div
        className={`relative h-full w-full rounded-3xl transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]`}
      >
        <div
          className={`absolute inset-0 flex items-center justify-center rounded-3xl [backface-visibility:hidden] border ${themeClasses.card}`}
        >
          <h4 className="font-bold text-lg">{frontTitle}</h4>
        </div>
        <div className="absolute inset-0 h-full w-full rounded-3xl bg-gradient-to-br from-purple-600 to-blue-500 text-white p-6 [transform:rotateY(180deg)] [backface-visibility:hidden] flex flex-col justify-center">
          <p className="text-sm font-medium">{backText}</p>
        </div>
      </div>
    </div>
  );

  // --- VIEWS ---

  const DashboardView = () => (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: "Revenue",
            value: "€12,450",
            icon: CreditCard,
            color: "text-purple-500",
          },
          {
            label: "Active Users",
            value: "1,284",
            icon: User,
            color: "text-blue-500",
          },
          {
            label: "Conversion",
            value: "14.2%",
            icon: Rocket,
            color: "text-pink-500",
          },
        ].map((stat, i) => (
          <div
            key={`${stat.label}-${i}`}
            className={`p-8 rounded-[2rem] border transition-all ${themeClasses.card}`}
          >
            <div className={`p-3 w-fit rounded-2xl mb-4 bg-white/5`}>
              <stat.icon
                className={stat.icon === Rocket ? "text-pink-500" : stat.color}
                size={24}
              />
            </div>
            <p className={`text-sm font-medium ${themeClasses.textMuted}`}>
              {stat.label}
            </p>
            <h3 className="text-3xl font-black mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div
        className={`p-8 md:p-10 rounded-[3rem] border transition-all ${themeClasses.card}`}
      >
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-bold">Successione Task</h2>
            <p className={`mt-1 ${themeClasses.textMuted}`}>
              Step critici per il completamento del progetto.
            </p>
          </div>
          <button className="p-4 bg-purple-600 text-white rounded-2xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20">
            <Plus size={24} />
          </button>
        </div>
        <div className="space-y-4">
          {tasks.map((task, index) => (
            <div
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className={`group cursor-pointer flex items-center gap-6 p-6 rounded-3xl border transition-all ${themeClasses.taskBg(task.completed)}`}
            >
              <div className="relative flex-shrink-0">
                {task.completed ? (
                  <CheckCircle2 className="text-purple-500" size={32} />
                ) : (
                  <Circle className="text-slate-300" size={32} />
                )}
                {index < tasks.length - 1 && (
                  <div
                    className={`absolute top-10 left-1/2 w-0.5 h-10 -translate-x-1/2 ${task.completed ? "bg-purple-500/30" : "bg-slate-200/50"}`}
                  />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <Badge color={task.completed ? "purple" : "blue"}>
                    FASE {index + 1}
                  </Badge>
                  <h4
                    className={`text-lg font-bold ${task.completed ? "text-slate-400 line-through" : ""}`}
                  >
                    {task.title}
                  </h4>
                </div>
                <p
                  className={`text-sm ${task.completed ? "text-slate-300" : themeClasses.textMuted}`}
                >
                  {task.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const FormsView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className={`p-10 rounded-[2.5rem] border ${themeClasses.card}`}>
        <h3 className="text-2xl font-bold mb-8">Sign In</h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="email"
                placeholder="nome@azienda.it"
                className={`w-full pl-12 pr-6 py-4 rounded-2xl border focus:outline-none focus:ring-4 focus:ring-purple-500/10 transition-all ${themeClasses.input}`}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Password</label>
            <div className="relative">
              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="password"
                placeholder="••••••••"
                className={`w-full pl-12 pr-6 py-4 rounded-2xl border focus:outline-none focus:ring-4 focus:ring-purple-500/10 transition-all ${themeClasses.input}`}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              className="w-5 h-5 rounded accent-purple-600"
              id="rem"
            />
            <label htmlFor="rem" className="text-sm font-medium">
              Ricordami su questo dispositivo
            </label>
          </div>
          <button className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black rounded-2xl shadow-xl shadow-purple-500/20 hover:scale-[1.02] transition-transform">
            ACCEDI
          </button>
        </div>
      </div>

      <div className="space-y-8">
        <div className={`p-8 rounded-[2.5rem] border ${themeClasses.card}`}>
          <h3 className="text-xl font-bold mb-6">Controlli Applicazione</h3>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold">Notifiche Push</p>
                <p className={`text-xs ${themeClasses.textMuted}`}>
                  Ricevi alert in tempo reale.
                </p>
              </div>
              <div className="w-12 h-6 bg-purple-600 rounded-full relative p-1 cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute right-1" />
              </div>
            </div>
            <div className="flex justify-between items-center opacity-50">
              <div>
                <p className="font-bold">Modalità Aereo</p>
                <p className={`text-xs ${themeClasses.textMuted}`}>
                  Sospendi tutte le connessioni.
                </p>
              </div>
              <div className="w-12 h-6 bg-slate-300 rounded-full relative p-1 cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute left-1" />
              </div>
            </div>
          </div>
        </div>

        <div className={`p-8 rounded-[2.5rem] border ${themeClasses.card}`}>
          <h3 className="text-xl font-bold mb-4">Volume Output</h3>
          <input
            type="range"
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
          <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    </div>
  );

  const DataView = () => (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div
        className={`overflow-hidden rounded-[2.5rem] border ${themeClasses.card}`}
      >
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-xl font-bold">Log Attività</h3>
          <button className="text-sm text-purple-500 font-bold">
            Esporta CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className={`text-xs font-black uppercase tracking-widest ${themeClasses.textMuted} bg-white/5`}
              >
                <th className="p-6">Utente</th>
                <th className="p-6">Stato</th>
                <th className="p-6">Ruolo</th>
                <th className="p-6">Data</th>
                <th className="p-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                {
                  name: "Marco Rossi",
                  status: "Active",
                  role: "Admin",
                  date: "12 Dic 2023",
                },
                {
                  name: "Giulia Bianchi",
                  status: "Paused",
                  role: "Designer",
                  date: "10 Dic 2023",
                },
                {
                  name: "Luca Verdi",
                  status: "Active",
                  role: "Developer",
                  date: "08 Dic 2023",
                },
              ].map((row, i) => (
                <tr
                  key={`${row.name}-${i}`}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="p-6 font-bold">{row.name}</td>
                  <td className="p-6">
                    <span
                      className={`px-2 py-1 rounded-md text-[10px] font-bold ${row.status === "Active" ? "bg-green-500/10 text-green-500" : "bg-orange-500/10 text-orange-500"}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className={`p-6 text-sm ${themeClasses.textMuted}`}>
                    {row.role}
                  </td>
                  <td className={`p-6 text-sm ${themeClasses.textMuted}`}>
                    {row.date}
                  </td>
                  <td className="p-6 text-right">
                    <MoreVertical size={16} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className={`p-8 rounded-[2.5rem] border ${themeClasses.card}`}>
          <h3 className="text-xl font-bold mb-6">Calendario Eventi</h3>
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold mb-4">
            {["L", "M", "M", "G", "V", "S", "D"].map((d, i) => (
              <div key={`${d}-${i}`} className="text-slate-400">
                {d}
              </div>
            ))}
            {Array.from({ length: 31 }).map((_, i) => (
              <div
                key={`day-${i}`}
                className={`p-3 rounded-xl cursor-pointer hover:bg-purple-500/10 transition-colors ${i + 1 === 15 ? "bg-purple-600 text-white" : ""}`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
        <div className={`p-8 rounded-[2.5rem] border ${themeClasses.card}`}>
          <h3 className="text-xl font-bold mb-6">Descrizione Progetto</h3>
          <dl className="space-y-4">
            <div className="flex flex-col border-b border-white/5 pb-4">
              <dt
                className={`text-xs font-bold uppercase ${themeClasses.textMuted}`}
              >
                Budget Stimato
              </dt>
              <dd className="font-bold text-lg mt-1">€45.000,00</dd>
            </div>
            <div className="flex flex-col border-b border-white/5 pb-4">
              <dt
                className={`text-xs font-bold uppercase ${themeClasses.textMuted}`}
              >
                Deadline
              </dt>
              <dd className="font-bold text-lg mt-1">30 Gennaio 2024</dd>
            </div>
            <div className="flex flex-col">
              <dt
                className={`text-xs font-bold uppercase ${themeClasses.textMuted}`}
              >
                Team Leader
              </dt>
              <dd className="font-bold text-lg mt-1">Alessandro Riva</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );

  const ElementsView = () => (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FlipBox
          frontTitle="Flip Me"
          backText="Questi componenti utilizzano CSS 3D transforms per effetti spettacolari."
        />
        <FlipBox
          frontTitle="Modern UI"
          backText="Stile ispirato ai gradienti estratti dalla tua immagine."
        />
        <FlipBox
          frontTitle="Responsive"
          backText="Ottimizzato per mobile, tablet e desktop widescreen."
        />
        <FlipBox
          frontTitle="Interact"
          backText="Passa il mouse per scoprire i dettagli tecnici."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className={`p-8 rounded-[2.5rem] border ${themeClasses.card}`}>
          <h3 className="text-xl font-bold mb-6">Accordion & FAQ</h3>
          <Accordion
            id={1}
            title="Cos'è il Glassmorphism?"
            content="È un design trend che utilizza trasparenze, sfocature e bordi sottili per creare un effetto di vetro smerigliato."
          />
          <Accordion
            id={2}
            title="Come funzionano i gradienti?"
            content="Utilizziamo mesh gradient complessi per dare profondità e dinamismo alle interfacce moderne."
          />
          <Accordion
            id={3}
            title="Supporto Multitema?"
            content="L'applicazione cambia tutte le classi Tailwind in base allo stato isDarkMode in tempo reale."
          />
        </div>
        <div className="space-y-6">
          <div
            className={`p-6 rounded-3xl border flex items-center gap-4 bg-blue-500/10 border-blue-500/20 text-blue-500`}
          >
            <AlertCircle size={24} />
            <p className="text-sm font-bold">
              Update di sistema disponibile. Versione 2.4.
            </p>
          </div>
          <div
            className={`p-6 rounded-3xl border flex items-center gap-4 bg-green-500/10 border-green-500/20 text-green-500`}
          >
            <CheckCircle2 size={24} />
            <p className="text-sm font-bold">
              Tutti i backup sono stati completati con successo.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full py-6 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black rounded-[2rem] shadow-2xl hover:scale-[1.02] transition-transform"
          >
            APRI MODAL DIALOG
          </button>
        </div>
      </div>
    </div>
  );

  const EcommerceView = () => (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div
            key={`product-${i}`}
            className={`group rounded-[2.5rem] overflow-hidden border transition-all ${themeClasses.card}`}
          >
            <div className="h-64 bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center p-10">
              <Zap className="text-purple-500 w-20 h-20 group-hover:scale-110 transition-transform" />
            </div>
            <div className="p-8">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-xl font-black">Prodotto Tech v.{i}</h4>
                <span className="font-bold text-purple-600">€299,00</span>
              </div>
              <div className="flex gap-1 text-orange-400 mb-6">
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
                <Star size={14} />
              </div>
              <button className="w-full py-4 bg-slate-100 dark:bg-white/5 hover:bg-purple-600 hover:text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2">
                <ShoppingCart size={18} /> AGGIUNGI
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div
          className={`lg:col-span-2 p-8 rounded-[2.5rem] border ${themeClasses.card}`}
        >
          <h3 className="text-xl font-bold mb-8">Checkout Rapido</h3>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <input
                type="text"
                placeholder="Nome"
                className={`p-4 rounded-2xl border ${themeClasses.input}`}
              />
              <input
                type="text"
                placeholder="Cognome"
                className={`p-4 rounded-2xl border ${themeClasses.input}`}
              />
            </div>
            <input
              type="text"
              placeholder="Indirizzo di spedizione"
              className={`w-full p-4 rounded-2xl border ${themeClasses.input}`}
            />
            <div className="flex items-center gap-4 p-4 rounded-2xl border border-dashed border-slate-300">
              <CreditCard className="text-slate-400" />
              <span className="text-sm font-bold text-slate-400 italic">
                Pagamento sicuro via Stripe
              </span>
            </div>
          </div>
        </div>
        <div
          className={`p-8 rounded-[2.5rem] bg-gradient-to-br from-purple-600 to-blue-600 text-white`}
        >
          <h3 className="text-xl font-bold mb-6">Riepilogo Ordine</h3>
          <div className="space-y-4 mb-8">
            <div className="flex justify-between text-sm">
              <span>Subtotale</span>
              <span>€897,00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Spedizione</span>
              <span>Gratis</span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t border-white/20 pt-4 text-lg">
              <span>Totale</span>
              <span>€897,00</span>
            </div>
          </div>
          <button className="w-full py-4 bg-white text-purple-600 font-black rounded-2xl shadow-xl hover:bg-slate-50 transition-colors">
            PAGA ORA
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`min-h-screen transition-colors duration-500 font-sans selection:bg-purple-500/30 ${themeClasses.bg}`}
    >
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
        <div
          className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full transition-colors duration-700 blur-[120px] ${isDarkMode ? "bg-purple-600/20" : "bg-purple-200/40"}`}
        />
        <div
          className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full transition-colors duration-700 blur-[120px] ${isDarkMode ? "bg-blue-600/20" : "bg-blue-100/50"}`}
        />
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-sm bg-black/40 animate-in fade-in duration-300">
          <div
            className={`w-full max-w-md p-10 rounded-[2.5rem] border shadow-2xl ${isDarkMode ? "bg-slate-900 border-white/10" : "bg-white border-slate-200"}`}
          >
            <h3 className="text-2xl font-bold mb-4">Conferma Operazione</h3>
            <p className={`${themeClasses.textMuted} mb-8`}>
              Sei sicuro di voler procedere con il deploy in produzione? Questa
              azione non può essere annullata.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-4 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors dark:border-white/10 dark:hover:bg-white/5"
              >
                ANNULLA
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-4 font-black rounded-2xl bg-purple-600 text-white shadow-lg shadow-purple-500/20"
              >
                PROCEDI
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row min-h-screen">
        {/* Navigation Sidebar */}
        <nav
          className={`w-full md:w-24 backdrop-blur-xl border-r flex md:flex-col items-center py-4 md:py-10 gap-10 px-6 md:px-0 z-20 transition-colors duration-500 ${themeClasses.sidebar}`}
        >
          <div className="w-12 h-12 bg-gradient-to-tr from-purple-500 via-pink-500 to-blue-400 rounded-2xl flex items-center justify-center shadow-lg">
            <Zap className="text-white fill-white" size={24} />
          </div>

          <div className="flex md:flex-col gap-8 ml-auto md:ml-0 items-center">
            <button
              onClick={toggleTheme}
              className={`p-3 rounded-2xl transition-all ${isDarkMode ? "bg-white/5 text-yellow-400" : "bg-slate-100 text-slate-600"}`}
            >
              {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
            </button>
            <div className="flex md:flex-col gap-6">
              {[
                { id: "dashboard", icon: LayoutDashboard },
                { id: "forms", icon: MessageSquare },
                { id: "data", icon: TableIcon },
                { id: "elements", icon: Layers },
                { id: "ecommerce", icon: ShoppingCart },
              ].map((tab) => (
                <tab.icon
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className={`cursor-pointer transition-all hover:scale-110 ${currentTab === tab.id ? "text-purple-500 scale-110" : "text-slate-400"}`}
                  size={24}
                />
              ))}
            </div>
            <Settings className="text-slate-400 cursor-pointer mt-auto" />
          </div>
        </nav>

        {/* Main Workspace */}
        <main className="flex-1 p-6 md:p-12 lg:p-16 overflow-y-auto">
          <header className="mb-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tight">
                UI Kit{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 capitalize">
                  {currentTab}
                </span>
              </h1>
              <p className={`text-lg font-medium ${themeClasses.textMuted}`}>
                Libreria di componenti completa e multitema.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="relative group max-w-md w-full">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Cerca componenti..."
                  className={`pl-12 pr-6 py-4 rounded-2xl w-full border ${themeClasses.input}`}
                />
              </div>
              <button
                className={`p-4 rounded-2xl border ${themeClasses.card} transition-colors`}
              >
                <Bell size={20} />
              </button>
            </div>
          </header>

          {/* Render Active View */}
          {currentTab === "dashboard" && <DashboardView />}
          {currentTab === "forms" && <FormsView />}
          {currentTab === "data" && <DataView />}
          {currentTab === "elements" && <ElementsView />}
          {currentTab === "ecommerce" && <EcommerceView />}
        </main>
      </div>
    </div>
  );
};

export default App;
