import React from 'react';

interface ModelSelectorProps {
  selectedModel: 'gemini' | 'gemma3n' | 'vision';
  onModelChange: (model: 'gemini' | 'gemma3n' | 'vision') => void;
}

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-white text-sm">מודל:</label>
      <select
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value as any)}
        className="px-3 py-1 rounded bg-white/20 text-white border border-white/30 text-sm"
      >
        <option value="gemini">Gemini (מהיר, אונליין)</option>
        <option value="gemma3n">Gemma3n (מקומי, פרטי)</option>
        <option value="vision">Vision (לתמונות)</option>
      </select>
    </div>
  );
}