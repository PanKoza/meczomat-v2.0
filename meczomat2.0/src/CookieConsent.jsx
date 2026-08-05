import React, { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem('cookieConsent', 'rejected');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] flex justify-center p-4 animate-fade-in-up">
      <div
        className="w-full max-w-2xl rounded-2xl border border-brand-accent/20 p-5 shadow-[0_0_40px_rgba(0,255,136,0.08)]"
        style={{ background: 'var(--brand-surface)' }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-bold text-brand-cream mb-1">🍪 Pliki cookie</p>
            <p className="text-xs text-brand-cream/60 leading-relaxed">
              Używamy plików cookie, aby poprawić jakość działania serwisu i analizować ruch.
              Możesz zaakceptować wszystkie pliki cookie lub je odrzucić.{' '}
              <a
                href="/polityka-prywatnosci"
                className="text-brand-accent underline underline-offset-2 hover:text-brand-accent/80"
              >
                Dowiedz się więcej
              </a>
              .
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={reject}
              className="text-xs px-4 py-2 rounded-lg font-bold border border-brand-accent/20 text-brand-cream/60 hover:text-brand-cream hover:bg-white/5 transition-all duration-200"
            >
              Odrzuć
            </button>
            <button
              onClick={accept}
              className="text-xs px-4 py-2 rounded-lg font-bold bg-brand-accent text-brand-dark hover:bg-brand-accent/80 transition-all duration-200 shadow-[0_0_16px_rgba(0,255,136,0.2)]"
            >
              Akceptuj
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
