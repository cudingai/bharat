
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ViewState, Transaction, Category, LeakageStats, Language } from './types';
import { MOCK_SMS_TEMPLATES } from './constants';
import { translations } from './translations';
import Dashboard from './components/Dashboard';
import Insights from './components/Insights';
import TransactionCard from './components/TransactionCard';
import { 
  generateWeeklyInsight, 
  parseTransactionFromText, 
  parseTransactionFromImage, 
  parseTransactionFromAudio 
} from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ViewState>('dashboard');
  const [lang, setLang] = useState<Language>('en');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [aiInsight, setAiInsight] = useState<string>("Analyzing your micro-patterns...");
  const [isManualInputOpen, setIsManualInputOpen] = useState(false);
  const [manualText, setManualText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  
  // Security Settings State
  const [settings, setSettings] = useState({
    localEncryption: true,
    smsParsing: true,
    anonymousMode: false
  });

  // Voice & Image States
  const [isRecording, setIsRecording] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = translations[lang];

  // Load Data
  useEffect(() => {
    const savedData = localStorage.getItem('axiony_data');
    const savedLang = localStorage.getItem('axiony_lang') as Language;
    const savedSettings = localStorage.getItem('axiony_settings');

    if (savedLang) setLang(savedLang);
    if (savedSettings) setSettings(JSON.parse(savedSettings));
    
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData).map((t: any) => ({ ...t, timestamp: new Date(t.timestamp) }));
        setTransactions(parsed);
      } catch (e) {
        console.error("Data corruption, resetting.");
      }
    } else {
      const initial: Transaction[] = [
        { id: 'tx1', amount: 25, merchant: 'Chai Point', category: 'Food', timestamp: new Date(), isAutoCaptured: true },
        { id: 'tx2', amount: 80, merchant: 'Quick Cab', category: 'Travel', timestamp: new Date(Date.now() - 3600000), isAutoCaptured: true },
      ];
      setTransactions(initial);
    }
  }, []);

  // Persistence
  useEffect(() => {
    localStorage.setItem('axiony_data', JSON.stringify(transactions));
    localStorage.setItem('axiony_lang', lang);
    localStorage.setItem('axiony_settings', JSON.stringify(settings));
  }, [transactions, lang, settings]);

  // Update Insights
  useEffect(() => {
    if (transactions.length > 0) {
      const fetchInsight = async () => {
        const text = await generateWeeklyInsight(transactions.slice(0, 5));
        setAiInsight(text || "Monitoring the invisible...");
      };
      fetchInsight();
    } else {
      setAiInsight(t.noLeaks);
    }
  }, [transactions, lang]);

  const stats = useMemo((): LeakageStats => {
    const today = new Date().toDateString();
    const todayTxs = transactions.filter(t => new Date(t.timestamp).toDateString() === today);
    const total = todayTxs.reduce((sum, t) => sum + t.amount, 0);
    const categoryCounts: any = {};
    transactions.forEach(t => categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1);
    const topCategory = (Object.entries(categoryCounts).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'Food') as Category;
    const score = Math.min(100, (transactions.length * 2) + Math.floor(total / 20));

    return { todayTotal: total, weekTotal: total * 7, leakageScore: score, topCategory };
  }, [transactions]);

  const addParsedTransaction = (parsed: any, isAutoCaptured: boolean = false, image?: string) => {
    const amount = parsed?.amount || parseFloat(manualText) || (image ? 0 : null);
    
    if (amount === null && !image) return false;

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      amount: amount || 0,
      merchant: parsed?.merchant || (manualText.length > 0 ? manualText.split(' ')[0] : (image ? "Photo Receipt" : "Manual Entry")),
      category: (parsed?.category || "Misc") as Category,
      timestamp: parsed?.timestamp ? new Date(parsed.timestamp) : new Date(),
      isAutoCaptured: isAutoCaptured,
      receiptImage: image || pendingImage || undefined,
    };

    setTransactions(prev => [newTx, ...prev]);
    setManualText("");
    setPendingImage(null);
    setIsManualInputOpen(false);
    return true;
  };

  const handleAddManual = async () => {
    setIsParsing(true);
    const parsed = await parseTransactionFromText(manualText || "Manual Entry");
    addParsedTransaction(parsed, false);
    setIsParsing(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const fullBase64 = reader.result as string;
      setPendingImage(fullBase64);
      
      const base64DataOnly = fullBase64.split(',')[1];
      const parsed = await parseTransactionFromImage(base64DataOnly, file.type);
      
      if (parsed && parsed.amount) {
        addParsedTransaction(parsed, false, fullBase64);
      }
      setIsParsing(false);
    };
    reader.readAsDataURL(file);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        setIsParsing(true);
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          const parsed = await parseTransactionFromAudio(base64, 'audio/webm');
          addParsedTransaction(parsed, false);
          setIsParsing(false);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const simulateSms = () => {
    if (!settings.smsParsing) {
      alert("Please enable SMS Parsing in the Safe tab first.");
      setActiveTab('settings');
      return;
    }
    const temp = MOCK_SMS_TEMPLATES[Math.floor(Math.random() * MOCK_SMS_TEMPLATES.length)];
    const amt = parseFloat(temp.match(/₹(\d+\.?\d*)/)?.[1] || "0");
    const newTx: Transaction = {
      id: `auto-${Date.now()}`,
      amount: amt,
      merchant: temp.includes("Chai") ? "Raju Tea" : temp.includes("Rickshaw") ? "Auto Rickshaw" : "Digital Payment",
      category: temp.includes("Chai") ? "Food" : temp.includes("Rickshaw") ? "Travel" : "Misc",
      timestamp: new Date(),
      isAutoCaptured: true,
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Mask merchant if anonymous mode is on
  const displayTransactions = useMemo(() => {
    if (!settings.anonymousMode) return transactions;
    return transactions.map(tx => ({
      ...tx,
      merchant: tx.isAutoCaptured ? "Auto Transaction" : "Manual Log"
    }));
  }, [transactions, settings.anonymousMode]);

  return (
    <div className="w-full min-h-screen bg-[#F9F9F7] text-gray-900" lang={lang}>
      <div className="max-w-md mx-auto min-h-screen flex flex-col relative overflow-hidden bg-white shadow-sm border-x border-gray-100">
        
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {activeTab === 'dashboard' && (
            <Dashboard 
              stats={stats} 
              recentTransactions={displayTransactions.slice(0, 3)} 
              aiInsight={aiInsight}
              onViewAll={() => setActiveTab('feed')}
              lang={lang}
            />
          )}
          {activeTab === 'feed' && (
            <div className="px-6 pt-12 pb-32 space-y-6">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-3xl font-outfit font-semibold text-gray-900">{t.feed}</h2>
                  <p className="text-sm text-gray-400 font-medium">{t.autoParsed}</p>
                </div>
                <button 
                  onClick={simulateSms} 
                  className={`text-[10px] font-bold px-4 py-2 rounded-xl active:scale-95 transition-all ${settings.smsParsing ? 'text-teal-600 bg-teal-50' : 'text-gray-400 bg-gray-100 opacity-50'}`}
                >
                  {t.testSms}
                </button>
              </div>
              <div className="space-y-3">
                {displayTransactions.length === 0 ? (
                  <div className="py-20 text-center text-gray-300 font-medium uppercase text-[10px] tracking-widest">{t.noLeaks}</div>
                ) : (
                  displayTransactions.map(tx => (
                    <TransactionCard 
                      key={tx.id} 
                      transaction={tx} 
                      onDelete={deleteTransaction} 
                      lang={lang}
                    />
                  ))
                )}
              </div>
            </div>
          )}
          {activeTab === 'insights' && <Insights transactions={transactions} lang={lang} />}
          {activeTab === 'settings' && (
             <div className="px-6 pt-12 pb-32 space-y-10">
               <div>
                 <h2 className="text-3xl font-outfit font-semibold text-gray-900">{t.security}</h2>
                 <p className="text-sm text-gray-400 font-medium">{t.privacyDesign}</p>
               </div>

               <div className="space-y-4">
                 <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">{t.langSelect}</h3>
                 <div className="grid grid-cols-2 gap-3">
                   {[
                     { code: 'sat', name: 'ᱥᱟᱱᱛᱟᱲᱤ', label: 'Santali' },
                     { code: 'en', name: 'English', label: 'English' },
                     { code: 'bn', name: 'বাংলা', label: 'Bengali' },
                     { code: 'hi', name: 'हिन्दी', label: 'Hindi' }
                   ].map((l) => (
                     <button
                        key={l.code}
                        onClick={() => setLang(l.code as Language)}
                        className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between h-24 ${lang === l.code ? 'border-teal-500 bg-teal-50/50 shadow-sm' : 'border-gray-100 bg-white active:bg-gray-50'}`}
                     >
                       <span className="text-lg font-bold">{l.name}</span>
                       <span className="text-[10px] uppercase font-bold text-gray-400 tracking-tighter">{l.label}</span>
                     </button>
                   ))}
                 </div>
               </div>

               <div className="space-y-4">
                  {[
                    { id: 'localEncryption', label: 'Local Encryption', desc: 'On-device only', icon: 'fa-lock' },
                    { id: 'smsParsing', label: 'SMS Parsing', desc: 'Private AI logic', icon: 'fa-envelope-open' },
                    { id: 'anonymousMode', label: 'Anonymous Mode', desc: 'No email required', icon: 'fa-user-secret' }
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-5 bento-card">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${settings[item.id as keyof typeof settings] ? 'bg-teal-50 text-teal-600' : 'bg-gray-50 text-gray-400'}`}>
                          <i className={`fa-solid ${item.icon}`}></i>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{item.label}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{item.desc}</p>
                        </div>
                      </div>
                      <div 
                        onClick={() => toggleSetting(item.id as keyof typeof settings)}
                        className={`w-10 h-5 rounded-full flex items-center px-1 cursor-pointer transition-all duration-300 ${settings[item.id as keyof typeof settings] ? 'bg-teal-500 justify-end' : 'bg-gray-200 justify-start'}`}
                      >
                        <div className="w-3 h-3 bg-white rounded-full shadow-sm"></div>
                      </div>
                    </div>
                  ))}
               </div>
             </div>
          )}
        </div>

        {/* Navigation */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md h-24 bg-white/80 backdrop-blur-xl border-t border-gray-100 flex justify-around items-center px-8 z-50">
          <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center space-y-1 ${activeTab === 'dashboard' ? 'text-teal-600' : 'text-gray-300'}`}>
            <i className="fa-solid fa-house-chimney text-xl"></i>
            <span className="text-[8px] font-bold uppercase tracking-widest">{t.dash}</span>
          </button>
          <button onClick={() => setActiveTab('feed')} className={`flex flex-col items-center space-y-1 ${activeTab === 'feed' ? 'text-teal-600' : 'text-gray-300'}`}>
            <i className="fa-solid fa-receipt text-xl"></i>
            <span className="text-[8px] font-bold uppercase tracking-widest">{t.feed}</span>
          </button>
          
          <button 
            onClick={() => setIsManualInputOpen(true)}
            className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg -translate-y-4 transform hover:scale-110 transition-all active:scale-95"
          >
            <i className="fa-solid fa-plus text-xl"></i>
          </button>

          <button onClick={() => setActiveTab('insights')} className={`flex flex-col items-center space-y-1 ${activeTab === 'insights' ? 'text-teal-600' : 'text-gray-300'}`}>
            <i className="fa-solid fa-chart-simple text-xl"></i>
            <span className="text-[8px] font-bold uppercase tracking-widest">{t.stats}</span>
          </button>
          <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center space-y-1 ${activeTab === 'settings' ? 'text-teal-600' : 'text-gray-300'}`}>
            <i className="fa-solid fa-shield text-xl"></i>
            <span className="text-[8px] font-bold uppercase tracking-widest">{t.safe}</span>
          </button>
        </div>

        {/* Modal */}
        {isManualInputOpen && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/20 backdrop-blur-md">
            <div className="w-full max-w-md bg-white rounded-t-[40px] p-8 pb-12 space-y-6 bottom-sheet animate-slide-up shadow-2xl relative">
              <div className="w-12 h-1 bg-gray-100 rounded-full mx-auto mb-2"></div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-outfit font-bold text-gray-900">{t.logSpend}</h3>
                  <p className="text-xs text-gray-400 font-medium">{t.captureDetails}</p>
                </div>
                <button onClick={() => { setIsManualInputOpen(false); setPendingImage(null); }} className="w-10 h-10 bg-gray-50 rounded-full text-gray-400">
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>

              <div className="relative group overflow-hidden rounded-3xl">
                <textarea 
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="₹45 for coffee..."
                  className="w-full h-40 p-6 bg-gray-50 border-none focus:ring-0 text-gray-700 font-medium resize-none transition-all"
                />

                {pendingImage && (
                  <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                    <img src={pendingImage} alt="Preview" className="w-full h-full object-cover rounded-2xl opacity-90" />
                    <button 
                      onClick={() => setPendingImage(null)}
                      className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full text-white backdrop-blur-md flex items-center justify-center"
                    >
                      <i className="fa-solid fa-times text-xs"></i>
                    </button>
                    <div className="absolute bottom-4 left-4 right-4 bg-teal-500/90 text-white p-2 rounded-xl text-[10px] font-bold text-center uppercase tracking-widest">
                      <i className="fa-solid fa-check mr-2"></i> {t.savePhoto}
                    </div>
                  </div>
                )}
                
                <div className="absolute bottom-4 right-4 flex space-x-2 z-20">
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                  <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400 hover:text-teal-600 transition-all">
                    <i className="fa-solid fa-camera text-lg"></i>
                  </button>
                  <button 
                    onMouseDown={startRecording} onMouseUp={stopRecording}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-gray-400'}`}
                  >
                    <i className={`fa-solid ${isRecording ? 'fa-microphone-lines' : 'fa-microphone'} text-lg`}></i>
                  </button>
                </div>
              </div>

              <button 
                onClick={handleAddManual}
                disabled={isParsing || (!manualText.trim() && !pendingImage)}
                className={`w-full py-5 rounded-2xl text-white font-bold transition-all shadow-md ${isParsing ? 'bg-gray-300' : 'bg-black active:scale-95 disabled:opacity-20'}`}
              >
                {isParsing ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : null}
                {isParsing ? t.processing : t.confirmSpend}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
