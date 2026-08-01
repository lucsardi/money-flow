"use client";

import { useMemo, useState } from "react";

type Taxa = { forma_pagamento: string; taxa_percentual: number };

export default function TaxasSimulador({ taxas }: { taxas: Taxa[] }) {
  const [formaSelecionada, setFormaSelecionada] = useState(taxas[0]?.forma_pagamento ?? "");
  const [valorDesejado, setValorDesejado] = useState("");
  const [valorVenda, setValorVenda] = useState("");

  const taxaAtual = useMemo(
    () => taxas.find((t) => t.forma_pagamento === formaSelecionada)?.taxa_percentual ?? 0,
    [taxas, formaSelecionada]
  );

  const valorAPassar = useMemo(() => {
    const desejado = Number(valorDesejado);
    if (!desejado || taxaAtual >= 100) return null;
    return desejado / (1 - taxaAtual / 100);
  }, [valorDesejado, taxaAtual]);

  const valorLiquidoVenda = useMemo(() => {
    const venda = Number(valorVenda);
    if (!venda) return null;
    return venda * (1 - taxaAtual / 100);
  }, [valorVenda, taxaAtual]);

  if (!taxas.length) {
    return (
      <p className="text-sm text-ink/40 py-8 text-center">
        Cadastre pelo menos uma forma de pagamento com taxa para usar o simulador.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <label className="text-sm block">
        <span className="block text-ink/60 mb-1">Forma de pagamento</span>
        <select
          value={formaSelecionada}
          onChange={(e) => setFormaSelecionada(e.target.value)}
          className="w-full sm:w-64 rounded-md border border-line px-3 py-2 text-sm"
        >
          {taxas.map((t) => (
            <option key={t.forma_pagamento} value={t.forma_pagamento}>
              {t.forma_pagamento} ({t.taxa_percentual}%)
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="bg-paper/60 border border-line rounded-lg p-4">
          <p className="text-xs text-ink/60 uppercase tracking-wide font-mono mb-2">
            Quanto passar no cartão
          </p>
          <label className="text-sm block mb-3">
            <span className="block text-ink/60 mb-1">Valor que quero receber (R$)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={valorDesejado}
              onChange={(e) => setValorDesejado(e.target.value)}
              className="w-full rounded-md border border-line px-3 py-2 text-sm font-mono"
            />
          </label>
          <p className="font-display text-xl font-semibold text-emerald">
            {valorAPassar !== null ? `R$ ${valorAPassar.toFixed(2)}` : "—"}
          </p>
          <p className="text-xs text-ink/40 mt-1">valor a passar no cartão</p>
        </div>

        <div className="bg-paper/60 border border-line rounded-lg p-4">
          <p className="text-xs text-ink/60 uppercase tracking-wide font-mono mb-2">
            Quanto sobra líquido
          </p>
          <label className="text-sm block mb-3">
            <span className="block text-ink/60 mb-1">Valor da venda (R$)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={valorVenda}
              onChange={(e) => setValorVenda(e.target.value)}
              className="w-full rounded-md border border-line px-3 py-2 text-sm font-mono"
            />
          </label>
          <p className="font-display text-xl font-semibold text-emerald">
            {valorLiquidoVenda !== null ? `R$ ${valorLiquidoVenda.toFixed(2)}` : "—"}
          </p>
          <p className="text-xs text-ink/40 mt-1">valor líquido recebido</p>
        </div>
      </div>
    </div>
  );
}
