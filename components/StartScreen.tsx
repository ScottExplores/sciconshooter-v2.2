import React, { useState } from 'react';
import { ASSETS } from '../constants';
import { DonationStatus, LeaderboardEntry, MiniAppState, WalletSession } from '../types';
import SupportPanel from './SupportPanel';

interface StartScreenProps {
  onStart: () => void;
  onAbout: () => void;
  leaderboard: LeaderboardEntry[];
  isLoading: boolean;
  wallet: WalletSession;
  donationStatus: DonationStatus;
  donationHash: string;
  donationError: string;
  miniApp: MiniAppState;
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
  onDonate: (amount: number) => void;
  onOpenReferral: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({
  onStart,
  onAbout,
  leaderboard,
  isLoading,
  wallet,
  donationStatus,
  donationHash,
  donationError,
  miniApp,
  onConnectWallet,
  onDisconnectWallet,
  onDonate,
  onOpenReferral
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState({
    liked: '',
    change: '',
    disliked: ''
  });
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSendFeedback = async () => {
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
          _subject: "SciCon Shooter Feedback (v2.2)",
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
        return;
      }

      setSendStatus('error');
      setIsSending(false);
    } catch (error) {
      console.error("Feedback error:", error);
      setSendStatus('error');
      setIsSending(false);
    }
  };

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-start overflow-hidden bg-[#050814] p-4 pt-4 text-white md:pt-8">
      <div
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage: `url(${ASSETS.MENU_HERO})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      ></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(76,145,255,0.2),transparent_45%),linear-gradient(180deg,rgba(2,6,23,0.35),rgba(2,6,23,0.92))]"></div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(120,198,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(120,198,255,0.05)_1px,transparent_1px)] bg-[size:36px_36px]"></div>

      <div className="z-10 flex h-full w-full max-w-5xl flex-col items-center justify-center gap-4 pb-8 md:gap-6">
        <div className="w-full text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.32em] text-cyan-200">
            {miniApp.isMiniApp ? 'Mini App Runtime' : 'Base Arcade Build'}
          </div>
          <div className="flex transform flex-row items-center justify-center gap-2 -skew-x-6">
            <div className="flex flex-col items-center">
              <h1 className="arcade-font select-none text-5xl font-black italic leading-none tracking-tighter text-white drop-shadow-[0_0_30px_rgba(56,189,248,0.65)] md:text-7xl">
                SCICON
              </h1>
              <h1 className="arcade-font select-none text-4xl font-black italic leading-none tracking-wide text-cyan-100 drop-shadow-[0_0_25px_rgba(59,130,246,0.55)] md:mt-[-6px] md:text-6xl">
                SHOOTER
              </h1>
            </div>
          </div>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
            Legacy sprites are now back in the mix. Keep the flask ship, fight through animated enemies, and spend only the RSC you earn in a run.
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative flex min-h-0 flex-col p-1">
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

            <div className="relative z-10 flex h-full flex-col gap-4 p-4 md:p-6">
              <div className="flex items-center justify-between gap-3 border-b border-indigo-500/30 pb-1">
                <h3 className="text-xs font-bold tracking-widest text-indigo-300">GLOBAL LEADERBOARD</h3>
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-gray-500">Merged local + cloud archive</span>
              </div>

              <div className="custom-scrollbar max-h-[32vh] overflow-y-auto rounded border border-white/5 bg-black/40 p-2 md:max-h-[42vh]">
                <div className="mb-1 flex items-center justify-between gap-2 px-1 font-mono text-[10px] uppercase tracking-wide text-gray-500">
                  <span className="w-8 md:w-10">Rank</span>
                  <span className="flex-1 text-left">Scientist</span>
                  <span className="w-8 text-center">Wave</span>
                  <span className="w-14 text-right">Impact</span>
                </div>

                <div className="space-y-1">
                  {isLoading ? (
                    <div className="py-4 text-center text-xs text-gray-500 animate-pulse">Scanning archive...</div>
                  ) : leaderboard.length === 0 ? (
                    <div className="py-4 text-center text-xs text-red-400">Connection error. Retrying...</div>
                  ) : (
                    leaderboard.map((entry, idx) => (
                      <div key={`${entry.name}-${entry.score}-${entry.wave}-${idx}`} className={`flex items-center justify-between gap-2 rounded px-1 py-1 font-mono text-xs font-bold ${idx === 0 ? 'border border-yellow-500/30 bg-cyan-900/40 text-yellow-300' : 'text-gray-300 hover:bg-white/5'}`}>
                        <div className={`${idx === 0 ? 'text-yellow-400' : 'text-gray-500'} w-8 shrink-0 md:w-10`}>
                          #{idx + 1}
                        </div>
                        <div className="flex-1 truncate text-left">{entry.name}</div>
                        <div className="w-8 text-center text-indigo-400">{entry.wave || 1}</div>
                        <div className={`w-14 text-right ${idx === 0 ? 'text-white' : 'text-gray-400'}`}>
                          {entry.score.toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="relative flex flex-col gap-4 p-1">
            <div className="scicon-border-container"></div>
            <div className="scicon-inner-bg"></div>
            <div className="scicon-node node-tl-1"></div>
            <div className="scicon-node node-tr-1"></div>
            <div className="scicon-node node-bl-1"></div>
            <div className="scicon-node node-br-1"></div>

            <div className="relative z-10 flex h-full flex-col gap-4 p-4 md:p-6">
              <div className="rounded border border-cyan-500/20 bg-cyan-500/5 p-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-300">Mission Update</div>
                <p className="mt-2 text-sm leading-relaxed text-gray-300">
                  Wallet flow is simpler now. Use the wallet only if you want to donate. Upgrade spending stays fully in-game.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={onStart}
                  className="scicon-btn group flex w-full items-center justify-center gap-3 py-4 text-lg font-bold md:text-xl"
                >
                  <span>START MISSION</span>
                </button>

                <button
                  onClick={onOpenReferral}
                  className="blue-glow-animate flex w-full flex-col items-center justify-center gap-0.5 rounded bg-gradient-to-r from-blue-600 to-blue-800 py-3 text-sm font-bold text-white transition hover:brightness-110"
                >
                  <span>JOIN RESEARCHHUB</span>
                  <span className="text-[10px] font-mono tracking-[0.18em] text-blue-100/70">(REFERRAL LINK)</span>
                </button>

                <button
                  onClick={onAbout}
                  className="scicon-btn scicon-btn-secondary w-full py-3 text-sm font-bold text-gray-300"
                >
                  BRIEFING
                </button>

                <button
                  onClick={() => setShowFeedback(true)}
                  className="scicon-btn scicon-btn-secondary mt-1 w-full border-gray-800 py-3 text-sm font-bold text-gray-500 hover:border-gray-500 hover:text-white"
                >
                  FEEDBACK
                </button>
              </div>

              <SupportPanel
                wallet={wallet}
                isMiniApp={miniApp.isMiniApp}
                donationStatus={donationStatus}
                donationHash={donationHash}
                donationError={donationError}
                onConnect={onConnectWallet}
                onDisconnect={onDisconnectWallet}
                onDonate={onDonate}
              />
            </div>
          </div>
        </div>

        <div className="z-10 flex flex-col items-center space-y-1 pt-2">
          <span className="text-[10px] font-mono text-gray-500">v2.2</span>
          <img
            src="https://www.researchhub.foundation/assets/logo_long-BIzx5axY.svg"
            alt="ResearchHub Foundation"
            className="h-8 w-auto opacity-90 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-opacity hover:opacity-100 md:h-10"
          />
        </div>
      </div>

      {showFeedback ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md p-1">
            <div className="scicon-border-container"></div>
            <div className="scicon-inner-bg"></div>
            <div className="scicon-node node-tl-1"></div>
            <div className="scicon-node node-tr-1"></div>
            <div className="scicon-node node-bl-1"></div>
            <div className="scicon-node node-br-1"></div>

            <div className="relative z-10 space-y-4 p-6 text-center">
              <h2 className="arcade-font text-xl font-bold tracking-widest text-indigo-400">WE WANT YOUR FEEDBACK</h2>

              <div className="space-y-3 text-left">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-indigo-400">What did you like?</label>
                  <textarea
                    value={feedback.liked}
                    onChange={(e) => setFeedback({ ...feedback, liked: e.target.value })}
                    className="w-full resize-none rounded border border-gray-600 bg-black/50 p-2 font-mono text-xs text-white outline-none focus:border-indigo-500 disabled:opacity-50"
                    rows={2}
                    disabled={isSending}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-yellow-400">What would you change?</label>
                  <textarea
                    value={feedback.change}
                    onChange={(e) => setFeedback({ ...feedback, change: e.target.value })}
                    className="w-full resize-none rounded border border-gray-600 bg-black/50 p-2 font-mono text-xs text-white outline-none focus:border-yellow-500 disabled:opacity-50"
                    rows={2}
                    disabled={isSending}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-red-400">What did you dislike?</label>
                  <textarea
                    value={feedback.disliked}
                    onChange={(e) => setFeedback({ ...feedback, disliked: e.target.value })}
                    className="w-full resize-none rounded border border-gray-600 bg-black/50 p-2 font-mono text-xs text-white outline-none focus:border-red-500 disabled:opacity-50"
                    rows={2}
                    disabled={isSending}
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                <button
                  onClick={handleSendFeedback}
                  disabled={isSending || (!feedback.liked && !feedback.change && !feedback.disliked)}
                  className={`scicon-btn flex w-full items-center justify-center gap-2 py-3 text-sm font-bold ${sendStatus === 'success' ? '!border-green-500 !bg-green-600' : ''}`}
                >
                  {sendStatus === 'idle' && !isSending ? <span>SEND FEEDBACK</span> : null}
                  {sendStatus === 'idle' && isSending ? <span className="animate-pulse">TRANSMITTING...</span> : null}
                  {sendStatus === 'success' ? <span className="animate-pulse">RECEIVED. THANK YOU.</span> : null}
                  {sendStatus === 'error' ? <span>ERROR. TRY AGAIN.</span> : null}
                </button>

                {!isSending ? (
                  <button
                    onClick={() => setShowFeedback(false)}
                    className="text-xs font-bold tracking-widest text-gray-500 underline hover:text-white"
                  >
                    CLOSE
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default StartScreen;
