import { X } from 'lucide-react';
import { Button } from './ui/button';
import RewardAnimation from './RewardAnimation';

interface RewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  points: number;
}

const RewardModal = ({ isOpen, onClose, title, points }: RewardModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="relative w-full max-w-md rounded-2xl border border-neutral-700 bg-neutral-900 p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-2 text-neutral-400 transition hover:bg-neutral-800 hover:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          aria-label="Close reward modal"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <RewardAnimation />
          <div>
            <h2 className="text-2xl font-semibold text-white">{title}</h2>
            <p className="mt-2 text-base font-medium text-yellow-400">
              You've earned {points} points!
            </p>
          </div>
          <Button onClick={onClose} className="mt-2">
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RewardModal;
