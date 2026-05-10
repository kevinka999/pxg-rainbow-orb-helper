import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Copy } from 'lucide-react'
import { FaGithub } from 'react-icons/fa'
import orbsData from '../data/orbs.json'
import type { OrbGroup, OrbLocation } from '../types/orbs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const STORAGE_INDEX_KEY = 'rainbow-orb-helper:current-index'
const STORAGE_COPIED_KEY = 'rainbow-orb-helper:copied-ids'

type OrbEntry = OrbLocation & {
  groupName: OrbGroup['name']
}

const orbEntries: OrbEntry[] = (orbsData as OrbGroup[]).flatMap((group) =>
  group.locations.map((location) => ({
    ...location,
    groupName: group.name,
  })),
)

const clampIndex = (index: number, total: number) => {
  if (total === 0) {
    return 0
  }

  return Math.min(Math.max(index, 0), total - 1)
}

async function copyToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'absolute'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

function App() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [copiedIds, setCopiedIds] = useState<number[]>([])
  const [justCopiedId, setJustCopiedId] = useState<number | null>(null)
  const [isCopyCelebrating, setIsCopyCelebrating] = useState(false)

  useEffect(() => {
    const storedIndex = window.localStorage.getItem(STORAGE_INDEX_KEY)
    const storedCopiedIds = window.localStorage.getItem(STORAGE_COPIED_KEY)

    if (storedIndex) {
      const parsedIndex = Number(storedIndex)

      if (Number.isFinite(parsedIndex)) {
        setCurrentIndex(clampIndex(parsedIndex, orbEntries.length))
      }
    }

    if (storedCopiedIds) {
      try {
        const parsedCopiedIds = JSON.parse(storedCopiedIds)

        if (Array.isArray(parsedCopiedIds)) {
          setCopiedIds(
            parsedCopiedIds.filter(
              (value): value is number => typeof value === 'number',
            ),
          )
        }
      } catch {
        window.localStorage.removeItem(STORAGE_COPIED_KEY)
      }
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_INDEX_KEY, String(currentIndex))
  }, [currentIndex])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_COPIED_KEY, JSON.stringify(copiedIds))
  }, [copiedIds])

  useEffect(() => {
    if (justCopiedId === null) {
      return
    }

    const timeout = window.setTimeout(() => {
      setJustCopiedId((current) => (current === justCopiedId ? null : current))
    }, 1500)

    return () => window.clearTimeout(timeout)
  }, [justCopiedId])

  const currentOrb = orbEntries[currentIndex]
  const copiedSet = useMemo(() => new Set(copiedIds), [copiedIds])
  const isCurrentCopied = currentOrb ? copiedSet.has(currentOrb.id) : false
  const showCopiedState = isCurrentCopied || justCopiedId === currentOrb?.id
  const showCopiedBadge = isCurrentCopied && !isCopyCelebrating
  const hasCoordinates = Boolean(currentOrb?.coordinates)
  const coordinatesValue = currentOrb?.coordinates
    ? `${currentOrb.coordinates.x}, ${currentOrb.coordinates.y}, ${currentOrb.coordinates.z}`
    : 'Sem coordenadas disponíveis'
  const subtitleText = hasCoordinates
    ? 'Clique para copiar e avançar automaticamente'
    : 'Essa entrada não possui coordenadas para copiar'

  const moveToOrb = (direction: -1 | 1) => {
    setCurrentIndex((index) => clampIndex(index + direction, orbEntries.length))
  }

  const clearProgress = () => {
    window.localStorage.removeItem(STORAGE_INDEX_KEY)
    window.localStorage.removeItem(STORAGE_COPIED_KEY)
    setCopiedIds([])
    setJustCopiedId(null)
    setIsCopyCelebrating(false)
    setCurrentIndex(0)
  }

  const handleCopy = async () => {
    if (!currentOrb?.coordinates || isCopyCelebrating) {
      return
    }

    await copyToClipboard(coordinatesValue)

    setIsCopyCelebrating(true)
    setCopiedIds((ids) => (ids.includes(currentOrb.id) ? ids : [...ids, currentOrb.id]))
    setJustCopiedId(currentOrb.id)

    window.setTimeout(() => {
      setIsCopyCelebrating(false)
      setCurrentIndex((index) => clampIndex(index + 1, orbEntries.length))
    }, 520)
  }

  if (!currentOrb) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-12">
        <p className="text-center text-sm text-muted-foreground">
          Nenhuma coordenada encontrada no arquivo de orbs.
        </p>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-3 sm:px-6 sm:py-6">
      <a
        href="https://github.com/kevinka999/pxg-rainbow-orb-helper"
        target="_blank"
        rel="noreferrer"
        aria-label="Abrir repositório no GitHub"
        className="fixed right-4 top-6 z-20 inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/6 p-3 text-muted-foreground shadow-[0_10px_30px_rgba(0,0,0,0.24)] backdrop-blur-sm transition hover:border-primary/40 hover:bg-white/10 hover:text-foreground sm:right-6 sm:top-10"
      >
        <FaGithub className="size-5" />
      </a>
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-xl items-center">
        <div className="flex w-full flex-col items-center gap-12">
          <header className="space-y-4 text-center">
            <div className="flex justify-center">
              <img
                src="/rainbow_orb.png"
                alt="Rainbow Orb"
                className="size-16 object-contain drop-shadow-[0_12px_30px_rgba(251,146,60,0.22)] sm:size-20"
              />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
              Rainbow Orb Helper
            </h1>
            <p className="mx-auto max-w-md pt-1 text-sm leading-6 text-muted-foreground sm:pt-1.5 sm:text-base">
              {subtitleText}
            </p>
          </header>

          <div className="h-px w-full max-w-sm bg-gradient-to-r from-transparent via-white/14 to-transparent" />

          <section className="flex w-full justify-center">
            <div className="flex w-full max-w-lg flex-col gap-5">
            <div className="flex items-start justify-between gap-4 text-left">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold tracking-tight text-amber-100 sm:text-2xl">
                  {currentOrb.groupName}
                </h2>
                <p className="text-sm text-amber-200/70">
                  {currentIndex + 1} de {orbEntries.length}
                </p>
              </div>
              {showCopiedBadge && (
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-400">
                  <Check className="size-4" />
                  Copiado
                </span>
              )}
            </div>

            <div
              role="button"
              tabIndex={hasCoordinates && !isCopyCelebrating ? 0 : -1}
              onClick={() => {
                void handleCopy()
              }}
              onKeyDown={(event) => {
                if (!hasCoordinates) {
                  return
                }

                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  void handleCopy()
                }
              }}
              className="group relative text-left outline-none"
              aria-label={
                hasCoordinates
                  ? `Copiar coordenada ${coordinatesValue}`
                  : 'Coordenada indisponível'
              }
              aria-disabled={!hasCoordinates || isCopyCelebrating}
            >
              <Input
                readOnly
                value={coordinatesValue}
                tabIndex={-1}
                className={`idle-pulse-field h-16 cursor-pointer rounded-2xl border-white/10 bg-white/5 pr-14 text-base font-semibold tracking-[0.04em] text-foreground shadow-none transition duration-200 group-hover:border-primary/60 group-hover:bg-white/8 group-focus-visible:border-primary/60 group-focus-visible:ring-4 group-focus-visible:ring-primary/20 disabled:cursor-not-allowed sm:text-lg ${
                  isCopyCelebrating
                    ? 'copy-success-field border-emerald-400/60 bg-emerald-500/12 text-emerald-50 ring-4 ring-emerald-400/15'
                    : ''
                }`}
              />
              {isCopyCelebrating && (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="copy-success-badge inline-flex items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-500/18 p-3 text-emerald-200 backdrop-blur-sm">
                    <Check className="size-5" />
                  </span>
                </span>
              )}
              <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                {isCopyCelebrating || showCopiedState ? (
                  <Check className="size-5 text-emerald-400" />
                ) : (
                  <Copy className="size-5 text-muted-foreground transition group-hover:text-primary" />
                )}
              </span>
            </div>

            <div className="space-y-1 text-left">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Descrição
              </p>
              <p className="min-h-12 text-sm leading-6 text-foreground sm:text-base">
                {currentOrb.description?.trim() || 'Sem descrição para esta coordenada.'}
              </p>
            </div>

            <div className="-mt-6 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => moveToOrb(-1)}
                disabled={currentIndex === 0}
                aria-label="Coordenada anterior"
                className="size-16 rounded-md border-2 border-amber-300/30 bg-gradient-to-b from-amber-200/14 to-orange-500/10 text-amber-100 shadow-[4px_4px_0_rgba(120,53,15,0.5)] hover:-translate-y-0.5 hover:border-amber-200/50 hover:bg-gradient-to-b hover:from-amber-200/20 hover:to-orange-400/14 hover:shadow-[5px_5px_0_rgba(120,53,15,0.55)] disabled:shadow-none"
              >
                <ChevronLeft className="size-7" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => moveToOrb(1)}
                disabled={currentIndex === orbEntries.length - 1}
                aria-label="Próxima coordenada"
                className="size-16 rounded-md border-2 border-amber-300/30 bg-gradient-to-b from-amber-200/14 to-orange-500/10 text-amber-100 shadow-[4px_4px_0_rgba(120,53,15,0.5)] hover:-translate-y-0.5 hover:border-amber-200/50 hover:bg-gradient-to-b hover:from-amber-200/20 hover:to-orange-400/14 hover:shadow-[5px_5px_0_rgba(120,53,15,0.55)] disabled:shadow-none"
              >
                <ChevronRight className="size-7" />
              </Button>
            </div>
            <p className="text-center text-xs leading-5 text-muted-foreground">
              Seu progresso fica salvo automaticamente para você voltar depois
              e continuar de onde parou.
            </p>
            <div className="-mt-3 flex justify-center">
              <button
                type="button"
                onClick={clearProgress}
                className="appearance-none bg-transparent p-0 text-[11px] leading-5 font-normal text-muted-foreground/75 underline underline-offset-4 transition hover:text-rose-300"
              >
                Apagar progresso
              </button>
            </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

export default App
