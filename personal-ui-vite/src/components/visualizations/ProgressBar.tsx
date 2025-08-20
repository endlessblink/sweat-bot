import React from 'react';

interface ProgressData {
  label: string;
  current: number;
  target: number;
  unit: string;
  color: 'primary' | 'success' | 'warning' | 'danger';
}

interface MultiProgressBarProps {
  data: ProgressData[];
}

const colorClasses = {
  primary: 'bg-blue-500',
  success: 'bg-green-500', 
  warning: 'bg-yellow-500',
  danger: 'bg-red-500'
};

const bgColorClasses = {
  primary: 'bg-blue-500/10',
  success: 'bg-green-500/10',
  warning: 'bg-yellow-500/10', 
  danger: 'bg-red-500/10'
};

export function MultiProgressBar({ data }: MultiProgressBarProps) {
  return (
    <div className="space-y-4">
      {data.map((item, index) => {
        const percentage = Math.min((item.current / item.target) * 100, 100);
        const isComplete = item.current >= item.target;
        
        return (
          <div key={index} className={`p-3 rounded-lg ${bgColorClasses[item.color]}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-sm">{item.label}</span>
              <span className="text-sm text-muted-foreground">
                {item.current} / {item.target} {item.unit}
              </span>
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${colorClasses[item.color]}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            
            <div className="flex justify-between items-center mt-2 text-xs">
              <span className={isComplete ? 'text-green-400' : 'text-muted-foreground'}>
                {isComplete ? '✅ הושג!' : `${Math.round(percentage)}%`}
              </span>
              {!isComplete && (
                <span className="text-muted-foreground">
                  נותרו {item.target - item.current} {item.unit}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default MultiProgressBar;