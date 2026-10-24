'use client'

import { extrairIdYoutube } from '@/lib/youtube'
import { FotoAula } from '@/components/aulas/FotoAula'
import { MiniaturaYoutube } from '@/components/aulas/MiniaturaYoutube'
import type { Theme } from '@/lib/cores'

// A tela de Aulas: a lista de aulas. As aulas e o estado dos modais moram no
// AppShell; aqui só se desenha a lista e se avisa o que foi tocado.
export function TelaAulas({ aulas, erro, onAbrirChamada, onEditar, onApagar, onUrlRenovada, t }: {
  aulas: any[]
  erro: string | null
  onAbrirChamada: (aula: any) => void
  onEditar: (aula: any) => void
  onApagar: (aula: any) => void
  onUrlRenovada: (id: string, url: string) => void
  t: Theme
}) {
  return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {erro && (
              <div style={{
                padding: 12, borderRadius: 'var(--r)', background: t.erroBg,
                border: `1px solid ${t.erro}`, color: t.erroTexto, fontSize: 12, lineHeight: 1.5,
              }}>
                ⚠ {erro}
              </div>
            )}
            {aulas.map((a: any) => {
              // Calculado uma vez por card: usado para decidir se a
              // miniatura entra na linha de imagens (2 casos: sem link
              // nenhum, ou link válido mas sem id extraível — studio.youtube.com
              // ou algo fora dos formatos cobertos) e para montar a própria
              // miniatura, sem repetir a extração.
              const idYoutube = a.link_youtube ? extrairIdYoutube(a.link_youtube) : null
              return (
              // card inteiro abre a chamada daquela aula — sem botão extra
              <div
                key={a.id} onClick={() => onAbrirChamada(a)}
                style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 'var(--r)', padding: 16, cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <div style={{ color: t.text, fontWeight: 700 }}>{a.tecnica || 'Aula'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <div style={{ color: t.textMute, fontSize: 12, fontFamily: t.ui }}>{a.data}</div>
                    <button
                      // stopPropagation em todos os controles do card: o toque no
                      // card em si segue reservado para abrir a chamada
                      onClick={e => { e.stopPropagation(); onEditar(a) }}
                      title="Editar aula"
                      style={{
                        background: 'none', border: 'none', color: t.textMute,
                        fontSize: 14, cursor: 'pointer', padding: '0 2px', lineHeight: 1,
                      }}
                    >
                      ✎
                    </button>
                    {/* Alvo de 44×44 (mínimo de toque), mas com margens negativas:
                        a área cresce para dentro do padding do card — que é
                        espaço morto — em vez de aumentar a altura da linha. O
                        glifo continua do mesmo tamanho e na mesma posição.
                        marginLeft afasta do ✎; o resto do card abre a chamada, e
                        errar o toque aqui já apagou aula em teste real. */}
                    <button
                      onClick={e => { e.stopPropagation(); onApagar(a) }}
                      title="Apagar aula"
                      style={{
                        background: 'none', border: 'none', color: t.textMute,
                        fontSize: 15, cursor: 'pointer', padding: 0, lineHeight: 1,
                        width: 44, height: 44,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: -14, marginBottom: -14, marginRight: -10, marginLeft: 4,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
                {a.posicao && (
                  <div style={{ color: t.textSub, fontSize: 12, fontFamily: t.ui, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {a.posicao}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 'var(--r)', padding: '3px 8px', fontSize: 12, color: t.textSub }}>
                    {(a.presencas ?? []).filter((p: any) => p.presente).length} presentes
                  </span>
                </div>
                {/* Foto + miniatura do vídeo, lado a lado (Etapa 6). Foto à
                    esquerda (não muda de lugar), miniatura à direita (a
                    novidade); cada uma ocupa a linha inteira quando é a
                    única. Sem nenhuma das duas, nada ocupa este espaço —
                    mesmo princípio de sempre, nada de placeholder. */}
                {(a.foto_path || a.link_youtube) && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    {a.foto_path && (
                      <FotoAula
                        path={a.foto_path} url={a.foto_url} t={t}
                        // guarda a URL renovada na lista: sem isto o próximo render
                        // do card voltaria à URL vencida e erraria de novo
                        onUrlRenovada={nova => onUrlRenovada(a.id, nova)}
                        style={{
                          flex: 1, minWidth: 0, height: 110, objectFit: 'cover',
                          borderRadius: 'var(--r)', border: `1px solid ${t.border}`, display: 'block',
                        }}
                      />
                    )}
                    {/* `idYoutube` pode ser null aqui (studio.youtube.com, ou
                        qualquer formato fora dos cobertos) — MiniaturaYoutube
                        trata isso como o mesmo botão de texto do onError,
                        nunca deixa a linha com buraco do lado da foto. */}
                    {a.link_youtube && (
                      <MiniaturaYoutube
                        id={idYoutube} link={a.link_youtube} t={t}
                        style={{ flex: 1, minWidth: 0, height: 110, borderRadius: 'var(--r)', border: `1px solid ${t.border}` }}
                      />
                    )}
                  </div>
                )}
                {a.notas && <div style={{ marginTop: 8, color: t.textSub, fontSize: 12, fontStyle: 'italic' }}>{a.notas}</div>}
              </div>
              )
            })}
          </div>
  )
}
