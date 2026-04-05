import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon } from 'lucide-react';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  disabled?: boolean;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 150 }, (_, i) => currentYear - 100 + i); // 100 years back, 50 years forward

export function DatePicker({ value, onChange, disabled }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Parse initial value
  const parseDate = (dateStr: string) => {
    if (!dateStr) return { year: 1990, month: 0, day: 1 };
    const [y, m, d] = dateStr.split('-').map(Number);
    return { year: y || 1990, month: (m || 1) - 1, day: d || 1 };
  };

  const initialDate = parseDate(value);
  
  const [selectedYear, setSelectedYear] = useState(initialDate.year);
  const [selectedMonth, setSelectedMonth] = useState(initialDate.month); // 0-11
  const [selectedDay, setSelectedDay] = useState(initialDate.day);

  useEffect(() => {
    if (isOpen) {
      const d = parseDate(value);
      setSelectedYear(d.year);
      setSelectedMonth(d.month);
      setSelectedDay(d.day);
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

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const daysInSelectedMonth = getDaysInMonth(selectedYear, selectedMonth);
  const DAYS = Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1);

  // Ensure selected day is valid for the month
  useEffect(() => {
    if (selectedDay > daysInSelectedMonth) {
      setSelectedDay(daysInSelectedMonth);
    }
  }, [selectedMonth, selectedYear, daysInSelectedMonth, selectedDay]);

  const handleConfirm = () => {
    const formattedYear = selectedYear.toString();
    const formattedMonth = (selectedMonth + 1).toString().padStart(2, '0');
    const formattedDay = selectedDay.toString().padStart(2, '0');
    onChange(`${formattedYear}-${formattedMonth}-${formattedDay}`);
    setIsOpen(false);
  };

  const displayValue = value 
    ? `${MONTHS[initialDate.month]} ${initialDate.day.toString().padStart(2, '0')}, ${initialDate.year}`
    : 'Select Date';

  return (
    <div className="relative w-full" ref={popoverRef}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`bg-black/80 border-2 border-gold/30 rounded-sm p-4 text-white font-medium outline-none transition-all flex items-center justify-between ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gold/60 focus:border-gold focus:ring-1 focus:ring-gold/20'}`}
      >
        <span>{displayValue}</span>
        <CalendarIcon className="w-5 h-5 text-gold/70" />
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
              <span className="text-gold font-semibold text-sm">Select Date</span>
              <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white text-sm font-medium px-2 py-1 rounded hover:bg-white/10 transition-colors">Close</button>
            </div>
            
            <div className="flex h-56 bg-black/95">
              <ScrollColumn items={MONTHS} selected={MONTHS[selectedMonth]} onSelect={(val: string) => setSelectedMonth(MONTHS.indexOf(val))} label="MONTH" />
              <ScrollColumn items={DAYS} selected={selectedDay} onSelect={setSelectedDay} label="DAY" />
              <ScrollColumn items={YEARS} selected={selectedYear} onSelect={setSelectedYear} label="YEAR" />
            </div>

            <div className="p-3 bg-gold/10 border-t border-gold/20">
              <button 
                onClick={handleConfirm}
                className="w-full py-3 bg-gold text-black font-bold rounded-sm hover:bg-gold-light transition-colors text-lg"
              >
                Confirm Date
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
  }, [items.length]); // Re-run only when number of items changes (e.g. days in month)

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
          {typeof item === 'number' && label === 'DAY' ? item.toString().padStart(2, '0') : item}
        </div>
      ))}
      <div className="h-[88px] shrink-0" />
    </div>
  );
}
