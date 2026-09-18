const VERSIONS = [
  {
    versao: 'v1.0.0',
    ambiente: 'QAS',
    arquivo: 'Automacao_SEV_QAS_v1.0.0.zip',
    notas: 'Homologação. Seletores com fallback, erros bloqueantes vs retry.',
  },
  {
    versao: 'v1.0.0',
    ambiente: 'PRODUCAO',
    arquivo: 'Automacao_SEV_PRODUCAO_v1.0.0.zip',
    notas: 'Produção no Windows do cliente (GUI manual).',
  },
];

const MANUAL = [
  'Extrair o zip do ambiente correto numa pasta dedicada.',
  'Executar Automacao_SEV.exe no Windows com sessão aberta.',
  'Login OpenPort → menu 9401 → nova SEV → motivo EGS → INTERMARITIMA → transportadora → condutor → placas.',
  "Confirmar 'Operação Realizada com Sucesso / SEV Enviada / Autorizada'.",
  'Lançar o resultado manualmente no Hub (data, cliente, SEVs, erros).',
];

export function SevProduct() {
  return (
    <div>
      <div className="mb-6 overflow-hidden rounded-2xl border border-teal/30 bg-gradient-to-r from-teal/15 to-transparent p-6">
        <p className="font-body text-[11px] font-bold tracking-widest text-teal-light">
          ★ CARRO-CHEFE
        </p>
        <h2 className="mt-1 font-display text-[24px] font-bold text-white">SEV Intermarítima</h2>
        <p className="mt-1 max-w-2xl font-body text-[13.5px] text-muted">
          Emite Solicitação de Entrada de Veículos no TOS OpenPort da CODEBA. Produto Windows
          on-premise no cliente (GUI). O Hub valida, versiona e registra — a execução real é manual
          no cliente.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="font-display text-[15px] font-bold text-white">Versões</h3>
          <ul className="mt-3 flex flex-col gap-3">
            {VERSIONS.map((v) => (
              <li
                key={`${v.ambiente}-${v.versao}`}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <b className="font-body text-[13px] text-white">
                    {v.versao} · {v.ambiente}
                  </b>
                  <span className="rounded-full border border-white/10 px-2 py-0.5 font-body text-[11px] text-muted">
                    {v.arquivo}
                  </span>
                </div>
                <p className="mt-1 font-body text-[12.5px] text-muted">{v.notas}</p>
                <p className="mt-1 font-body text-[11.5px] text-muted-2">
                  Download via release privada (link assinado). WhatsApp só avisa.
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="font-display text-[15px] font-bold text-white">Manual de execução</h3>
          <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 font-body text-[13px] text-muted">
            {MANUAL.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
