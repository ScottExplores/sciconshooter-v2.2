
import React, { useState } from 'react';
import { Stats, Upgrades } from '../types';
import { UPGRADE_BASE_COSTS, GAME_CONFIG, ASSETS } from '../constants';

interface UpgradeShopProps {
  stats: Stats;
  onUpgrade: (type: keyof Upgrades | 'repair') => void;
  onDeposit: (coins: number) => void;
  onClose: () => void;
  gameId: number;
}

const RECEIVER_ADDRESS = "0x3A8D692Aabdd4981080a8F6af8375a21359464Bf";
// PROMPT ADDRESS OVERRIDE:
const RSC_CONTRACT_ADDRESS = "0xfbb75a59193a3525a8825bebe7d4b56899e2f7e1"; 

const BASE_CHAIN_ID = '0x2105'; // 8453 in hex

const RSC_ABI = [
    "function transfer(address to, uint amount) returns (bool)",
    "function decimals() view returns (uint8)"
];

const UpgradeShop: React.FC<UpgradeShopProps> = ({ stats, onUpgrade, onDeposit, onClose, gameId }) => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [txStatus, setTxStatus] = useState<"idle" | "switching_network" | "processing" | "confirming" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [txHash, setTxHash] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  
  // Promo Code State
  const [promoCode, setPromoCode] = useState("");
  const [promoMessage, setPromoMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  const connectWallet = async () => {
    if ((window as any).ethereum) {
        try {
            await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
            setWalletConnected(true);
        } catch (err) {
            console.error(err);
        }
    } else {
        alert("Please install MetaMask to use this feature.");
    }
  };

  const switchToBase = async (provider: any) => {
      try {
          await provider.send("wallet_switchEthereumChain", [{ chainId: BASE_CHAIN_ID }]);
      } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask.
          if (switchError.code === 4902) {
              try {
                  await provider.send("wallet_addEthereumChain", [{
                      chainId: BASE_CHAIN_ID,
                      chainName: 'Base Mainnet',
                      nativeCurrency: {
                          name: 'ETH',
                          symbol: 'ETH',
                          decimals: 18
                      },
                      rpcUrls: ['https://mainnet.base.org'],
                      blockExplorerUrls: ['https://basescan.org']
                  }]);
              } catch (addError) {
                  throw new Error("Failed to add Base network.");
              }
          } else {
              throw new Error("Failed to switch to Base network.");
          }
      }
  };

  const handleDeposit = async () => {
      if (!depositAmount || isNaN(Number(depositAmount))) return;
      const amount = Number(depositAmount);
      if (amount <= 0) return;

      setTxStatus("processing");
      setErrorMessage("");
      setTxHash("");

      try {
        const ethers = (window as any).ethers;
        if (!ethers) throw new Error("Ethers.js library not loaded");

        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const network = await provider.getNetwork();

        // 1. Enforce Base Network
        if (network.chainId !== 8453n) {
            setTxStatus("switching_network");
            await switchToBase(provider);
        }

        const signer = await provider.getSigner();
        const contract = new ethers.Contract(RSC_CONTRACT_ADDRESS, RSC_ABI, signer);

        // 2. Parse Units (18 decimals for RSC)
        const weiAmount = ethers.parseUnits(depositAmount, 18);

        console.log(`Initiating transfer of ${depositAmount} RSC (${weiAmount} wei) to ${RECEIVER_ADDRESS}`);

        // 3. Send Transaction
        setTxStatus("processing");
        const tx = await contract.transfer(RECEIVER_ADDRESS, weiAmount);
        
        console.log("Transaction sent:", tx.hash);
        setTxHash(tx.hash);
        setTxStatus("confirming");

        // 4. Wait for Confirmation
        const receipt = await tx.wait();
        console.log("Transaction confirmed:", receipt);

        if (receipt.status === 1) {
            // 5. Credit In-Game Balance
            // 1 Real RSC = 50 In-Game Coins
            onDeposit(amount * 50);
            setTxStatus("success");
            setDepositAmount("");
            setTimeout(() => setTxStatus("idle"), 4000);
        } else {
            throw new Error("Transaction reverted by EVM.");
        }

      } catch (err: any) {
          console.error(err);
          setTxStatus("error");
          let msg = err.message || "Transaction failed";
          if (msg.includes("user rejected")) msg = "User rejected transaction";
          if (msg.includes("insufficient funds")) msg = "Insufficient funds for gas or RSC";
          setErrorMessage(msg);
      }
  };

  const handlePromoCode = (e: React.FormEvent) => {
      e.preventDefault();
      const code = promoCode.trim().toUpperCase();
      if(!code) return;

      if (code === "EXPLORES") {
          // Check session storage specific to this game instance
          const storageKey = `scicon_promo_explores_${gameId}`;
          if (sessionStorage.getItem(storageKey)) {
               setPromoMessage({text: "ALREADY REDEEMED THIS MISSION", type: 'error'});
               setTimeout(() => setPromoMessage(null), 2000);
               return;
          }
          
          onDeposit(100);
          sessionStorage.setItem(storageKey, "true");
          setPromoMessage({text: "ACCESS GRANTED: +100 COINS", type: 'success'});
          setPromoCode("");
          setTimeout(() => setPromoMessage(null), 3000);

      } else if (code === "HUMANITY") {
          // Unlimited use, 1000 coins
          onDeposit(1000);
          setPromoMessage({text: "HUMANITY FUNDING: +1000 COINS", type: 'success'});
          setPromoCode("");
          setTimeout(() => setPromoMessage(null), 3000);

      } else {
          setPromoMessage({text: "INVALID ACCESS CODE", type: 'error'});
          setTimeout(() => setPromoMessage(null), 2000);
      }
  };

  const addToDeposit = (amount: number) => {
      setDepositAmount(prev => {
          const current = parseFloat(prev) || 0;
          return (current + amount).toString();
      });
  };

  // Exponential Cost: Base + 5 * (2^Level - 1)
  const getCost = (type: keyof Upgrades) => {
    const level = stats.upgrades[type];
    return UPGRADE_BASE_COSTS[type] + (5 * (Math.pow(2, level) - 1));
  };
  
  // Repair Logic: Base (10) + (RepairsCount * 5)
  const getRepairCost = () => {
      const repairs = (stats as any).repairsCount || 0;
      return UPGRADE_BASE_COSTS.repair + (repairs * 5);
  };

  return (
    <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl max-h-[95vh] flex flex-col p-1">
         
         {/* SciCon Card Structure */}
         <div className="scicon-border-container"></div>
         <div className="scicon-inner-bg"></div>
         
         {/* Nodes */}
         <div className="scicon-node node-tl-1"></div>
         <div className="scicon-node node-tl-2"></div>
         <div className="scicon-node node-tr-1"></div>
         <div className="scicon-node node-tr-2"></div>
         <div className="scicon-node node-bl-1"></div>
         <div className="scicon-node node-bl-2"></div>
         <div className="scicon-node node-br-1"></div>
         <div className="scicon-node node-br-2"></div>

         <div className="relative z-10 p-4 md:p-6 overflow-y-auto custom-scrollbar flex flex-col">
             
             {/* HEADER: Title & Real RSC Icon (Left) | Grant Balance (Right) */}
             <div className="flex flex-row justify-between items-start mb-6 gap-4">
                 <div className="flex items-start gap-4 w-full md:w-auto">
                     <img src={ASSETS.REAL_RSC_ICON} className="w-16 h-16 md:w-20 md:h-20 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" alt="Real RSC" />
                     <div className="w-full">
                         <div className="flex items-center gap-2">
                            <h2 className="text-3xl md:text-4xl font-black text-white arcade-font tracking-widest text-shadow-neon leading-none">LABORATORY</h2>
                         </div>
                         <p className="text-indigo-400 text-xs font-mono uppercase mt-1 tracking-wider">Fund Research & Upgrades</p>
                         
                         {/* MOBILE ONLY: Grant Balance positioned under title */}
                         <div className="md:hidden mt-3 bg-indigo-900/40 p-2 rounded border border-indigo-500/30 flex items-center justify-between max-w-[220px]">
                            <span className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest">Grant Balance</span>
                            <div className="flex items-center gap-2">
                                 <img src="https://www.researchhub.com/icons/gold2.svg" className="w-5 h-5" alt="RSC" />
                                 <span className="text-xl font-bold text-white font-mono">{stats.coins}</span>
                            </div>
                         </div>
                     </div>
                 </div>

                 {/* DESKTOP ONLY: Separated Grant Balance */}
                 <div className="hidden md:flex bg-indigo-900/40 p-3 md:p-4 rounded border border-indigo-500/30 flex-col items-end min-w-[140px]">
                    <span className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-1">Grant Balance</span>
                    <div className="flex items-center justify-end gap-2">
                         <img src="https://www.researchhub.com/icons/gold2.svg" className="w-6 h-6" alt="RSC" />
                         <span className="text-3xl font-bold text-white font-mono">{stats.coins}</span>
                    </div>
                 </div>
             </div>

             {/* WALLET / FUNDING BAR */}
             <div className="bg-gray-900/60 p-3 md:p-4 rounded border border-gray-700 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-inner">
                <div className="text-left w-full md:w-auto">
                    <div className="text-white font-bold text-sm uppercase tracking-wide flex items-center gap-2">
                        <span>External Funding</span>
                        <span className="text-[9px] bg-indigo-600 px-1 rounded text-white font-mono">BASE NETWORK</span>
                        {/* Info Toggle Button */}
                        <button 
                            onClick={() => setShowInfo(!showInfo)}
                            className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-serif italic transition-colors ${showInfo ? 'bg-white text-black border-white' : 'border-gray-500 text-gray-500 hover:border-white hover:text-white'}`}
                        >
                            i
                        </button>
                    </div>
                    
                    {/* Expandable Info Box */}
                    {showInfo ? (
                        <div className="mt-2 mb-1 bg-black/80 border border-gray-600 p-3 rounded text-[10px] md:text-xs text-gray-300 shadow-xl max-w-sm animate-fade-in">
                             <p className="mb-2">These in-game items do not stay with your ship. These items are only for this current game only.</p>
                             <p className="text-red-300 font-bold">Your In-game balance will not roll over to your next match if you die.</p>
                             <p className="mt-1 text-gray-400 italic">So spend wisely.</p>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-[10px] mt-0.5">Deposit Real RSC to boost your session balance. (1 RSC = 50 Coins)</p>
                    )}
                </div>

                <div className="w-full md:w-auto">
                    {!walletConnected ? (
                        <button 
                            onClick={connectWallet}
                            className="w-full md:w-auto bg-white text-black hover:bg-gray-200 text-xs font-black py-2 px-6 rounded uppercase tracking-widest shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-all"
                        >
                            Connect Wallet
                        </button>
                    ) : (
                        <div className="flex flex-col gap-2 w-full md:w-auto">
                            {txStatus === 'idle' || txStatus === 'error' || txStatus === 'success' ? (
                                <div className="flex items-center gap-2">
                                    {/* Quick Adds */}
                                    <div className="flex gap-1">
                                        <button onClick={() => addToDeposit(1)} className="bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold px-3 py-2 rounded border border-gray-600 transition-colors shadow-sm active:scale-95">+1</button>
                                        <button onClick={() => addToDeposit(5)} className="bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold px-3 py-2 rounded border border-gray-600 transition-colors shadow-sm active:scale-95">+5</button>
                                    </div>

                                    {/* Input & Action */}
                                    <div className="flex gap-0 relative">
                                        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                            <img src={ASSETS.REAL_RSC_ICON} className="w-4 h-4 rounded-full" alt="Icon" />
                                        </div>
                                        <input 
                                            type="number" 
                                            placeholder="0" 
                                            className="w-24 bg-black border border-gray-600 text-white text-sm py-2 pl-8 pr-2 focus:outline-none focus:border-indigo-500 font-mono rounded-l"
                                            value={depositAmount}
                                            onChange={(e) => setDepositAmount(e.target.value)}
                                        />
                                        <button 
                                            onClick={handleDeposit}
                                            className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-4 py-2 rounded-r uppercase tracking-wider border-t border-r border-b border-green-500"
                                        >
                                            DEPOSIT
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-black/50 border border-indigo-500/50 rounded px-4 py-2 text-center min-w-[200px]">
                                    <div className="text-[10px] font-mono text-indigo-300 flex flex-col items-center">
                                        {txStatus === 'switching_network' && <span className="animate-pulse">Switching to Base...</span>}
                                        {txStatus === 'processing' && <span className="animate-pulse">Check Wallet to Sign...</span>}
                                        {txStatus === 'confirming' && <span className="animate-pulse text-yellow-400">Confirming Transaction...</span>}
                                        {txHash && (
                                            <a 
                                              href={`https://basescan.org/tx/${txHash}`} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="text-[9px] text-gray-500 underline mt-1 hover:text-white"
                                            >
                                                View on BaseScan
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {txStatus === 'success' && <div className="text-[10px] text-green-400 text-right font-bold animate-bounce">Funds Added Successfully!</div>}
                            
                            {txStatus === 'error' && (
                                <div className="text-[9px] text-red-400 leading-tight text-right bg-red-900/20 p-1 rounded max-w-[280px] self-end">
                                    {errorMessage.slice(0, 60)}{errorMessage.length > 60 ? '...' : ''}
                                </div>
                            )}
                        </div>
                    )}
                </div>
             </div>
             
             {/* PROMO CODE SECTION */}
             <div className="relative mb-6 group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded opacity-30 group-hover:opacity-75 blur transition duration-1000 animate-pulse"></div>
                <div className="relative bg-black/90 border border-indigo-500/30 p-3 rounded flex flex-col md:flex-row items-center justify-between gap-3 overflow-hidden">
                    
                    {/* Decor */}
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>

                    <div className="flex items-center gap-3 z-10">
                        <div className="w-8 h-8 rounded bg-gray-900 border border-gray-700 flex items-center justify-center animate-pulse">
                            <span className="text-lg">🎟️</span>
                        </div>
                        <div className="text-left">
                            <h3 className="text-cyan-400 font-bold font-mono text-xs tracking-widest uppercase">Promo Access</h3>
                            <p className="text-[9px] text-gray-500 uppercase">Enter code for supply drop</p>
                        </div>
                    </div>

                    <form onSubmit={handlePromoCode} className="flex items-center gap-2 w-full md:w-auto z-10">
                        <input 
                            type="text" 
                            value={promoCode}
                            onChange={(e) => {
                                setPromoCode(e.target.value);
                                setPromoMessage(null);
                            }}
                            placeholder="ENTER CODE" 
                            className="bg-gray-900/80 border border-gray-600 text-cyan-300 text-xs font-mono py-2 px-3 rounded w-full md:w-32 focus:outline-none focus:border-cyan-500 text-center uppercase tracking-widest placeholder-gray-700"
                        />
                        <button 
                            type="submit"
                            className="bg-cyan-900/50 hover:bg-cyan-800 text-cyan-200 border border-cyan-700/50 text-[10px] font-bold py-2 px-4 rounded uppercase tracking-wider transition-all hover:shadow-[0_0_10px_rgba(34,211,238,0.3)]"
                        >
                            Redeem
                        </button>
                    </form>

                    {/* Message Overlay */}
                    {promoMessage && (
                        <div className={`absolute inset-0 bg-black/90 flex items-center justify-center z-20 ${promoMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                            <span className="font-mono font-bold tracking-widest text-xs animate-bounce">{promoMessage.text}</span>
                            {promoMessage.type === 'success' && <div className="absolute inset-0 bg-green-500/10 animate-pulse"></div>}
                        </div>
                    )}
                </div>
             </div>

             {/* UPGRADES GRID */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4">
                
                {/* Fire Rate Upgrade */}
                <div className="bg-white/5 p-3 md:p-4 border border-white/5 hover:bg-white/10 transition-colors flex flex-col justify-between h-full">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="text-white font-bold text-sm uppercase tracking-wide">Rapid Review</h3>
                                <p className="text-gray-500 text-xs">Increases firing speed.</p>
                            </div>
                            <div className="text-2xl opacity-50">🔫</div>
                        </div>
                        <div className="flex space-x-1 mb-4 h-1.5">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className={`flex-1 rounded-sm ${i < stats.upgrades.fireRate ? 'bg-indigo-500' : 'bg-gray-800'}`}></div>
                            ))}
                        </div>
                    </div>
                    <button 
                        disabled={stats.coins < getCost('fireRate') || stats.upgrades.fireRate >= 5}
                        onClick={() => onUpgrade('fireRate')}
                        className={`w-full py-2 text-xs font-bold font-mono border rounded transition-all active:scale-95 ${stats.coins >= getCost('fireRate') && stats.upgrades.fireRate < 5 ? 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20' : 'bg-transparent border-gray-700 text-gray-600 cursor-not-allowed'}`}
                    >
                        {stats.upgrades.fireRate >= 5 ? 'MAX LEVEL' : `FUND (${getCost('fireRate')} RSC)`}
                    </button>
                </div>

                {/* Speed Upgrade - Icon Changed back to Lightning Bolt ⚡ */}
                <div className="bg-white/5 p-3 md:p-4 border border-white/5 hover:bg-white/10 transition-colors flex flex-col justify-between h-full">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="text-white font-bold text-sm uppercase tracking-wide">Velocity Grant</h3>
                                <p className="text-gray-500 text-xs">Increases ship speed.</p>
                            </div>
                            <div className="text-2xl opacity-50">⚡</div>
                        </div>
                        <div className="flex space-x-1 mb-4 h-1.5">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className={`flex-1 rounded-sm ${i < stats.upgrades.speed ? 'bg-purple-500' : 'bg-gray-800'}`}></div>
                            ))}
                        </div>
                    </div>
                    <button 
                        disabled={stats.coins < getCost('speed') || stats.upgrades.speed >= 5}
                        onClick={() => onUpgrade('speed')}
                        className={`w-full py-2 text-xs font-bold font-mono border rounded transition-all active:scale-95 ${stats.coins >= getCost('speed') && stats.upgrades.speed < 5 ? 'bg-purple-600 border-purple-500 text-white hover:bg-purple-500 shadow-lg shadow-purple-500/20' : 'bg-transparent border-gray-700 text-gray-600 cursor-not-allowed'}`}
                    >
                        {stats.upgrades.speed >= 5 ? 'MAX LEVEL' : `FUND (${getCost('speed')} RSC)`}
                    </button>
                </div>

                {/* Missile Upgrade */}
                <div className="bg-white/5 p-3 md:p-4 border border-white/5 hover:bg-white/10 transition-colors flex flex-col justify-between h-full">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="text-white font-bold text-sm uppercase tracking-wide">Proton Missiles</h3>
                                <p className="text-gray-500 text-xs">Fires homing missiles automatically.</p>
                            </div>
                            <div className="text-2xl opacity-50">🚀</div>
                        </div>
                        <div className="flex space-x-1 mb-4 h-1.5">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className={`flex-1 rounded-sm ${i < stats.upgrades.missile ? 'bg-blue-500' : 'bg-gray-800'}`}></div>
                            ))}
                        </div>
                    </div>
                    <button 
                        disabled={stats.coins < getCost('missile') || stats.upgrades.missile >= 5}
                        onClick={() => onUpgrade('missile')}
                        className={`w-full py-2 text-xs font-bold font-mono border rounded transition-all active:scale-95 ${stats.coins >= getCost('missile') && stats.upgrades.missile < 5 ? 'bg-blue-600 border-blue-500 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20' : 'bg-transparent border-gray-700 text-gray-600 cursor-not-allowed'}`}
                    >
                        {stats.upgrades.missile >= 5 ? 'MAX LEVEL' : `FUND (${getCost('missile')} RSC)`}
                    </button>
                </div>

                {/* REPAIR HULL */}
                <div className="bg-white/5 p-3 md:p-4 border border-white/5 hover:bg-white/10 transition-colors flex flex-col justify-between h-full">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="text-white font-bold text-sm uppercase tracking-wide">Emergency Aid</h3>
                                <p className="text-gray-500 text-xs">Recover 1 Life unit.</p>
                            </div>
                            <div className="text-2xl opacity-50">❤️</div>
                        </div>
                        <div className="flex space-x-1 mb-4 h-1.5 bg-transparent"></div>
                    </div>
                    <button 
                        disabled={stats.coins < getRepairCost()} // Removed Max Life check
                        onClick={() => onUpgrade('repair')}
                        className={`w-full py-2 text-xs font-bold font-mono border rounded transition-all active:scale-95 ${stats.coins >= getRepairCost() ? 'bg-red-600 border-red-500 text-white hover:bg-red-500 shadow-lg shadow-red-500/20' : 'bg-transparent border-gray-700 text-gray-600 cursor-not-allowed'}`}
                    >
                        {`ADD LIFE (${getRepairCost()} RSC)`}
                    </button>
                </div>

             </div>

             <button 
                onClick={onClose}
                className="scicon-btn w-full py-3 md:py-4 text-base md:text-lg font-bold tracking-widest shrink-0 mt-auto"
             >
                RETURN TO MISSION
             </button>
         </div>
      </div>
    </div>
  );
};

export default UpgradeShop;
