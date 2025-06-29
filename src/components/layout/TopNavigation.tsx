import React from 'react';
import { Plus } from 'lucide-react';

interface TopNavigationProps {
  title: string;
  showAdd?: boolean;
  onAdd?: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  title,
  showAdd = false,
  onAdd,
}) => {
  return (
    <header className="bg-black/20 backdrop-blur-md border-b border-white/10 px-4 py-4 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
        </div>
        
        <div className="flex items-center space-x-3">
          {showAdd && (
            <button
              onClick={onAdd}
              className="p-2 rounded-xl bg-primary-500 hover:bg-primary-600 transition-colors shadow-lg"
            >
              <Plus size={20} className="text-white" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};