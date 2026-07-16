import { useEffect, useState } from 'react';

export function Header() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = time.toLocaleTimeString('pt-BR');
  const dateStr = time
    .toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    })
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-8 py-3.5 bg-gradient-to-b from-navy-800 to-[#011245] border-b border-navy-600 overflow-hidden">
      <div
        className="absolute top-1/2 left-16 w-[520px] h-[520px] rounded-full pointer-events-none animate-[sweep_6s_linear_infinite]"
        style={{
          background:
            'conic-gradient(from 0deg, rgba(58,166,166,0.16), transparent 22%, transparent 100%)',
          transform: 'translateY(-50%)',
        }}
      />
      <style>{'@keyframes sweep { to { transform: translateY(-50%) rotate(360deg); } }'}</style>

      <div className="flex items-center gap-3.5 relative z-10">
        <div className="flex items-center justify-center bg-white rounded-lg px-2.5 py-2 shadow-md">
          <img
            src="/codeba-logo.png"
            alt="CODEBA — Autoridade Portuária"
            className="h-9 w-auto object-contain"
          />
        </div>
        <div className="w-px h-7 bg-navy-600" />
        <div>
          <h1 className="font-display text-[17px] font-bold tracking-wide">Torre RPA</h1>
          <span className="font-mono text-[10.5px] text-teal-light tracking-wider">
            PORTO DE ILHÉUS · CONTROLE DE AUTOMAÇÕES
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6 relative z-10">
        <div className="text-right font-mono text-[13px] text-muted">
          <b className="block text-white text-[15px]">{timeStr}</b>
          <span>{dateStr}</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-green-400 border border-green-400/30 bg-green-400/10 px-3 py-1.5 rounded-full">
          <span className="w-[7px] h-[7px] rounded-full bg-green-400 shadow-[0_0_8px_rgba(63,203,147,1)] animate-pulse" />
          OPENPORT ONLINE
        </div>
      </div>
    </header>
  );
}
