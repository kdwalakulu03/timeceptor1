import React from 'react';
import { SERVICES } from '../services';
import { ServiceId } from '../types';

interface ServiceSelectorProps {
  selected: ServiceId;
  onSelect: (id: ServiceId) => void;
}

export function ServiceSelector({ selected, onSelect }: ServiceSelectorProps) {
  return (
    <div className="mb-8">
      <label className="font-mono text-sm tracking-widest uppercase text-gold-light block mb-3">
        What are you timing?
      </label>
      <div className="flex flex-wrap gap-2">
        {SERVICES.map(service => (
          <button
            key={service.id}
            onClick={() => onSelect(service.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-sm border font-mono text-xs tracking-widest uppercase transition-all duration-200 ${
              selected === service.id
                ? 'bg-gold text-space-bg border-gold font-bold'
                : 'bg-black/30 text-cream-dim border-gold/20 hover:border-gold/50 hover:text-cream'
            }`}
          >
            <span>{service.icon}</span>
            <span>{service.name}</span>
          </button>
        ))}
      </div>
      {SERVICES.find(s => s.id === selected) && (
        <p className="font-mono text-xs text-cream-dim tracking-widest uppercase mt-2">
          {SERVICES.find(s => s.id === selected)?.tagline}
        </p>
      )}
    </div>
  );
}
