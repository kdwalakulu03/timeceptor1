import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, Clock, MapPin, LocateFixed, Search } from 'lucide-react';
import { TimePicker } from './TimePicker';
import { DatePicker } from './DatePicker';
import { ServiceSelector } from './ServiceSelector';
import { ServiceId } from '../types';
import { geocodeSuggest, GeoResult } from '../lib/geocoding';

interface CosmicFormProps {
  dob: string;
  setDob: (val: string) => void;
  tob: string;
  setTob: (val: string) => void;
  unknownTime: boolean;
  setUnknownTime: (val: boolean) => void;
  location: string;
  setLocation: (val: string) => void;
  selectedService: ServiceId;
  setSelectedService: (id: ServiceId) => void;
  geocodeStatus: 'idle' | 'loading' | 'found' | 'error';
  onGeocode: (query: string) => void;
  onBrowserGeolocate: () => void;
  onSelectLocation: (lat: number, lng: number, name: string) => void;
  calculateWindow: () => void;
  isAuthed: boolean;
}

export function CosmicForm({
  dob, setDob, tob, setTob, unknownTime, setUnknownTime,
  location, setLocation, selectedService, setSelectedService, isAuthed,
  geocodeStatus, onGeocode, onBrowserGeolocate, onSelectLocation, calculateWindow,
}: CosmicFormProps) {

  const [suggestions, setSuggestions]       = useState<GeoResult[]>([]);
  const [showSugg, setShowSugg]             = useState(false);
  const [suggLoading, setSuggLoading]       = useState(false);
  const [activeIdx, setActiveIdx]           = useState(-1);
  const debounceRef                         = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef                          = useRef<HTMLDivElement>(null);

  // ── Debounced autocomplete ────────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (location.trim().length < 2) {
      setSuggestions([]);
      setShowSugg(false);
      return;
    }

    setSuggLoading(true);
    debounceRef.current = setTimeout(async () => {
      const results = await geocodeSuggest(location, 5);
      setSuggestions(results);
      setActiveIdx(-1);
      setShowSugg(results.length > 0);
      setSuggLoading(false);
    }, 380);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [location]);

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSugg(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  function pickSuggestion(result: GeoResult) {
    setLocation(result.shortName);
    setSuggestions([]);
    setShowSugg(false);
    onSelectLocation(result.lat, result.lng, result.shortName);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      if (activeIdx >= 0 && suggestions[activeIdx]) {
        pickSuggestion(suggestions[activeIdx]);
      } else {
        onGeocode(location);
        setShowSugg(false);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Escape') {
      setShowSugg(false);
    }
  }

  // Show spinner if geocodeStatus loading AND no autocomplete showing
  const showMainSpinner = geocodeStatus === 'loading' && !suggLoading;

  return (
    <>
      <div className="text-center mb-10">
        <h2 className="text-4xl font-display font-semibold tracking-wider mb-2">Reveal Your Cosmic Window</h2>
        <p className="font-mono text-sm text-cream-dim tracking-widest uppercase">Birth details calibrate your planetary rhythm</p>
      </div>

      {/* Service Selector */}
      <ServiceSelector selected={selectedService} onSelect={setSelectedService} isAuthed={isAuthed} />

      {/* Date + Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="flex flex-col gap-2">
          <label className="font-mono text-sm tracking-widest uppercase text-gold-light flex items-center gap-2">
            <CalendarIcon size={12} /> Date of Birth
          </label>
          <DatePicker value={dob} onChange={setDob} />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="font-mono text-sm tracking-widest uppercase text-gold-light flex items-center gap-2">
              <Clock size={12} /> Time of Birth
            </label>
            <label className="flex items-center gap-2 cursor-pointer group" aria-label="Unknown time of birth">
              <input
                type="checkbox"
                checked={unknownTime}
                onChange={(e) => { setUnknownTime(e.target.checked); if (e.target.checked) setTob('12:00'); }}
                className="accent-gold w-4 h-4 cursor-pointer"
              />
              <span className="font-mono text-xs text-cream-dim uppercase tracking-wider group-hover:text-gold transition-colors">I don't know</span>
            </label>
          </div>
          <TimePicker
            value={unknownTime ? '12:00' : tob}
            onChange={(val) => !unknownTime && setTob(val)}
            disabled={unknownTime}
          />
        </div>
      </div>

      {/* Location */}
      <div className="flex flex-col gap-2 mb-10">
        <label className="font-mono text-sm tracking-widest uppercase text-gold-light flex items-center gap-2">
          <MapPin size={12} /> Your Location
        </label>
        <div className="flex gap-2">
          {/* Input + suggestions wrapper */}
          <div className="relative flex-1" ref={wrapperRef}>
            <input
              type="text"
              placeholder="Type a city — suggestions appear automatically"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setShowSugg(true)}
              autoComplete="off"
              className="bg-black/80 border-2 border-gold/30 rounded-sm p-4 text-white font-medium outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 transition-all w-full pr-10"
            />

            {/* Status icon */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {(showMainSpinner || suggLoading) && (
                <div className="w-4 h-4 border-2 border-gold/40 border-t-gold rounded-full animate-spin" />
              )}
              {!suggLoading && geocodeStatus === 'found' && (
                <div className="text-emerald-400 text-base font-bold">✓</div>
              )}
              {!suggLoading && geocodeStatus === 'error' && (
                <div className="text-red-400 text-base">✗</div>
              )}
            </div>

            {/* Autocomplete dropdown */}
            <AnimatePresence>
              {showSugg && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-full mt-1 z-50 bg-[#0d0d14] border border-gold/25 rounded-sm shadow-2xl overflow-hidden"
                >
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onMouseDown={() => pickSuggestion(s)}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-start gap-3 ${
                        i === activeIdx
                          ? 'bg-gold/10 text-gold'
                          : 'text-cream/80 hover:bg-gold/5 hover:text-cream'
                      }`}
                    >
                      <MapPin size={12} className="mt-0.5 shrink-0 text-gold/50" />
                      <span>
                        <span className="font-medium">{s.shortName}</span>
                        {s.displayName !== s.shortName && (
                          <span className="text-xs text-cream-dim ml-2 font-mono">{s.displayName}</span>
                        )}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Browser geolocation button */}
          <button
            onClick={onBrowserGeolocate}
            title="Use my current location"
            className="px-4 py-4 bg-black/80 border-2 border-gold/30 hover:border-gold text-gold transition-all rounded-sm shrink-0"
          >
            <LocateFixed size={16} />
          </button>
        </div>

        {geocodeStatus === 'error' && (
          <p className="font-mono text-xs text-red-400 tracking-wider mt-1">
            Location not found — try a different city name.
          </p>
        )}
        {geocodeStatus === 'found' && location && (
          <p className="font-mono text-xs text-emerald-400/70 tracking-wider mt-1">
            ✓ {location}
          </p>
        )}
        {geocodeStatus === 'idle' && (
          <p className="font-mono text-xs text-cream-dim/50 tracking-wider mt-1">
            Type to search · select a suggestion · or use 📍 to detect automatically
          </p>
        )}
      </div>

      <button
        onClick={calculateWindow}
        disabled={!dob}
        className="w-full py-5 bg-gold text-space-bg font-mono text-sm font-bold tracking-widest uppercase cursor-pointer hover:bg-gold-light transition-all duration-300 shadow-lg shadow-gold/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ✦ Reveal My Cosmic Window
      </button>
    </>
  );
}

