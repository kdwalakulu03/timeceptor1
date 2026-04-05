import React, { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';

interface ShareButtonProps {
  getShareUrl: () => string;
}

export function ShareButton({ getShareUrl }: ShareButtonProps) {
  const [status, setStatus] = useState<'idle' | 'copied'>('idle');

  const handleShare = async () => {
    const url = getShareUrl();
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My Timeceptor Cosmic Reading',
          text: 'See my personalised planetary timing window on Timeceptor',
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setStatus('copied');
        setTimeout(() => setStatus('idle'), 2500);
      }
    } catch {
      // User cancelled share — no-op
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 px-4 py-2 border border-gold/30 text-gold font-mono text-xs tracking-widest uppercase hover:bg-gold/10 transition-colors rounded-sm"
    >
      {status === 'copied' ? (
        <>
          <Check size={12} />
          Link Copied!
        </>
      ) : (
        <>
          <Share2 size={12} />
          Share Reading
        </>
      )}
    </button>
  );
}
