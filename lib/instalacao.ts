// Captura do convite de instalação do PWA.
//
// Por que isto existe em vez de um `addEventListener` dentro do banner: o
// `beforeinstallprompt` dispara logo depois do carregamento da página, e o
// banner só monta DEPOIS do login. Se o listener morasse nele, o evento teria
// disparado enquanto o professor digitava a senha, sem ninguém escutando — e
// como ele não dispara de novo, o banner nunca apareceria.
//
// Então a captura é global e começa cedo (no layout, via
// RegistroServiceWorker); só a exibição é que fica atrás do login.

export interface EventoInstalacao extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type Ouvinte = (evento: EventoInstalacao | null) => void

let guardado: EventoInstalacao | null = null
let iniciado = false
const ouvintes = new Set<Ouvinte>()

function avisar() {
  ouvintes.forEach(fn => fn(guardado))
}

export function iniciarCaptura() {
  if (iniciado || typeof window === 'undefined') return
  iniciado = true

  window.addEventListener('beforeinstallprompt', evento => {
    // Sem isto o Chrome mostra a própria mini-infobar e o evento se perde.
    evento.preventDefault()
    guardado = evento as EventoInstalacao
    avisar()
  })

  window.addEventListener('appinstalled', () => {
    guardado = null
    avisar()
  })
}

export function eventoAtual(): EventoInstalacao | null {
  return guardado
}

// O evento é de uso único: depois de `prompt()` ele não serve mais, tenha o
// professor aceitado ou não.
export function descartarEvento() {
  guardado = null
  avisar()
}

export function inscrever(fn: Ouvinte): () => void {
  ouvintes.add(fn)
  return () => { ouvintes.delete(fn) }
}
