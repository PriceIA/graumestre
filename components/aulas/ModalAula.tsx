'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { DIAS_LIXEIRA, mandarParaLixeira } from '@/lib/lixeira'
import { subirFotoAula, removerFotoAula } from '@/lib/foto-aula'
import { validarLinkYoutube } from '@/lib/youtube'
import { hojeBrasil } from '@/lib/datas'
import { scrim, type Theme } from '@/lib/cores'
import { Field } from '@/components/comum/Campos'
import { FotoAula } from '@/components/aulas/FotoAula'

const POSITIONS = [
  'Guarda Fechada', 'Meia Guarda', 'Passagem de Guarda', 'Montada',
  'Costas', 'Raspagem', 'Finalização', 'Defesa', 'Leg Locks', 'Berimbolo',
]

// ─── Modal Aula (criar e editar) ─────────────────────────────────────────────
// Só os dados da aula. A chamada não vive aqui: ao criar, o botão grava a aula
// e entrega o registro pronto para o AppShell abrir a <Chamada />. Sem aula
// gravada não existe aula_id, e sem aula_id a presença não teria onde ser
// salva a cada toque.
//
// Com `aula` preenchida vira edição: mesmos campos, update em vez de insert, e
// nenhuma presença é tocada. É o caminho para cadastrar o link do YouTube
// depois, que é como acontece na prática — grava a aula, sobe o vídeo, e só
// então tem link para colar.
export function ModalAula({ aula, onClose, onCriada, onEditada, onFotoAlterada, onApagada, t }: {
  aula?: any; onClose: () => void; onCriada: (aula: any) => void; onEditada: (aula: any) => void;
  // Avisa a lista que a foto mudou, SEM fechar o modal. Não dá para reusar
  // onEditada aqui: ela desmonta o modal, e o professor que acabou de escolher
  // uma foto ainda está no meio da edição.
  onFotoAlterada?: (aulaId: string, fotoPath: string | null, fotoUrl: string | null) => void;
  // Aula mandada para a lixeira (só na edição). Quem chama tira da lista e fecha.
  onApagada?: (aulaId: string) => void;
  t: Theme
}) {
  const editando = !!aula
  const [form, setForm]   = useState({
    data:         aula?.data         ?? hojeBrasil(),
    tecnica:      aula?.tecnica      ?? '',
    posicao:      aula?.posicao      ?? '',
    notas:        aula?.notas        ?? '',
    link_youtube: aula?.link_youtube ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [apagando, setApagando] = useState(false)
  const [erro, setErro]   = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const set    = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  // Foto vive fora de `form` de propósito: ela é gravada na hora do upload, não
  // no "Salvar alterações". Misturá-la ao form sugeriria que ela espera o botão.
  const [fotoPath, setFotoPath] = useState<string | null>(aula?.foto_path ?? null)
  const [fotoUrl, setFotoUrl]   = useState<string | null>(aula?.foto_url ?? null)
  const [fotoOcupada, setFotoOcupada] = useState(false)
  const [erroFoto, setErroFoto] = useState<string | null>(null)
  const inputFoto = useRef<HTMLInputElement>(null)

  const escolherFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0]
    // Zera o input no fim: sem isso, escolher o MESMO arquivo de novo depois de
    // um erro não dispara change, e a tela parece travada.
    e.target.value = ''
    if (!arquivo || !aula) return

    setFotoOcupada(true)
    setErroFoto(null)
    try {
      const r = await subirFotoAula(aula.id, arquivo, fotoPath)
      setFotoPath(r.foto_path)
      setFotoUrl(r.foto_url)
      onFotoAlterada?.(aula.id, r.foto_path, r.foto_url)
    } catch (err) {
      setErroFoto(err instanceof Error ? err.message : String(err))
    }
    setFotoOcupada(false)
  }

  const apagarFoto = async () => {
    if (!aula || !fotoPath) return
    if (!window.confirm('Remover a foto desta aula? Isso não tem lixeira — o arquivo é apagado de vez.')) return

    setFotoOcupada(true)
    setErroFoto(null)
    try {
      await removerFotoAula(aula.id, fotoPath)
      setFotoPath(null)
      setFotoUrl(null)
      onFotoAlterada?.(aula.id, null, null)
    } catch (err) {
      setErroFoto(err instanceof Error ? err.message : String(err))
    }
    setFotoOcupada(false)
  }

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(id)
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 220)
  }

  const apagar = async () => {
    if (!aula) return
    if (!window.confirm(`Apagar a aula de ${aula.data}? Ela vai para a lixeira e pode ser restaurada por ${DIAS_LIXEIRA} dias.`)) return
    setApagando(true)
    setErro(null)
    const { error } = await mandarParaLixeira('aulas', aula.id)
    if (error) {
      // o erro aparece AQUI, com o modal aberto — na tela de trás ninguém veria
      setErro(`Não foi possível apagar a aula: ${error.message}`)
      setApagando(false)
      return
    }
    onApagada?.(aula.id)
    handleClose()
  }

  const handleSave = async () => {
    const linkInvalido = validarLinkYoutube(form.link_youtube)
    if (linkInvalido) {
      setErro(linkInvalido)
      return
    }
    setSaving(true)

    // Whitelist explícita das colunas de `aulas` — mesmo motivo da edição de
    // aluno: campo que não é coluna derruba a request inteira (PGRST204). Vale
    // dobrado aqui, porque o objeto da aula que vem da listagem carrega
    // `presencas` embutido, que não é coluna.
    const payload = {
      data:         form.data,
      tecnica:      form.tecnica || null,
      posicao:      form.posicao || null,
      notas:        form.notas   || null,
      link_youtube: form.link_youtube.trim() || null,
      // O caminho, nunca a URL: `foto_url` é derivada (assinada no
      // carregamento) e mandá-la aqui derrubaria a request com PGRST204.
      // Redundante com o update que o upload já fez — de propósito, para o
      // payload continuar sendo a lista completa das colunas que este modal
      // controla, e não uma lista que esconde uma exceção.
      foto_path:    fotoPath,
    }

    const { data: salva, error } = editando
      ? await supabase.from('aulas').update(payload).eq('id', aula.id).select().single()
      : await supabase.from('aulas').insert(payload).select().single()

    if (error) {
      setErro(`Não foi possível ${editando ? 'salvar' : 'criar'} a aula: ${error.message}`)
      setSaving(false)
      return
    }
    // foto_url não volta do banco (é derivada), então vai junto daqui — senão a
    // lista perderia a URL assinada e o card ficaria sem miniatura até recarregar.
    editando ? onEditada({ ...salva, foto_url: fotoUrl }) : onCriada(salva)
    handleClose()
  }

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: scrim(visible),
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        transition: 'background 0.22s',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: t.bg, width: '100%', maxWidth: 480,
          borderRadius: 'var(--r) var(--r) 0 0', border: `1px solid ${t.border}`,
          maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', touchAction: 'manipulation',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.97)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.22s ease, opacity 0.22s ease',
        }}
      >
        <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: t.text, fontWeight: 800, fontSize: 18 }}>{editando ? 'Editar Aula' : 'Registrar Aula'}</div>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', color: t.textMute, fontSize: 22, cursor: 'pointer', padding: 4 }}>✕</button>
        </div>

        <div style={{ padding: 20, overflowY: 'auto', overscrollBehavior: 'contain', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Data" value={form.data} onChange={v => set('data', v)} type="date" t={t} />
          <Field label="Técnica ensinada" value={form.tecnica} onChange={v => set('tecnica', v)} placeholder="Ex: Triângulo, Kimura..." t={t} />
          <div>
            <div style={{ color: t.textMute, fontSize: 11, fontFamily: t.ui, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>Posição</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {POSITIONS.map(p => (
                <button key={p} onClick={() => set('posicao', p)} style={{
                  padding: '6px 10px', borderRadius: 'var(--r)', fontSize: 12, cursor: 'pointer',
                  background: form.posicao === p ? t.ativoBg : t.surface2,
                  color: form.posicao === p ? t.ativo : t.textSub,
                  border: form.posicao === p ? `1px solid ${t.ativo}` : `1px solid ${t.border}`,
                }}>{p}</button>
              ))}
            </div>
          </div>
          <div>
            <Field
              label="Link do YouTube (opcional)"
              value={form.link_youtube}
              onChange={v => set('link_youtube', v)}
              type="url"
              placeholder="https://youtu.be/..."
              t={t}
            />
            <div style={{ color: t.textMute, fontSize: 11, marginTop: 6, lineHeight: 1.5 }}>
              Para quem faltou assistir depois. Pode deixar vazio agora e colar o link
              aqui quando a gravação subir.
              <br />
              Use &quot;Não listado&quot;. Vídeo &quot;Privado&quot; não gera miniatura nem abre para o aluno.
            </div>
          </div>

          {/* Foto da aula — só depois que a aula existe, porque o arquivo é
              guardado numa pasta com o id dela. Mesma lógica do link do
              YouTube: registra a aula agora, sobe a foto quando der, sem prazo. */}
          {editando && (
            <div>
              <div style={{ color: t.textMute, fontSize: 11, fontFamily: t.ui, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>
                Foto da aula
              </div>

              {/* Sem `capture`: com ele o Android abre direto a câmera e tira a
                  galeria da jogada. Sem ele o próprio sistema oferece as duas,
                  que é o que o professor precisa para subir foto de outro dia. */}
              <input
                ref={inputFoto} type="file" accept="image/*"
                onChange={escolherFoto} style={{ display: 'none' }}
              />

              {/* A condição é `fotoPath`, não `fotoUrl`: a URL é derivada e pode
                  falhar sozinha. Ramificar por ela faria uma aula COM foto
                  aparecer como "adicionar foto" num tropeço de assinatura — e
                  deixaria o botão Remover inalcançável justamente aí. */}
              {fotoPath ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <FotoAula
                    path={fotoPath} url={fotoUrl} onUrlRenovada={setFotoUrl} t={t}
                    style={{
                      width: '100%', height: 220, objectFit: 'cover',
                      borderRadius: 'var(--r)', border: `1px solid ${t.border}`,
                      opacity: fotoOcupada ? 0.5 : 1, transition: 'opacity 0.15s',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => inputFoto.current?.click()} disabled={fotoOcupada}
                      style={{
                        flex: 1, padding: '10px 12px', borderRadius: 'var(--r)', fontSize: 13,
                        background: t.surface2, color: t.textSub,
                        border: `1px solid ${t.border}`, cursor: fotoOcupada ? 'default' : 'pointer',
                      }}
                    >
                      {fotoOcupada ? 'Enviando…' : 'Trocar foto'}
                    </button>
                    <button
                      onClick={apagarFoto} disabled={fotoOcupada}
                      style={{
                        padding: '10px 12px', borderRadius: 'var(--r)', fontSize: 13,
                        background: 'none', color: t.erroTexto,
                        border: `1px solid ${t.erro}`, cursor: fotoOcupada ? 'default' : 'pointer',
                      }}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => inputFoto.current?.click()} disabled={fotoOcupada}
                  style={{
                    width: '100%', padding: '22px 12px', borderRadius: 'var(--r)',
                    background: t.surface, color: fotoOcupada ? t.textMute : t.textSub,
                    border: `1px dashed ${t.border2}`, cursor: fotoOcupada ? 'default' : 'pointer',
                    fontSize: 13,
                  }}
                >
                  {fotoOcupada ? 'Enviando…' : '＋ Adicionar foto da turma'}
                </button>
              )}

              {erroFoto && (
                <div style={{
                  marginTop: 8, padding: 10, borderRadius: 'var(--r)', background: t.erroBg,
                  border: `1px solid ${t.erro}`, color: t.erroTexto, fontSize: 12, lineHeight: 1.5,
                }}>
                  ⚠ {erroFoto}
                </div>
              )}

              <div style={{ color: t.textMute, fontSize: 11, marginTop: 6, lineHeight: 1.5 }}>
                Uma foto por aula. Sobe na hora ou dias depois, sem prazo — e é salva
                assim que você escolhe, sem esperar o botão abaixo.
              </div>
            </div>
          )}
          <div>
            <div style={{ color: t.textMute, fontSize: 11, fontFamily: t.ui, textTransform: 'uppercase', marginBottom: 4, letterSpacing: 1 }}>Observações</div>
            <textarea
              value={form.notas} onChange={e => set('notas', e.target.value)}
              placeholder="Anotações gerais sobre a aula..."
              style={{ width: '100%', minHeight: 80, background: t.inputBg, border: `1px solid ${t.border2}`, borderRadius: 'var(--r)', padding: 10, color: t.text, fontSize: 16, resize: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {editando && (
            <button type="button" className="au-apagar" onClick={apagar} disabled={apagando || saving}>
              {apagando ? 'Apagando…' : 'Apagar aula'}
            </button>
          )}
        </div>

        <div style={{ padding: '14px 20px', borderTop: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {erro && (
            <div style={{
              padding: 12, borderRadius: 'var(--r)', background: t.erroBg,
              border: `1px solid ${t.erro}`, color: t.erroTexto, fontSize: 12, lineHeight: 1.5,
            }}>
              ⚠ {erro}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleClose}
              style={{ flex: 1, padding: 12, borderRadius: 'var(--r)', border: `1px solid ${t.border}`, background: 'none', color: t.textSub, cursor: 'pointer', fontSize: 14 }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave} disabled={saving}
              style={{ flex: 2, padding: 12, borderRadius: 'var(--r)', border: 'none', background: t.ativo, color: t.sobreAtivo, fontWeight: 800, cursor: 'pointer', fontSize: 14, opacity: saving ? 0.7 : 1, transition: 'opacity 0.15s' }}
            >
              {editando
                ? (saving ? 'Salvando…' : 'Salvar alterações')
                : (saving ? 'Criando…'  : 'Iniciar chamada →')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
