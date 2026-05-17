import { ASSETS } from '../constants';

export interface StoryBeat {
  phase: number;
  speaker: string;
  role: string;
  portrait: string;
  accent: string;
  title: string;
  text: string;
  objective: string;
}

export const STORY_BEATS: StoryBeat[] = [
  {
    phase: 1,
    speaker: 'Brian Armstrong',
    role: 'Clarity Relay',
    portrait: ASSETS.FOUNDER_BRIAN,
    accent: 'from-blue-400 via-cyan-300 to-emerald-300',
    title: 'Operation Open Galaxy',
    text: '.... Pilot, Brian on the Clarity relay. RSC can power the lab mid-flight: fund mission credits, upgrade the ship, and punch through the bottlenecks slowing open science.',
    objective: 'Collect credits, try the lab, and break through the paywall drones.'
  },
  {
    phase: 2,
    speaker: 'Jeffrey',
    role: 'Peer Review Shield',
    portrait: ASSETS.FOUNDER_JEFFREY,
    accent: 'from-emerald-300 via-cyan-300 to-sky-400',
    title: 'Predatory Drift',
    text: '.... Nice flying. Phase two is crawling with predatory journals and review traps. If you want a leaderboard run, upgrade early. Top pilots can help point funding credits toward ResearchHub proposals.',
    objective: 'Survive the faster journals and prepare for the first bottleneck boss.'
  },
  {
    phase: 3,
    speaker: 'Patrick',
    role: 'Funding Vector',
    portrait: ASSETS.FOUNDER_PATRICK,
    accent: 'from-yellow-300 via-emerald-300 to-cyan-300',
    title: 'Liquidity For Research',
    text: '.... The Galaxy is responding. RSC streams are coming online, but bureaucracy bricks are blocking the funding rails. Every funded upgrade is a vote for speed, clarity, and better scientific incentives.',
    objective: 'Use upgrades aggressively. The wall boss will punish slow movement.'
  },
  {
    phase: 4,
    speaker: 'Brian Armstrong',
    role: 'Clarity Relay',
    portrait: ASSETS.FOUNDER_BRIAN,
    accent: 'from-blue-400 via-indigo-300 to-cyan-300',
    title: 'Truth Optimization',
    text: '.... We are past the noise layer. The next sector is where incentives decide everything. If truth gets paid faster than friction, the whole scientific system can accelerate.',
    objective: 'Prioritize elite threats and keep pressure on the Gatekeeper.'
  },
  {
    phase: 5,
    speaker: 'Jeffrey',
    role: 'Final Systems Check',
    portrait: ASSETS.FOUNDER_JEFFREY,
    accent: 'from-red-300 via-yellow-200 to-cyan-300',
    title: 'The Gatekeeper Core',
    text: '.... Final phase. The bottleneck core is adapting to your signal. Expect swarms, bricks, and beam attacks together. Free the Galaxy from slow science. Fight for clarity.',
    objective: 'Stay mobile, preserve lives, and collapse the final review wall.'
  }
];

export const getStoryBeatForPhase = (phase: number) => (
  STORY_BEATS.find((beat) => beat.phase === phase) || null
);
