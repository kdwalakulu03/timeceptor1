import React, { useMemo } from 'react';

export function Background() {
  // Generate stars for background - optimized for device capability
  const stars = useMemo(() => {
    // Dynamically adjust star count based on device memory (fallback to 8GB assumption)
    const deviceMemoryGB = (navigator as any).deviceMemory ?? 8;
    const starCount = deviceMemoryGB > 2 ? 120 : 60; // Reduce stars on low-memory devices
    
    return Array.from({ length: starCount }).map((_, i) => ({
      id: i,
      size: Math.random() * 2 + 0.5,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: `${2 + Math.random() * 4}s`,
      opacity: 0.3 + Math.random() * 0.6,
      delay: `${Math.random() * 4}s`,
    }));
  }, []);

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {stars.map((star) => (
          <div
            key={star.id}
            className="star"
            style={{
              width: star.size,
              height: star.size,
              left: star.left,
              top: star.top,
              '--twinkle-duration': star.duration,
              '--twinkle-opacity': star.opacity,
              animationDelay: star.delay,
            } as any}
          />
        ))}
      </div>

      <svg className="mandala-bg" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="200" cy="200" r="180" stroke="#c9a84c" strokeWidth="0.5" />
        <circle cx="200" cy="200" r="140" stroke="#c9a84c" strokeWidth="0.5" />
        <circle cx="200" cy="200" r="100" stroke="#c9a84c" strokeWidth="0.5" />
        <circle cx="200" cy="200" r="60" stroke="#c9a84c" strokeWidth="0.5" />
        <line x1="200" y1="20" x2="200" y2="380" stroke="#c9a84c" strokeWidth="0.5" />
        <line x1="20" y1="200" x2="380" y2="200" stroke="#c9a84c" strokeWidth="0.5" />
        <line x1="74" y1="74" x2="326" y2="326" stroke="#c9a84c" strokeWidth="0.5" />
        <line x1="326" y1="74" x2="74" y2="326" stroke="#c9a84c" strokeWidth="0.5" />
      </svg>
    </>
  );
}
