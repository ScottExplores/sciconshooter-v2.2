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

  const mobileStatus = [
    miniApp.isMiniApp ? 'Mini App Runtime' : 'Base Account Login',
    wallet.address ? 'Wallet Ready' : 'Lab Locked',
    '1 RSC = 100 Mission Credits'
  ];

  return (
    <div className="absolute inset-0 z-10 overflow-y-auto bg-[#050814] text-white">
      <div
        className="absolute inset-0 opacity-75"
        style={{
          backgroundImage: `url(${ASSETS.MENU_HERO})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      ></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(76,145,255,0.22),transparent_45%),linear-gradient(180deg,rgba(2,6,23,0.2),rgba(2,6,23,0.96))]"></div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(120,198,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(120,198,255,0.04)_1px,transparent_1px)] bg-[size:32px_32px]"></div>

      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-6xl flex-col gap-4 px-3 pb-8 pt-3 sm:px-4 md:gap-5 md:pt-5">
        <section className="relative overflow-hidden rounded-[28px] border border-cyan-400/20 bg-black/55 p-4 shadow-[0_0_50px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-5 md:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(124,58,237,0.2),transparent_32%)]"></div>
          <div className="relative flex flex-col gap-5">
            <div className="flex flex-wrap gap-2">
              {mobileStatus.map((status) => (
                <div
                  key={status}
                  className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.26em] text-cyan-200"
                >
                  {status}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex transform flex-row items-center gap-2 -skew-x-6">
                  <div className="flex flex-col">
                    <h1 className="arcade-font select-none text-[42px] font-black italic leading-none tracking-tight text-white drop-shadow-[0_0_30px_rgba(56,189,248,0.65)] sm:text-6xl md:text-7xl">
                      SCICON
                    </h1>
                    <h1 className="arcade-font select-none text-[34px] font-black italic leading-none tracking-[0.08em] text-cyan-100 drop-shadow-[0_0_25px_rgba(59,130,246,0.55)] sm:text-5xl md:mt-[-6px] md:text-6xl">
                      SHOOTER
                    </h1>
                  </div>
                </div>

                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-200 md:text-base">
                  Mobile-first mission control is live. Run the lab mid-mission, top up 100 credits for each 1 RSC you send on Base, and swap into RSC without leaving your flow.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                <button
                  onClick={onStart}
                  className="scicon-btn col-span-2 px-6 py-4 text-sm font-bold sm:col-span-1 sm:min-w-[220px] sm:text-base"
                >
                  START MISSION
                </button>
                <button
                  onClick={onAbout}
                  className="scicon-btn scicon-btn-secondary px-4 py-3 text-xs font-bold text-gray-200 sm:min-w-[140px]"
                >
                  BRIEFING
                </button>
                <button
                  onClick={() => setShowFeedback(true)}
                  className="scicon-btn scicon-btn-secondary px-4 py-3 text-xs font-bold text-gray-400 hover:text-white sm:min-w-[140px]"
                >
                  FEEDBACK
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="relative order-1 flex flex-col gap-4 p-1">
            <div className="scicon-border-container scicon-electric-border"></div>
            <div className="scicon-inner-bg"></div>
            <div className="scicon-node node-tl-1"></div>
            <div className="scicon-node node-tr-1"></div>
            <div className="scicon-node node-bl-1"></div>
            <div className="scicon-node node-br-1"></div>

            <div className="relative z-10 flex h-full flex-col gap-4 p-4 md:p-6">
              <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-indigo-300">Mission Update</div>
                <p className="mt-2 text-sm leading-relaxed text-gray-200">
                  The laboratory now handles live wallet actions. Connect once, swap for RSC if needed, and fund only the current run.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Wallet</div>
                  <div className="mt-1 text-sm font-bold text-white">{wallet.address ? 'Connected' : 'Standby'}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Lab Rate</div>
                  <div className="mt-1 text-sm font-bold text-cyan-300">100 / 1 RSC</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/35 p-3 col-span-2 sm:col-span-1">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Swap Route</div>
                  <div className="mt-1 text-sm font-bold text-purple-300">Aerodrome</div>
                </div>
              </div>

              <button
                onClick={onOpenReferral}
                className="blue-glow-animate flex w-full flex-col items-center justify-center gap-0.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-800 py-3 text-sm font-bold text-white transition hover:brightness-110"
              >
                <span>JOIN RESEARCHHUB</span>
                <span className="text-[10px] font-mono tracking-[0.18em] text-blue-100/70">(REFERRAL LINK)</span>
              </button>

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

          <div className="relative order-2 flex min-h-0 flex-col p-1">
            <div className="scicon-border-container"></div>
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

              <div className="rounded-2xl border border-white/5 bg-black/40 p-3">
                <div className="mb-2 text-xs text-slate-300">
                  Legacy sprites are back, the lab is now onchain-aware, and every run still resets cleanly when you relaunch.
                </div>

                <div className="custom-scrollbar max-h-[42vh] overflow-y-auto pr-1 md:max-h-[52vh]">
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
                        <div
                          key={`${entry.name}-${entry.score}-${entry.wave}-${idx}`}
                          className={`flex items-center justify-between gap-2 rounded-xl px-2 py-2 font-mono text-xs font-bold ${idx === 0 ? 'border border-yellow-500/30 bg-cyan-900/40 text-yellow-300' : 'text-gray-300 hover:bg-white/5'}`}
                        >
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
          </div>
        </div>

        <div className="z-10 flex flex-col items-center space-y-1 pt-1">
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
