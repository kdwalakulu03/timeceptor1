import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock } from 'lucide-react';

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const hours = Array.from({ length: 12 }, (_, i) => i + 1);
const minutes = Array.from({ length: 60 }, (_, i) => i);
const ampms = ['AM', 'PM'];

export function TimePicker({ value, onChange, disabled }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const [hour24, minute] = value ? value.split(':').map(Number) : [12, 0];
  const initialAmPm = hour24 >= 12 ? 'PM' : 'AM';
  const initialHour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

  const [selectedHour, setSelectedHour] = useState(initialHour12 || 12);
  const [selectedMinute, setSelectedMinute] = useState(minute || 0);
  const [selectedAmPm, setSelectedAmPm] = useState(initialAmPm || 'AM');

  useEffect(() => {
    if (isOpen) {
      const [h24, m] = value ? value.split(':').map(Number) : [12, 0];
      setSelectedAmPm(h24 >= 12 ? 'PM' : 'AM');
      setSelectedHour(h24 % 12 === 0 ? 12 : h24 % 12);
      setSelectedMinute(m || 0);
    }
  }, [isOpen, value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConfirm = () => {
    let h24 = selectedHour;
    if (selectedAmPm === 'PM' && h24 !== 12) h24 += 12;
    if (selectedAmPm === 'AM' && h24 === 12) h24 = 0;
    
    const formattedHour = h24.toString().padStart(2, '0');
    const formattedMinute = selectedMinute.toString().padStart(2, '0');
    onChange(`${formattedHour}:${formattedMinute}`);
    setIsOpen(false);
  };

  const displayValue = value 
    ? `${(initialHour12 || 12).toString().padStart(2, '0')}:${(minute || 0).toString().padStart(2, '0')} ${initialAmPm}`
    : 'Select Time';

  return (
    <div className="relative w-full" ref={popoverRef}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`bg-black/80 border-2 border-gold/30 rounded-sm p-4 text-white font-medium outline-none transition-all flex items-center justify-between ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gold/60 focus:border-gold focus:ring-1 focus:ring-gold/20'}`}
      >
        <span>{displayValue}</span>
        <Clock className="w-5 h-5 text-gold/70" />
      </div>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-50 mt-2 w-full bg-black border border-gold/30 rounded-md shadow-xl shadow-black/50 overflow-hidden"
          >
            <div className="flex justify-between p-3 bg-gold/10 border-b border-gold/20 items-center">
              <span className="text-gold font-semibold text-sm">Select Time</span>
              <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white text-sm font-medium px-2 py-1 rounded hover:bg-white/10 transition-colors">Close</button>
            </div>
            
            <div className="flex h-56 bg-black/95">
              <ScrollColumn items={hours} selected={selectedHour} onSelect={setSelectedHour} label="HOUR" />
              <ScrollColumn items={minutes} selected={selectedMinute} onSelect={setSelectedMinute} label="MINUTE" />
              <ScrollColumn items={ampms} selected={selectedAmPm} onSelect={setSelectedAmPm} label="AM/PM" />
            </div>

            <div className="p-3 bg-gold/10 border-t border-gold/20">
              <button 
                onClick={handleConfirm}
                className="w-full py-3 bg-gold text-black font-bold rounded-sm hover:bg-gold-light transition-colors text-lg"
              >
                Confirm Time
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const ScrollColumn = ({ items, selected, onSelect, label }: any) => {
  const colRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (colRef.current) {
      const selectedEl = colRef.current.querySelector('[data-selected="true"]') as HTMLElement;
      if (selectedEl) {
        const containerHalf = colRef.current.clientHeight / 2;
        const itemHalf = selectedEl.clientHeight / 2;
        colRef.current.scrollTop = selectedEl.offsetTop - containerHalf + itemHalf;
      }
    }
  }, []);

  return (
    <div ref={colRef} className="flex-1 flex flex-col items-center overflow-y-auto snap-y snap-mandatory scrollbar-hide border-r last:border-r-0 border-gold/10 relative scroll-smooth">
      <div className="sticky top-0 w-full bg-black/95 text-gold-light text-[10px] text-center py-2 z-10 font-bold tracking-widest border-b border-gold/10">{label}</div>
      <div className="h-[88px] shrink-0" />
      {items.map((item: any) => (
        <div 
          key={item}
          data-selected={selected === item}
          onClick={() => {
            onSelect(item);
            const el = colRef.current?.querySelector(`[data-value="${item}"]`) as HTMLElement;
            if (el && colRef.current) {
              const containerHalf = colRef.current.clientHeight / 2;
              const itemHalf = el.clientHeight / 2;
              colRef.current.scrollTo({
                top: el.offsetTop - containerHalf + itemHalf,
                behavior: 'smooth'
              });
            }
          }}
          data-value={item}
          className={`snap-center shrink-0 h-12 flex items-center justify-center text-xl cursor-pointer transition-all w-full select-none ${selected === item ? 'text-gold font-bold bg-gold/10 text-2xl' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
        >
          {typeof item === 'number' ? item.toString().padStart(2, '0') : item}
        </div>
      ))}
      <div className="h-[88px] shrink-0" />
    </div>
  );
}
