'use client'

import type { Dispatch, SetStateAction } from 'react'
import type { ProfessorPerfil } from '@/lib/types'
import {
  FAIXAS_INFANTIS, FAIXAS_ADULTAS, NOMES_FAIXA,
  grausMaximos, proximaFaixa, nomeFaixaExibicao, diasRestantesProvisorio,
} from '@/lib/regras-ibjjf'
import { sugestaoProximoGrau, MESES_ENTRE_GRAUS_PADRAO } from '@/lib/ritmo-graus'
import { BELT_COLORS } from '@/lib/cores-faixa'
import type { AlunoFicha } from '@/lib/alunos'
import { hojeBrasil } from '@/lib/datas'
import { Field, Toggle } from '@/components/comum/Campos'

// A aba Graduação da ficha: faixa, graus, próximo passo, ritmo do professor
// (sugestão dele), exceções da IBJJF, faixa juvenil e graduação provisória.
// Só edita o `form` da ficha; quem grava é a FichaAluno.
export function AbaGraduacao({ aluno, form, setForm, set, professor, infantilAluno, faixaAlterada, aprovacao }: {
  aluno: AlunoFicha
  form: AlunoFicha
  setForm: Dispatch<SetStateAction<AlunoFicha>>
  set: (chave: string, valor: unknown) => void
  professor: ProfessorPerfil | null
  infantilAluno: boolean
  faixaAlterada: boolean
  aprovacao: { ok: boolean; motivo?: string }
}) {
  const faixasDisponiveis = infantilAluno ? FAIXAS_INFANTIS : FAIXAS_ADULTAS
  const maxGrausFaixa = grausMaximos(form.faixa, infantilAluno)
  const ultimaGraduacaoData = aluno.ultima_graduacao_data ?? null

  // Próxima COR — só faz sentido para quem já está no teto de graus. Depende de
  // `infantilAluno` porque `branca` está nas duas progressões.
  const proxFaixa = proximaFaixa(form.faixa, infantilAluno)

  // Ritmo do professor: SUGESTÃO dele (art. 4.1.3), não exigência da IBJJF.
  // Calculado sobre `form` e não sobre `aluno` para acompanhar a edição em
  // curso — trocar a faixa na tela já muda o que a sugestão diz.
  const mesesEntreGraus = professor?.meses_entre_graus ?? MESES_ENTRE_GRAUS_PADRAO
  const ritmo = sugestaoProximoGrau(form, ultimaGraduacaoData, mesesEntreGraus)

  return (
    <div className="ficha-conteudo" style={{ gap: 0 }}>
      <div className="fi-rot">Faixa atual {form.data_nascimento && `— ${infantilAluno ? 'infantil' : 'adulto'}`}</div>
      <div className="fi-faixas">
        {faixasDisponiveis.map(fx => (
          // Ajusta faixa e graus JUNTOS: cada faixa tem seu teto (4 na
          // branca/azul/roxa/marrom, 9 na preta, 3 no infantil), e um
          // `set('faixa', ...)` sozinho deixaria um preta 6º grau virar
          // "marrom 6º grau" — grau que não existe (art. 4.1.2). O banco
          // aceitaria: o check é `graus between 0 and 9`, global, não por
          // faixa. E como os botões de grau re-renderizam 0–4, nenhum ficaria
          // destacado e o professor não veria o erro.
          <button
            key={fx} type="button" className="fi-faixa" aria-pressed={form.faixa === fx}
            onClick={() => setForm(f => ({ ...f, faixa: fx, graus: Math.min(f.graus, grausMaximos(fx, infantilAluno)) }))}
            // cor de faixa da IBJJF, não de tema
            style={{ background: BELT_COLORS[fx].bg, color: BELT_COLORS[fx].text }}
          >
            {NOMES_FAIXA[fx]}
          </button>
        ))}
      </div>

      <div className="fi-rot">Graus</div>
      <div className="fi-graus">
        {Array.from({ length: maxGrausFaixa + 1 }, (_, g) => g).map(g => (
          <button
            key={g} type="button" className="fi-grau" aria-pressed={form.graus === g}
            aria-label={g === 1 ? '1 grau' : `${g} graus`} onClick={() => set('graus', g)}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Três desfechos, não dois. No teto de graus o passo seguinte é a
          próxima COR (art. 4.1.2) — dizer só "pronto para subir de faixa"
          não diz qual. E na preta com 9 graus não existe faixa nenhuma
          depois: o 10º é honorário (art. 4.1.5.X), então prometer "subir
          de faixa" ali era errado. */}
      <div className="fi-bloco">
        <div className="fi-bloco-rot">Próximo passo</div>
        {form.graus < maxGrausFaixa ? (
          <div>+1 grau → {nomeFaixaExibicao(form.faixa, form.graus + 1)}</div>
        ) : proxFaixa ? (
          <div>{maxGrausFaixa}º grau completo → promover para Faixa {NOMES_FAIXA[proxFaixa]}</div>
        ) : (
          <div>{form.faixa === 'preta' ? 'Topo da progressão de graus solicitáveis' : 'Pronto para subir de faixa'}</div>
        )}
      </div>

      {/* ─── Ritmo do professor — SUGESTÃO, não regra da federação ────────
          Bloco deliberadamente diferente dos blocos IBJJF logo abaixo:
          borda tracejada, e o rótulo diz de quem é a regra. O pedido era que
          as duas coisas não se confundissem — o art. 4.1.3 deixa o sistema
          de graus a critério do Professor até a marrom, enquanto o tempo
          mínimo de permanência (art. 3.1.3) é da IBJJF e ninguém altera.
          Não renderiza na faixa preta nem no teto de graus: quem decide
          isso é sugestaoProximoGrau(), que devolve null. */}
      {ritmo && (
        <div className="fi-bloco ritmo">
          <div className="fi-bloco-rot">Ritmo do professor · sugestão sua</div>
          <div>{ritmo.proximoGrau}º grau sugerido em <strong>{ritmo.dataFormatada}</strong></div>
          <div className={ritmo.vencido ? 'fi-ritmo-vencido' : 'fi-apoio'}>
            {ritmo.vencido
              ? `Já passou ${Math.abs(ritmo.diasRestantes)} dia(s) do seu ritmo de ${mesesEntreGraus} meses por grau.`
              : `Faltam ${ritmo.diasRestantes} dia(s) — seu ritmo é de ${mesesEntreGraus} meses por grau.`}
          </div>
          <div className="fi-nota">
            Ritmo definido por você no Perfil do Professor, editável a qualquer momento.
            Não é exigência da IBJJF — o art. 4.1.3 deixa o sistema de graus a critério
            do Professor até a faixa marrom.
          </div>
        </div>
      )}

      {/* Exceções de tempo mínimo (art. 3.1.3) — só a do campeonato da faixa atual */}
      {(aluno.faixa === 'azul' || aluno.faixa === 'roxa' || aluno.faixa === 'marrom') && (
        <div className="fi-grupo">
          {/* O rótulo nomeia a IBJJF de propósito: é o contraste que impede
              ler o bloco de ritmo acima como se fosse a mesma regra. */}
          <div className="fi-rot">Exceções de tempo mínimo · exigência IBJJF (art. 3.1.3)</div>
          {aluno.faixa === 'azul' && (
            <Toggle label="Campeão mundial faixa azul" checked={form.campeao_mundial_azul} onChange={v => set('campeao_mundial_azul', v)} />
          )}
          {aluno.faixa === 'roxa' && (
            <Toggle label="Campeão mundial faixa roxa" checked={form.campeao_mundial_roxa} onChange={v => set('campeao_mundial_roxa', v)} />
          )}
          {aluno.faixa === 'marrom' && (
            <Toggle label="Campeão mundial faixa marrom" checked={form.campeao_mundial_marrom} onChange={v => set('campeao_mundial_marrom', v)} />
          )}
        </div>
      )}

      <div className="fi-grupo">
        <label className="cp-campo">
          <span className="cp-rotulo">Veio de faixa juvenil</span>
          <select
            className="cp-input" value={form.veio_de_faixa_juvenil ?? ''}
            onChange={e => set('veio_de_faixa_juvenil', e.target.value || null)}
          >
            <option value="">Nenhuma</option>
            <option value="azul_juvenil">Azul juvenil</option>
            <option value="roxa_juvenil">Roxa juvenil</option>
            <option value="laranja">Laranja</option>
            <option value="verde">Verde</option>
          </select>
        </label>
      </div>

      <div className="fi-grupo">
        <div className="fi-rot">Graduação provisória (art. 7°)</div>
        <Toggle
          label="Sem histórico de faixa documentado"
          checked={form.status_graduacao === 'provisorio'}
          onChange={v => setForm(f => ({
            ...f,
            status_graduacao: v ? 'provisorio' : 'regular',
            provisorio_desde: v ? (f.provisorio_desde ?? hojeBrasil()) : null,
          }))}
        />
        {form.status_graduacao === 'provisorio' && (
          <>
            <Field
              label="Provisório desde" value={form.provisorio_desde ?? ''}
              onChange={v => set('provisorio_desde', v || null)} type="date"
            />
            {form.provisorio_desde && (
              <div className="fi-aviso" style={{ alignSelf: 'flex-start' }}>
                {diasRestantesProvisorio(form.provisorio_desde)} dias restantes
              </div>
            )}
          </>
        )}
      </div>

      {!professor && (
        <div className="fi-bloco">
          Perfil do professor não encontrado — não é possível validar quem pode assinar esta graduação.
        </div>
      )}
      {professor && faixaAlterada && !aprovacao.ok && (
        <div className="fi-aviso" role="alert">⚠ {aprovacao.motivo}</div>
      )}
    </div>
  )
}
