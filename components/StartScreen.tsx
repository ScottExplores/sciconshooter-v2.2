
import React, { useState } from 'react';
import { TEXT_STRINGS, ASSETS } from '../constants';
import { LeaderboardEntry } from '../types';

interface StartScreenProps {
  onStart: () => void;
  onAbout: () => void;
  leaderboard: LeaderboardEntry[];
  isLoading: boolean;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart, onAbout, leaderboard, isLoading }) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState({
    liked: '',
    change: '',
    disliked: ''
  });
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSendFeedback = async () => {
    // Don't send empty forms
    if (!feedback.liked && !feedback.change && !feedback.disliked) return;
    
    setIsSending(true);
    setSendStatus('idle');

    try {
        const response = await fetch("https://formsubmit.co/ajax/scottexplores29@gmail.com", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                _subject: "SciCon Shooter Feedback (v2.1)",
                _template: "table",
                "What they liked": feedback.liked || "N/A",
                "Suggested Changes": feedback.change || "N/A",
                "What they disliked": feedback.disliked || "N/A"
            })
        });

        if (response.ok) {
            setSendStatus('success');
            setTimeout(() => {
                setShowFeedback(false);
                setFeedback({ liked: '', change: '', disliked: '' });
                setSendStatus('idle');
                setIsSending(false);
            }, 2000);
        } else {
            setSendStatus('error');
            setIsSending(false);
        }
    } catch (error) {
        console.error("Feedback error:", error);
        setSendStatus('error');
        setIsSending(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-[#0b1020] flex flex-col items-center justify-start pt-4 md:pt-8 p-4 text-white z-10 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1534796636912-3b95b3ab5980?auto=format&fit=crop&w=1080&q=80')] bg-cover bg-center animate-pulse"></div>
      
      {/* Decorative Tech Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(108,99,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(108,99,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

      {/* Main Content - Centered Vertically now - SPACEY-2 reduced from SPACEY-6 */}
      <div className="z-10 w-full max-w-lg flex flex-col items-center justify-center space-y-2 h-full pb-8">
        
        {/* Header Section */}
        <div className="relative text-center w-full flex flex-col items-center shrink-0">
           
           {/* Title Block: Flex Row - SCICON SHOOTER (Left) | 2025 (Right) */}
           <div className="flex flex-row items-center justify-center transform -skew-x-6 gap-2">
               
               {/* Left Column: Stacked SCICON / SHOOTER */}
               <div className="flex flex-col items-end">
                   <h1 className="text-5xl md:text-7xl font-black arcade-font tracking-tighter text-white drop-shadow-[0_0_30px_rgba(99,102,241,0.8)] leading-none select-none italic">
                     SCICON
                   </h1>
                   <h1 className="text-4xl md:text-6xl font-black arcade-font tracking-wide text-indigo-100 drop-shadow-[0_0_30px_rgba(99,102,241,0.6)] leading-none select-none italic mt-[-5px]">
                     SHOOTER
                   </h1>
               </div>

               {/* Right Column: Vertical 2025 - Sized to match height */}
               <div className="h-[80px] md:h-[130px] w-0.5 bg-indigo-500/50 rounded mx-0"></div>
               <div className="flex flex-col justify-between h-[80px] md:h-[130px] leading-none pt-1">
                  <span className="text-lg md:text-3xl font-bold text-transparent arcade-font select-none" style={{ WebkitTextStroke: '1px #818cf8' }}>2</span>
                  <span className="text-lg md:text-3xl font-bold text-transparent arcade-font select-none" style={{ WebkitTextStroke: '1px #818cf8' }}>0</span>
                  <span className="text-lg md:text-3xl font-bold text-transparent arcade-font select-none" style={{ WebkitTextStroke: '1px #818cf8' }}>2</span>
                  <span className="text-lg md:text-3xl font-bold text-transparent arcade-font select-none" style={{ WebkitTextStroke: '1px #818cf8' }}>5</span>
               </div>
           </div>
        </div>

        {/* SciCon Card Style Menu */}
        <div className="relative w-full p-1 flex flex-col">
            {/* Added electric-border class here */}
            <div className="scicon-border-container scicon-electric-border"></div>
            <div className="scicon-inner-bg"></div>
            <div className="scicon-node node-tl-1"></div>
            <div className="scicon-node node-tl-2"></div>
            <div className="scicon-node node-tr-1"></div>
            <div className="scicon-node node-tr-2"></div>
            <div className="scicon-node node-bl-1"></div>
            <div className="scicon-node node-bl-2"></div>
            <div className="scicon-node node-br-1"></div>
            <div className="scicon-node node-br-2"></div>

            <div className="relative z-10 p-4 md:p-6 flex flex-col items-center space-y-3 md:space-y-4">
                
                {/* GLOBAL LEADERBOARD HEADER */}
                <h3 className="text-xs font-bold text-indigo-400 text-center tracking-widest border-b border-indigo-500/30 pb-1 w-full shrink-0">GLOBAL LEADERBOARD</h3>

                {/* GLOBAL LEADERBOARD CONTENT */}
                <div className="w-full bg-black/40 border border-white/5 p-2 rounded max-h-[30vh] md:max-h-64 overflow-y-auto custom-scrollbar shrink">
                    
                    {/* Leaderboard Header */}
                    <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono uppercase tracking-wide px-1 mb-1 gap-2">
                        <span className="w-8 md:w-10">Rank</span>
                        <span className="flex-1 text-left">Scientist</span>
                        <span className="w-8 text-center">Wave</span>
                        <span className="w-14 text-right">Impact</span>
                    </div>

                    <div className="space-y-1">
                        {isLoading ? (
                             <div className="text-center text-xs text-gray-500 py-4 animate-pulse">Scanning Archive...</div>
                        ) : leaderboard.length === 0 ? (
                             <div className="text-center text-xs text-red-400 py-4">Connection Error.<br/>Retrying...</div>
                        ) : (
                            leaderboard.map((entry, idx) => (
                                <div key={idx} className={`flex justify-between items-center text-xs font-mono font-bold px-1 py-1 rounded gap-2 ${idx === 0 ? 'bg-indigo-900/50 text-yellow-300 border border-yellow-500/30' : 'text-gray-300 hover:bg-white/5'}`}>
                                    <div className={`${idx === 0 ? 'text-yellow-400' : 'text-gray-500'} w-8 md:w-10 shrink-0`}>
                                        #{idx + 1}
                                    </div>
                                    <div className="flex-1 text-left truncate">
                                        {entry.name}
                                    </div>
                                    <div className="w-8 text-center text-indigo-400">
                                        {entry.wave || 1}
                                    </div>
                                    <div className={`w-14 text-right ${idx === 0 ? 'text-white' : 'text-gray-400'}`}>
                                        {entry.score.toLocaleString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="w-full space-y-2 md:space-y-3 shrink-0">
                    <button 
                      onClick={onStart}
                      className="scicon-btn w-full py-3 md:py-4 text-lg md:text-xl font-bold flex items-center justify-center gap-3 group"
                    >
                      <span>START MISSION</span>
                    </button>

                    <button 
                      onClick={() => window.open(ASSETS.REFERRAL_LINK, '_blank')}
                      className="scicon-btn w-full py-2 md:py-3 text-xs md:text-sm font-bold bg-gradient-to-r from-blue-600 to-blue-700 border-none text-white hover:brightness-110 flex flex-col items-center justify-center leading-tight group relative"
                      style={{ background: 'linear-gradient(90deg, #5C5CFF 0%, #4040B0 100%)' }}
                    >
                      <span>JOIN RESEARCHHUB</span>
                      <span className="text-[9px] md:text-[10px] opacity-75 font-mono tracking-widest mt-0.5">(REFERRAL LINK)</span>
                    </button>
                    
                    <button 
                      onClick={onAbout}
                      className="scicon-btn scicon-btn-secondary w-full py-2 md:py-3 text-xs md:text-sm font-bold text-gray-400"
                    >
                      BRIEFING
                    </button>

                    <button 
                      onClick={() => setShowFeedback(true)}
                      className="scicon-btn scicon-btn-secondary w-full py-2 md:py-3 text-xs md:text-sm font-bold text-gray-500 hover:text-white mt-1 border-gray-800 hover:border-gray-500"
                    >
                      FEEDBACK
                    </button>
                </div>
            </div>
        </div>
        
        {/* Footer */}
        <div className="flex flex-col items-center space-y-1 z-10 pt-2 shrink-0">
           <span className="text-[10px] text-gray-600 font-mono">v2.1</span>
           <img 
              src="https://www.researchhub.foundation/assets/logo_long-BIzx5axY.svg" 
              alt="ResearchHub Foundation" 
              className="h-8 md:h-10 w-auto opacity-90 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:opacity-100 transition-opacity"
           />
        </div>
      </div>

      {/* FEEDBACK MODAL */}
      {showFeedback && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
             <div className="relative w-full max-w-md p-1">
                 <div className="scicon-border-container"></div>
                 <div className="scicon-inner-bg"></div>
                 <div className="scicon-node node-tl-1"></div>
                 <div className="scicon-node node-tr-1"></div>
                 <div className="scicon-node node-bl-1"></div>
                 <div className="scicon-node node-br-1"></div>

                 <div className="relative z-10 p-6 text-center space-y-4">
                    <h2 className="text-xl font-bold text-indigo-400 arcade-font tracking-widest">WE WANT YOUR FEEDBACK</h2>
                    
                    <div className="space-y-3 text-left">
                        <div>
                            <label className="text-indigo-400 text-[10px] font-bold tracking-widest uppercase mb-1 block">What did you like?</label>
                            <textarea 
                                value={feedback.liked}
                                onChange={(e) => setFeedback({...feedback, liked: e.target.value})}
                                className="w-full bg-black/50 border border-gray-600 rounded p-2 text-xs text-white focus:border-indigo-500 outline-none font-mono resize-none disabled:opacity-50"
                                rows={2}
                                disabled={isSending}
                            />
                        </div>
                        <div>
                            <label className="text-yellow-400 text-[10px] font-bold tracking-widest uppercase mb-1 block">What would you change?</label>
                            <textarea 
                                value={feedback.change}
                                onChange={(e) => setFeedback({...feedback, change: e.target.value})}
                                className="w-full bg-black/50 border border-gray-600 rounded p-2 text-xs text-white focus:border-yellow-500 outline-none font-mono resize-none disabled:opacity-50"
                                rows={2}
                                disabled={isSending}
                            />
                        </div>
                        <div>
                            <label className="text-red-400 text-[10px] font-bold tracking-widest uppercase mb-1 block">What did you dislike?</label>
                            <textarea 
                                value={feedback.disliked}
                                onChange={(e) => setFeedback({...feedback, disliked: e.target.value})}
                                className="w-full bg-black/50 border border-gray-600 rounded p-2 text-xs text-white focus:border-red-500 outline-none font-mono resize-none disabled:opacity-50"
                                rows={2}
                                disabled={isSending}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-4">
                        <button 
                            onClick={handleSendFeedback}
                            disabled={isSending || (!feedback.liked && !feedback.change && !feedback.disliked)}
                            className={`scicon-btn w-full py-3 text-sm font-bold flex items-center justify-center gap-2 ${sendStatus === 'success' ? '!bg-green-600 !border-green-500' : ''}`}
                        >
                            {sendStatus === 'idle' && (
                                <><span>📨</span> SEND FEEDBACK</>
                            )}
                            {sendStatus === 'success' && (
                                <span className="animate-pulse">RECEIVED! THANK YOU</span>
                            )}
                            {sendStatus === 'error' && (
                                <span>ERROR, TRY AGAIN</span>
                            )}
                            {isSending && sendStatus === 'idle' && (
                                <span className="animate-pulse">TRANSMITTING...</span>
                            )}
                        </button>
                        
                        {!isSending && (
                            <button 
                                onClick={() => setShowFeedback(false)}
                                className="text-gray-500 text-xs hover:text-white underline tracking-widest font-bold"
                            >
                                CLOSE
                            </button>
                        )}
                    </div>
                 </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default StartScreen;
