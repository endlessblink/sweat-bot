import { Trophy } from 'lucide-react';

const RewardAnimation = () => (
  <div className="flex items-center justify-center">
    <div className="relative">
      <Trophy className="h-16 w-16 text-yellow-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)] animate-bounce" />
      <div className="absolute inset-0 animate-ping rounded-full bg-yellow-500/20" />
    </div>
  </div>
);

export default RewardAnimation;
