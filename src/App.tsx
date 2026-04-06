import {
  useEffect,
  useState,
  type ComponentType,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import {
  Box,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Clock,
  Copy,
  Download,
  FileImage,
  FileText,
  Folder,
  FolderOpen,
  Grid3x3,
  GripVertical,
  Headphones,
  Home,
  LayoutGrid,
  Layers,
  Leaf,
  Lightbulb,
  Link2,
  List,
  MessageSquare,
  MoreHorizontal,
  Music,
  Package,
  Plus,
  RotateCw,
  Search,
  Share2,
  Sparkles,
  Users,
  Video,
  X,
} from 'lucide-react'

type MainTab = 'blocks' | 'runSheet' | 'plan'
type BlockType = 'scene' | 'script' | 'dialogue' | 'audio' | 'props'

/** Same choices everywhere: empty-state picker and + Add Block after blocks exist */
const ALL_BLOCK_TYPES: BlockType[] = [
  'scene',
  'script',
  'dialogue',
  'audio',
  'props',
]

type SceneBlockData = {
  title: string
  description: string
  cameraShot: string
  durationSec: string
  visualNotes: string
  propsSetup: string
}

type ScriptBlockData = {
  hook: string
  mainContent: string
  cta: string
  tone: string
}

type DialogueBlockData = {
  speaker: string
  dialogue: string
  delivery: string
}

type AudioBlockData = {
  music: string
  sfx: string
  timing: string
}

type PropsBlockData = {
  text: string
}

type Block =
  | { id: string; type: 'scene'; data: SceneBlockData }
  | { id: string; type: 'script'; data: ScriptBlockData }
  | { id: string; type: 'dialogue'; data: DialogueBlockData }
  | { id: string; type: 'audio'; data: AudioBlockData }
  | { id: string; type: 'props'; data: PropsBlockData }

function emptySceneData(): SceneBlockData {
  return {
    title: '',
    description: '',
    cameraShot: '',
    durationSec: '',
    visualNotes: '',
    propsSetup: '',
  }
}

function emptyScriptData(): ScriptBlockData {
  return { hook: '', mainContent: '', cta: '', tone: '' }
}

function emptyDialogueData(): DialogueBlockData {
  return { speaker: '', dialogue: '', delivery: '' }
}

function emptyAudioData(): AudioBlockData {
  return { music: '', sfx: '', timing: '' }
}

function emptyPropsData(): PropsBlockData {
  return { text: '' }
}

function uid() {
  return crypto.randomUUID()
}

function createBlock(t: BlockType, id: string): Block {
  switch (t) {
    case 'scene':
      return { id, type: 'scene', data: emptySceneData() }
    case 'script':
      return { id, type: 'script', data: emptyScriptData() }
    case 'dialogue':
      return { id, type: 'dialogue', data: emptyDialogueData() }
    case 'audio':
      return { id, type: 'audio', data: emptyAudioData() }
    case 'props':
      return { id, type: 'props', data: emptyPropsData() }
  }
}

/** Optional full stack for `?full=1` */
const FULL_DEMO_BLOCKS: Block[] = [
  createBlock('scene', 'demo-scene'),
  createBlock('props', 'demo-props'),
  createBlock('script', 'demo-script'),
  createBlock('dialogue', 'demo-dialogue'),
  createBlock('audio', 'demo-audio'),
]

/** Single Scene block — use `?scene=1` in the URL (e.g. for layout screenshots) */
const SINGLE_SCENE_BLOCK: Block[] = [createBlock('scene', 'block-scene-1')]

function loadInitialBlocks(): Block[] {
  if (typeof window === 'undefined') return []
  const params = new URLSearchParams(window.location.search)
  if (params.get('full') === '1') return FULL_DEMO_BLOCKS
  if (params.get('scene') === '1') return SINGLE_SCENE_BLOCK
  return []
}

const TITLE =
  "I tracked my screen time for 7 days — here's what happened"

/** Linked rows (“beats”): each row ties Hook + Content + Props together */
const PLAN_STORAGE_KEY = 'clipflow-plan-board-v2'
const PLAN_V1_STORAGE_KEY = 'clipflow-plan-board-v1'

type PlanSubsetRow = {
  id: string
  idea: string
  content: string
  propsGear: string
}

type PlanBoard = {
  rows: PlanSubsetRow[]
}

function defaultPlanBoard(): PlanBoard {
  return {
    rows: [{ id: crypto.randomUUID(), idea: '', content: '', propsGear: '' }],
  }
}

function migrateV1ToRows(old: {
  ideas: string[]
  content: string[]
  propsGear: string[]
}): PlanSubsetRow[] {
  const n = Math.max(
    old.ideas.length,
    old.content.length,
    old.propsGear.length,
    1,
  )
  const rows: PlanSubsetRow[] = []
  for (let i = 0; i < n; i++) {
    rows.push({
      id: crypto.randomUUID(),
      idea: old.ideas[i] ?? '',
      content: old.content[i] ?? '',
      propsGear: old.propsGear[i] ?? '',
    })
  }
  return rows
}

function normalizePlanBoard(p: PlanBoard): PlanBoard {
  if (!p.rows?.length) return defaultPlanBoard()
  return {
    rows: p.rows.map((r) => ({
      id: r.id?.length ? r.id : crypto.randomUUID(),
      idea: r.idea ?? '',
      content: r.content ?? '',
      propsGear: r.propsGear ?? '',
    })),
  }
}

function loadPlanBoard(): PlanBoard {
  if (typeof window === 'undefined') return defaultPlanBoard()
  try {
    const raw = localStorage.getItem(PLAN_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as unknown
      if (
        parsed &&
        typeof parsed === 'object' &&
        'rows' in parsed &&
        Array.isArray((parsed as PlanBoard).rows)
      ) {
        return normalizePlanBoard(parsed as PlanBoard)
      }
    }
    const rawV1 = localStorage.getItem(PLAN_V1_STORAGE_KEY)
    if (rawV1) {
      const old = JSON.parse(rawV1) as {
        ideas?: string[]
        content?: string[]
        propsGear?: string[]
      }
      if (
        Array.isArray(old.ideas) &&
        Array.isArray(old.content) &&
        Array.isArray(old.propsGear)
      ) {
        return {
          rows: migrateV1ToRows({
            ideas: old.ideas,
            content: old.content,
            propsGear: old.propsGear,
          }),
        }
      }
    }
  } catch {
    /* ignore */
  }
  return defaultPlanBoard()
}

const inputClass =
  'w-full rounded-lg border border-alloy-border bg-alloy-panel px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-500'

const labelClass = 'mb-1.5 block text-xs font-medium text-zinc-500'

function BlockChrome({
  accent,
  label,
  labelClassName,
  selected,
  onSelect,
  onRemove,
  children,
}: {
  accent: string
  label: string
  labelClassName?: string
  selected: boolean
  onSelect: () => void
  onRemove: () => void
  children: ReactNode
}) {
  return (
    <div
      data-selected={selected ? 'true' : 'false'}
      onClick={onSelect}
      className={`cursor-pointer overflow-hidden rounded-lg border bg-alloy-elevated transition-[box-shadow,border-color] ${
        selected ? 'border-zinc-600' : 'border-alloy-border'
      }`}
      style={
        selected
          ? { boxShadow: `inset 4px 0 0 0 ${accent}` }
          : { boxShadow: 'inset 4px 0 0 0 transparent' }
      }
    >
      <div className="flex items-center justify-between border-b border-alloy-border px-3 py-2">
        <div className="flex items-center gap-2">
          <GripVertical
            className="h-4 w-4 shrink-0 text-zinc-600"
            strokeWidth={1.5}
          />
          <span
            className={
              labelClassName ??
              'rounded px-2 py-0.5 text-[11px] font-semibold tracking-wide text-white'
            }
            style={
              labelClassName ? undefined : { backgroundColor: accent }
            }
          >
            {label}
          </span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="rounded p-1 text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
          aria-label="Remove block"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
      <div className="space-y-4 p-4">{children}</div>
    </div>
  )
}

function SceneBlock({
  data,
  onChange,
  selected,
  onSelect,
  onRemove,
}: {
  data: SceneBlockData
  onChange: (data: SceneBlockData) => void
  selected: boolean
  onSelect: () => void
  onRemove: () => void
}) {
  function patch(p: Partial<SceneBlockData>) {
    onChange({ ...data, ...p })
  }

  return (
    <BlockChrome
      accent="#f97316"
      label="SCENE"
      selected={selected}
      onSelect={onSelect}
      onRemove={onRemove}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <label className={labelClass}>Scene Title</label>
        <input
          className={inputClass}
          placeholder="Enter scene title"
          value={data.title}
          onChange={(e) => patch({ title: e.target.value })}
        />
      </div>
      <div onClick={(e) => e.stopPropagation()}>
        <label className={labelClass}>Description</label>
        <textarea
          className={`${inputClass} min-h-[88px] resize-y`}
          placeholder="Describe what happens in this scene"
          value={data.description}
          onChange={(e) => patch({ description: e.target.value })}
        />
      </div>
      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <label className={labelClass}>Camera Shot</label>
          <select
            className={`${inputClass} appearance-none`}
            value={data.cameraShot}
            onChange={(e) => patch({ cameraShot: e.target.value })}
          >
            <option value="">Select shot type</option>
            <option value="Wide">Wide</option>
            <option value="Medium">Medium</option>
            <option value="Close-up">Close-up</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Duration (seconds)</label>
          <input
            className={inputClass}
            placeholder="e.g., 15"
            value={data.durationSec}
            onChange={(e) => patch({ durationSec: e.target.value })}
          />
        </div>
      </div>
      <div onClick={(e) => e.stopPropagation()}>
        <label className={labelClass}>Visual Notes</label>
        <textarea
          className={`${inputClass} min-h-[72px] resize-y`}
          placeholder="Lighting, framing, or composition notes"
          value={data.visualNotes}
          onChange={(e) => patch({ visualNotes: e.target.value })}
        />
      </div>
      <div onClick={(e) => e.stopPropagation()}>
        <label className={labelClass}>Props &amp; Setup</label>
        <textarea
          className={`${inputClass} min-h-[72px] resize-y`}
          placeholder="List required props and setup"
          value={data.propsSetup}
          onChange={(e) => patch({ propsSetup: e.target.value })}
        />
      </div>
    </BlockChrome>
  )
}

function PropsStripBlock({
  data,
  onChange,
  selected,
  onSelect,
  onRemove,
}: {
  data: PropsBlockData
  onChange: (data: PropsBlockData) => void
  selected: boolean
  onSelect: () => void
  onRemove: () => void
}) {
  return (
    <BlockChrome
      accent="#f97316"
      label="PROPS"
      selected={selected}
      onSelect={onSelect}
      onRemove={onRemove}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <label className={labelClass}>Props &amp; Setup</label>
        <input
          className={inputClass}
          placeholder="List required props and setup"
          value={data.text}
          onChange={(e) => onChange({ text: e.target.value })}
        />
      </div>
    </BlockChrome>
  )
}

function ScriptBlock({
  data,
  onChange,
  selected,
  onSelect,
  onRemove,
}: {
  data: ScriptBlockData
  onChange: (data: ScriptBlockData) => void
  selected: boolean
  onSelect: () => void
  onRemove: () => void
}) {
  function patch(p: Partial<ScriptBlockData>) {
    onChange({ ...data, ...p })
  }

  return (
    <BlockChrome
      accent="#a855f7"
      label="SCRIPT"
      selected={selected}
      onSelect={onSelect}
      onRemove={onRemove}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <label className={labelClass}>Hook</label>
        <textarea
          className={`${inputClass} min-h-[72px] resize-y`}
          placeholder="Opening hook to grab attention"
          value={data.hook}
          onChange={(e) => patch({ hook: e.target.value })}
        />
      </div>
      <div onClick={(e) => e.stopPropagation()}>
        <label className={labelClass}>Main Content</label>
        <textarea
          className={`${inputClass} min-h-[120px] resize-y`}
          placeholder="Core content of your script"
          value={data.mainContent}
          onChange={(e) => patch({ mainContent: e.target.value })}
        />
      </div>
      <div onClick={(e) => e.stopPropagation()}>
        <label className={labelClass}>Call to Action</label>
        <textarea
          className={`${inputClass} min-h-[72px] resize-y`}
          placeholder="What should the viewer do next?"
          value={data.cta}
          onChange={(e) => patch({ cta: e.target.value })}
        />
      </div>
      <div onClick={(e) => e.stopPropagation()}>
        <label className={labelClass}>Tone (Optional)</label>
        <select
          className={`${inputClass} appearance-none`}
          value={data.tone}
          onChange={(e) => patch({ tone: e.target.value })}
        >
          <option value="">Select tone</option>
          <option value="Conversational">Conversational</option>
          <option value="Authoritative">Authoritative</option>
          <option value="Playful">Playful</option>
        </select>
      </div>
    </BlockChrome>
  )
}

function DialogueBlock({
  data,
  onChange,
  selected,
  onSelect,
  onRemove,
}: {
  data: DialogueBlockData
  onChange: (data: DialogueBlockData) => void
  selected: boolean
  onSelect: () => void
  onRemove: () => void
}) {
  function patch(p: Partial<DialogueBlockData>) {
    onChange({ ...data, ...p })
  }

  return (
    <BlockChrome
      accent="#3b82f6"
      label="DIALOGUE"
      labelClassName="rounded px-2 py-0.5 text-[11px] font-semibold tracking-wide bg-alloy-blue text-white"
      selected={selected}
      onSelect={onSelect}
      onRemove={onRemove}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <label className={labelClass}>Speaker Name</label>
        <input
          className={inputClass}
          placeholder="Who is speaking?"
          value={data.speaker}
          onChange={(e) => patch({ speaker: e.target.value })}
        />
      </div>
      <div onClick={(e) => e.stopPropagation()}>
        <label className={labelClass}>Dialogue / Voiceover</label>
        <textarea
          className={`${inputClass} min-h-[100px] resize-y`}
          placeholder="Enter the dialogue or voiceover text"
          value={data.dialogue}
          onChange={(e) => patch({ dialogue: e.target.value })}
        />
      </div>
      <div onClick={(e) => e.stopPropagation()}>
        <label className={labelClass}>Delivery Notes</label>
        <input
          className={inputClass}
          placeholder="Tone, pace, emotion, etc."
          value={data.delivery}
          onChange={(e) => patch({ delivery: e.target.value })}
        />
      </div>
    </BlockChrome>
  )
}

function AudioBlock({
  data,
  onChange,
  selected,
  onSelect,
  onRemove,
}: {
  data: AudioBlockData
  onChange: (data: AudioBlockData) => void
  selected: boolean
  onSelect: () => void
  onRemove: () => void
}) {
  function patch(p: Partial<AudioBlockData>) {
    onChange({ ...data, ...p })
  }

  return (
    <BlockChrome
      accent="#22c55e"
      label="AUDIO"
      labelClassName="rounded px-2 py-0.5 text-[11px] font-semibold tracking-wide bg-alloy-green text-white"
      selected={selected}
      onSelect={onSelect}
      onRemove={onRemove}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <label className={labelClass}>Music Type</label>
        <input
          className={inputClass}
          placeholder="e.g., Upbeat lo-fi, cinematic, ambient"
          value={data.music}
          onChange={(e) => patch({ music: e.target.value })}
        />
      </div>
      <div onClick={(e) => e.stopPropagation()}>
        <label className={labelClass}>Sound Effects</label>
        <input
          className={inputClass}
          placeholder="e.g., Whoosh, click, notification sound"
          value={data.sfx}
          onChange={(e) => patch({ sfx: e.target.value })}
        />
      </div>
      <div onClick={(e) => e.stopPropagation()}>
        <label className={labelClass}>Timing Cues</label>
        <input
          className={inputClass}
          placeholder="When should audio elements play?"
          value={data.timing}
          onChange={(e) => patch({ timing: e.target.value })}
        />
      </div>
    </BlockChrome>
  )
}

export default function App() {
  const [mainTab, setMainTab] = useState<MainTab>('blocks')
  const [blocks, setBlocks] = useState<Block[]>(loadInitialBlocks)
  /** Left accent bar only when user explicitly selects a block — never defaulted */
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [planBoard, setPlanBoard] = useState<PlanBoard>(loadPlanBoard)

  useEffect(() => {
    try {
      localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(planBoard))
    } catch {
      /* ignore quota */
    }
  }, [planBoard])

  function addBlock(t: BlockType) {
    setBlocks((prev) => [...prev, createBlock(t, uid())])
  }

  function removeBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id))
    setSelectedBlockId((cur) => (cur === id ? null : cur))
  }

  return (
    <div className="flex h-full min-h-0 bg-alloy-bg text-zinc-100">
      {/* Global nav rail — Ideas is the active area for this screen */}
      <aside className="flex w-[52px] shrink-0 flex-col items-center border-r border-alloy-border bg-alloy-panel py-3">
        <button
          type="button"
          className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg border border-alloy-border bg-alloy-elevated text-alloy-purple hover:bg-white/5"
          aria-label="App"
        >
          <Layers className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <nav className="flex flex-1 flex-col items-center gap-1">
          <IconNavButton icon={Home} title="Home" />
          <IconNavButton icon={Lightbulb} active title="Ideas" />
          <IconNavButton icon={Folder} title="Folders" />
          <IconNavButton icon={Calendar} title="Calendar" />
          <IconNavButton icon={List} title="Tasks" />
          <IconNavButton icon={Users} title="People" />
        </nav>
        <div className="mt-auto flex flex-col items-center gap-2 pb-1">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
            aria-label="Help"
          >
            <Headphones className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-white">
            S
          </div>
        </div>
      </aside>

      {/* Secondary sidebar */}
      <aside className="flex w-[260px] shrink-0 flex-col border-r border-alloy-border bg-alloy-panel">
        <div className="border-b border-alloy-border px-4 py-3">
          <div className="flex items-start gap-1.5 text-xs text-zinc-500">
            <ChevronLeft className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600" />
            <Folder className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600" strokeWidth={1.5} />
            <div className="min-w-0">
              <span className="text-zinc-300">Ideas</span>
              <span className="mx-1 text-zinc-600">›</span>
              <span className="line-clamp-2 text-left text-zinc-400">{TITLE}</span>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <button
            type="button"
            className="mb-4 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-zinc-300 hover:bg-white/5"
          >
            <FileText className="h-4 w-4 text-zinc-500" strokeWidth={1.5} />
            Overview
          </button>

          <section className="mb-6">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Links
              </span>
              <button
                type="button"
                className="text-zinc-500 hover:text-zinc-300"
                aria-label="Add link"
              >
                <Plus className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
            <div className="mb-2 flex items-center justify-between rounded-md border border-alloy-border bg-alloy-elevated px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <Link2 className="h-4 w-4 shrink-0 text-zinc-500" />
                <span className="truncate text-sm text-zinc-300">Link</span>
              </div>
              <MoreHorizontal className="h-4 w-4 shrink-0 text-zinc-600" />
            </div>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-alloy-border py-2 text-xs font-medium text-zinc-400 hover:border-alloy-purple/50 hover:text-zinc-200"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Link
            </button>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Files
              </span>
              <button
                type="button"
                className="text-zinc-500 hover:text-zinc-300"
                aria-label="Add file"
              >
                <Plus className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
            <div className="mb-2 flex items-center justify-between rounded-md border border-alloy-border bg-alloy-elevated px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileImage className="h-4 w-4 shrink-0 text-zinc-500" />
                <span className="truncate text-sm text-zinc-300">3.png</span>
              </div>
              <MoreHorizontal className="h-4 w-4 shrink-0 text-zinc-600" />
            </div>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-alloy-border py-2 text-xs font-medium text-zinc-400 hover:border-alloy-purple/50 hover:text-zinc-200"
            >
              <Plus className="h-3.5 w-3.5" />
              Upload Files
            </button>
          </section>
        </div>
      </aside>

      {/* Main + top bar */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-alloy-border bg-alloy-bg px-4 py-2.5">
          <button
            type="button"
            className="rounded-md p-2 text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            className="rounded-md p-2 text-zinc-600 hover:bg-white/5 hover:text-zinc-400"
            aria-label="Forward"
            disabled
          >
            <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            className="rounded-md p-2 text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
            aria-label="Refresh"
          >
            <RotateCw className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <div className="relative mx-2 hidden min-w-0 flex-1 md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
            <input
              className="w-full rounded-lg border border-alloy-border bg-alloy-elevated py-2 pl-9 pr-3 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-zinc-500"
              placeholder="Search"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="rounded-md p-2 text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
              aria-label="More"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="rounded-md p-2 text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
              aria-label="Layout"
            >
              <LayoutGrid className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-8 py-8">
          <div
            className="mx-auto w-full max-w-[1200px]"
          >
            <h1 className="mb-4 text-2xl font-semibold tracking-tight text-white sm:text-[26px]">
              {TITLE}
            </h1>

            <div className="mb-6 flex flex-wrap gap-2">
              <TagChip icon={Video} label="Channels" />
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
                <Leaf className="h-3.5 w-3.5" strokeWidth={2} />
                Evergreen
              </span>
              <TagChip icon={Grid3x3} label="Category" />
            </div>

            <div className="mb-6 flex items-center gap-2 border-b border-alloy-border pb-3">
              <button
                type="button"
                onClick={() => setMainTab('plan')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  mainTab === 'plan'
                    ? 'border border-alloy-purple bg-alloy-purple/10 text-white shadow-sm shadow-alloy-purple/15'
                    : 'border border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Plan
              </button>
              <button
                type="button"
                onClick={() => setMainTab('blocks')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  mainTab === 'blocks'
                    ? 'border border-alloy-purple bg-alloy-purple/10 text-white shadow-sm shadow-alloy-purple/15'
                    : 'border border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Blocks
              </button>
              <button
                type="button"
                onClick={() => setMainTab('runSheet')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  mainTab === 'runSheet'
                    ? 'border border-alloy-purple bg-alloy-purple/10 text-white shadow-sm shadow-alloy-purple/15'
                    : 'border border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Run Sheet
              </button>
            </div>

            <div
              className={mainTab === 'blocks' ? 'block' : 'hidden'}
              aria-hidden={mainTab !== 'blocks'}
            >
              {blocks.length === 0 ? (
                <EmptyBlocks onPick={addBlock} />
              ) : (
                <div className="space-y-4">
                  {blocks.map((b) => {
                      const sel = selectedBlockId === b.id
                      const select = () => setSelectedBlockId(b.id)
                      switch (b.type) {
                        case 'scene':
                          return (
                            <SceneBlock
                              key={b.id}
                              data={b.data}
                              onChange={(data) => {
                                setBlocks((prev) =>
                                  prev.map((x) =>
                                    x.id === b.id && x.type === 'scene'
                                      ? { ...x, data }
                                      : x,
                                  ),
                                )
                              }}
                              selected={sel}
                              onSelect={select}
                              onRemove={() => removeBlock(b.id)}
                            />
                          )
                        case 'props':
                          return (
                            <PropsStripBlock
                              key={b.id}
                              data={b.data}
                              onChange={(data) => {
                                setBlocks((prev) =>
                                  prev.map((x) =>
                                    x.id === b.id && x.type === 'props'
                                      ? { ...x, data }
                                      : x,
                                  ),
                                )
                              }}
                              selected={sel}
                              onSelect={select}
                              onRemove={() => removeBlock(b.id)}
                            />
                          )
                        case 'script':
                          return (
                            <ScriptBlock
                              key={b.id}
                              data={b.data}
                              onChange={(data) => {
                                setBlocks((prev) =>
                                  prev.map((x) =>
                                    x.id === b.id && x.type === 'script'
                                      ? { ...x, data }
                                      : x,
                                  ),
                                )
                              }}
                              selected={sel}
                              onSelect={select}
                              onRemove={() => removeBlock(b.id)}
                            />
                          )
                        case 'dialogue':
                          return (
                            <DialogueBlock
                              key={b.id}
                              data={b.data}
                              onChange={(data) => {
                                setBlocks((prev) =>
                                  prev.map((x) =>
                                    x.id === b.id && x.type === 'dialogue'
                                      ? { ...x, data }
                                      : x,
                                  ),
                                )
                              }}
                              selected={sel}
                              onSelect={select}
                              onRemove={() => removeBlock(b.id)}
                            />
                          )
                        case 'audio':
                          return (
                            <AudioBlock
                              key={b.id}
                              data={b.data}
                              onChange={(data) => {
                                setBlocks((prev) =>
                                  prev.map((x) =>
                                    x.id === b.id && x.type === 'audio'
                                      ? { ...x, data }
                                      : x,
                                  ),
                                )
                              }}
                              selected={sel}
                              onSelect={select}
                              onRemove={() => removeBlock(b.id)}
                            />
                          )
                        default:
                          return null
                      }
                    })}
                  <AddBlockRow onAdd={addBlock} />
                </div>
              )}
            </div>

            <div
              className={mainTab === 'runSheet' ? 'block' : 'hidden'}
              aria-hidden={mainTab !== 'runSheet'}
            >
              <RunSheetView blocks={blocks} projectTitle={TITLE} />
            </div>

            <div
              className={mainTab === 'plan' ? 'block' : 'hidden'}
              aria-hidden={mainTab !== 'plan'}
            >
              <PlanBoardView plan={planBoard} setPlan={setPlanBoard} />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function PlanBoardView({
  plan,
  setPlan,
}: {
  plan: PlanBoard
  setPlan: Dispatch<SetStateAction<PlanBoard>>
}) {
  function patchRow(id: string, patch: Partial<PlanSubsetRow>) {
    setPlan((p) => ({
      rows: p.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }))
  }

  function addBeat() {
    setPlan((p) => ({
      rows: [
        ...p.rows,
        { id: crypto.randomUUID(), idea: '', content: '', propsGear: '' },
      ],
    }))
  }

  function removeBeat(id: string) {
    setPlan((p) => {
      if (p.rows.length <= 1) return p
      return { rows: p.rows.filter((r) => r.id !== id) }
    })
  }

  const fieldCols: {
    field: keyof Pick<PlanSubsetRow, 'idea' | 'content' | 'propsGear'>
    title: string
    hint: string
    icon: ComponentType<{ className?: string; strokeWidth?: number }>
    accent: string
    placeholder: string
  }[] = [
    {
      field: 'idea',
      title: 'Hook',
      hint: 'Angle, question, or theme',
      icon: Sparkles,
      accent: 'border-amber-500/35 bg-amber-500/[0.07]',
      placeholder: 'e.g. problem reveal, stat, story beat…',
    },
    {
      field: 'content',
      title: 'Content',
      hint: 'Beat, line, structure',
      icon: FileText,
      accent: 'border-violet-500/35 bg-violet-500/[0.07]',
      placeholder: 'What you’ll say or show',
    },
    {
      field: 'propsGear',
      title: 'Props & gear',
      hint: 'Items, B-roll, sound',
      icon: Package,
      accent: 'border-emerald-500/35 bg-emerald-500/[0.07]',
      placeholder: 'What you need for this beat',
    },
  ]

  return (
    <div>
      <p className="mb-4 text-sm text-zinc-500">
        Each <span className="text-zinc-400">beat</span> is one row: hook, content,
        and props stay linked. Add beats for each moment in your video. Saved in
        this browser.
      </p>
      <div className="space-y-4">
        {plan.rows.map((row, index) => (
          <div
            key={row.id}
            className="rounded-xl border border-alloy-border bg-alloy-panel p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]"
          >
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-alloy-border pb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Beat {index + 1}
              </span>
              <button
                type="button"
                className="rounded p-1 text-zinc-600 hover:bg-white/5 hover:text-zinc-400"
                aria-label="Remove beat"
                onClick={() => removeBeat(row.id)}
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-2">
              {fieldCols.map((col) => {
                const Icon = col.icon
                const value = row[col.field]
                return (
                  <div
                    key={col.field}
                    className={`flex flex-col rounded-lg border p-2 ${col.accent}`}
                  >
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5 text-zinc-500" strokeWidth={1.5} />
                      <span className="text-xs font-medium text-zinc-300">
                        {col.title}
                      </span>
                    </div>
                    <p className="mb-1.5 text-[10px] text-zinc-600">{col.hint}</p>
                    <textarea
                      className={`${inputClass} min-h-[80px] flex-1 resize-y text-sm`}
                      placeholder={col.placeholder}
                      value={value}
                      onChange={(e) =>
                        patchRow(row.id, { [col.field]: e.target.value })
                      }
                      rows={3}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addBeat}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-alloy-border py-3 text-sm font-medium text-zinc-400 hover:border-alloy-purple/40 hover:bg-white/[0.03] hover:text-zinc-200"
      >
        <Plus className="h-4 w-4" strokeWidth={2} />
        Add beat
      </button>
    </div>
  )
}

function IconNavButton({
  icon: Icon,
  active,
  title,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
  active?: boolean
  title: string
}) {
  return (
    <button
      type="button"
      title={title}
      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
        active
          ? 'bg-alloy-purple/15 text-alloy-purple'
          : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
      }`}
      aria-current={active ? 'page' : undefined}
      aria-label={title}
    >
      <Icon className="h-5 w-5" strokeWidth={1.5} />
    </button>
  )
}

function TagChip({
  icon: Icon,
  label,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-alloy-border bg-alloy-elevated px-3 py-1 text-xs font-medium text-zinc-300">
      <Icon className="h-3.5 w-3.5 text-zinc-500" strokeWidth={2} />
      {label}
    </span>
  )
}

function TypeCard({
  title,
  description,
  color,
  icon: Icon,
  onClick,
}: {
  title: string
  description: string
  color: string
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-start rounded-xl border border-alloy-border bg-alloy-elevated p-4 text-left transition hover:border-zinc-600 hover:bg-alloy-panel"
    >
      <Icon className={`mb-3 h-7 w-7 ${color}`} strokeWidth={1.5} />
      <span className="mb-1 text-sm font-semibold text-white">{title}</span>
      <span className="text-xs leading-snug text-zinc-500">{description}</span>
    </button>
  )
}

function blockTypeMeta(t: BlockType): {
  title: string
  description: string
  color: string
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
} {
  switch (t) {
    case 'scene':
      return {
        title: 'Scene',
        description: 'Capture visual moments and shots',
        color: 'text-alloy-orange',
        icon: Clapperboard,
      }
    case 'script':
      return {
        title: 'Script',
        description: 'Write your content structure',
        color: 'text-alloy-purple',
        icon: FileText,
      }
    case 'dialogue':
      return {
        title: 'Dialogue',
        description: 'Add speaker lines and voiceover',
        color: 'text-alloy-blue',
        icon: MessageSquare,
      }
    case 'audio':
      return {
        title: 'Audio',
        description: 'Define music and sound cues',
        color: 'text-alloy-green',
        icon: Music,
      }
    case 'props':
      return {
        title: 'Props & Setup',
        description: 'List required props and setup',
        color: 'text-alloy-orange',
        icon: Box,
      }
  }
}

function BlockTypePickerModal({
  open,
  onClose,
  onPick,
  types,
}: {
  open: boolean
  onClose: () => void
  onPick: (t: BlockType) => void
  types: BlockType[]
}) {
  if (!open) return null

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-[1px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="block-type-picker-title"
        className="fixed left-1/2 top-1/2 z-[101] max-h-[min(90vh,640px)] w-[min(calc(100vw-2rem),440px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-alloy-border bg-alloy-elevated p-5 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2
            id="block-type-picker-title"
            className="text-sm font-semibold text-white"
          >
            Choose block type
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1.5 text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {types.map((t) => {
            const meta = blockTypeMeta(t)
            return (
              <TypeCard
                key={t}
                title={meta.title}
                description={meta.description}
                color={meta.color}
                icon={meta.icon}
                onClick={() => onPick(t)}
              />
            )
          })}
        </div>
      </div>
    </>
  )
}

function EmptyBlocks({
  onPick,
}: {
  onPick: (t: BlockType) => void
}) {
  const [pickerOpen, setPickerOpen] = useState(false)

  function handlePick(t: BlockType) {
    onPick(t)
    setPickerOpen(false)
  }

  return (
    <div>
      <div className="flex flex-col items-center py-10 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-alloy-purple/15">
          <FileText className="h-8 w-8 text-alloy-purple" strokeWidth={1.5} />
        </div>
        <h2 className="mb-2 text-lg font-semibold text-white">
          Structure this idea
        </h2>
        <p className="mb-6 max-w-md text-sm text-zinc-500">
          Add blocks to organize scenes, scripts, dialogue, and audio for your
          content.
        </p>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-alloy-purple px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-alloy-purple/25 hover:brightness-110"
        >
          <Plus className="h-5 w-5" strokeWidth={2} />
          Add Block
        </button>
      </div>

      <BlockTypePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={handlePick}
        types={ALL_BLOCK_TYPES}
      />
    </div>
  )
}

function AddBlockRow({ onAdd }: { onAdd: (t: BlockType) => void }) {
  return (
    <div className="flex justify-center pt-2">
      <AddBlockMenu onAdd={onAdd} />
    </div>
  )
}

function AddBlockMenu({ onAdd }: { onAdd: (t: BlockType) => void }) {
  const [pickerOpen, setPickerOpen] = useState(false)

  function handlePick(t: BlockType) {
    onAdd(t)
    setPickerOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-alloy-border bg-alloy-elevated px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-alloy-panel"
      >
        <Plus className="h-4 w-4" />
        Add Block
      </button>
      <BlockTypePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={handlePick}
        types={ALL_BLOCK_TYPES}
      />
    </>
  )
}

function sumSceneDurationSeconds(blocks: Block[]): number {
  let sum = 0
  for (const b of blocks) {
    if (b.type !== 'scene') continue
    const raw = b.data.durationSec.trim()
    const match = raw.match(/\d+/)
    if (match) {
      const n = parseInt(match[0], 10)
      if (!Number.isNaN(n) && n >= 0) sum += n
    }
  }
  return sum
}

function formatRuntime(totalSec: number): string {
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function runSheetScriptBody(d: ScriptBlockData): string {
  const parts = [d.hook, d.mainContent, d.cta].map((s) => s.trim()).filter(Boolean)
  if (d.tone.trim()) parts.push(`Tone: ${d.tone.trim()}`)
  return parts.length > 0 ? parts.join('\n\n') : ''
}

function runSheetDialogueBody(d: DialogueBlockData): string {
  const lines: string[] = []
  if (d.speaker.trim()) lines.push(`Speaker: ${d.speaker.trim()}`)
  if (d.dialogue.trim()) lines.push(d.dialogue.trim())
  if (d.delivery.trim()) lines.push(`Delivery: ${d.delivery.trim()}`)
  return lines.join('\n')
}

function runSheetAudioBody(d: AudioBlockData): string {
  const lines: string[] = []
  if (d.music.trim()) lines.push(`Music: ${d.music.trim()}`)
  if (d.sfx.trim()) lines.push(`Sound: ${d.sfx.trim()}`)
  if (d.timing.trim()) lines.push(`Timing: ${d.timing.trim()}`)
  return lines.join('\n')
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Full run sheet as plain text (export + copy) */
function buildRunSheetPlainText(blocks: Block[], projectTitle: string): string {
  const sceneCount = blocks.filter((b) => b.type === 'scene').length
  const propsCount = blocks.filter((b) => b.type === 'props').length
  const totalRuntimeSec = sumSceneDurationSeconds(blocks)
  const lines: string[] = []
  lines.push(projectTitle)
  lines.push('')
  lines.push(
    `Total Scenes: ${sceneCount}  |  Total Runtime: ${formatRuntime(totalRuntimeSec)}  |  Assets/Props: ${propsCount}`,
  )
  lines.push('')
  lines.push('PRODUCTION BREAKDOWN')
  lines.push('—'.repeat(48))

  for (const b of blocks) {
    switch (b.type) {
      case 'scene': {
        lines.push('')
        lines.push('SCENE')
        const d = b.data
        if (d.title.trim()) lines.push(`Title: ${d.title.trim()}`)
        if (d.description.trim()) lines.push(`Description:\n${d.description.trim()}`)
        if (d.cameraShot.trim()) lines.push(`Camera: ${d.cameraShot.trim()}`)
        if (d.durationSec.trim()) lines.push(`Duration (sec): ${d.durationSec.trim()}`)
        if (d.visualNotes.trim()) lines.push(`Visual notes:\n${d.visualNotes.trim()}`)
        if (d.propsSetup.trim()) lines.push(`Props & setup:\n${d.propsSetup.trim()}`)
        break
      }
      case 'script':
        lines.push('')
        lines.push('SCRIPT')
        lines.push(runSheetScriptBody(b.data) || '(no content)')
        break
      case 'dialogue':
        lines.push('')
        lines.push('DIALOGUE')
        lines.push(runSheetDialogueBody(b.data) || '(no content)')
        break
      case 'audio':
        lines.push('')
        lines.push('AUDIO')
        lines.push(runSheetAudioBody(b.data) || '(no content)')
        break
      case 'props':
        lines.push('')
        lines.push('PROPS')
        lines.push(b.data.text.trim() || '(no content)')
        break
      default:
        break
    }
  }

  return lines.join('\n')
}

async function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.left = '-9999px'
  document.body.appendChild(ta)
  ta.select()
  document.execCommand('copy')
  document.body.removeChild(ta)
}

function openPrintableRunSheet(projectTitle: string, plainBody: string) {
  const w = window.open('', '_blank')
  if (!w) {
    window.alert('Allow pop-ups to export PDF (print dialog).')
    return
  }
  const safeTitle = escapeHtml(projectTitle)
  const safeBody = escapeHtml(plainBody)
  w.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${safeTitle}</title>
  <style>
    @page { margin: 16mm; }
    body { font-family: ui-sans-serif, system-ui, sans-serif; padding: 24px; color: #111; max-width: 720px; margin: 0 auto; }
    h1 { font-size: 1.125rem; font-weight: 600; margin: 0 0 1rem; }
    pre { white-space: pre-wrap; word-break: break-word; font-size: 11px; line-height: 1.5; margin: 0; font-family: ui-monospace, monospace; }
  </style>
</head>
<body>
  <h1>${safeTitle}</h1>
  <pre>${safeBody}</pre>
</body>
</html>`)
  w.document.close()
  w.focus()
  requestAnimationFrame(() => {
    w.print()
  })
}

function RunSheetView({
  blocks,
  projectTitle,
}: {
  blocks: Block[]
  projectTitle: string
}) {
  const sceneCount = blocks.filter((b) => b.type === 'scene').length
  const propsCount = blocks.filter((b) => b.type === 'props').length
  const hasScript = blocks.some((b) => b.type === 'script')
  const hasDialogue = blocks.some((b) => b.type === 'dialogue')
  const hasAudio = blocks.some((b) => b.type === 'audio')
  const hasBreakdownRows = hasScript || hasDialogue || hasAudio || propsCount > 0
  const empty = blocks.length === 0

  const sceneBlocks = blocks.filter(
    (b): b is Extract<Block, { type: 'scene' }> => b.type === 'scene',
  )

  const totalRuntimeSec = sumSceneDurationSeconds(blocks)

  const singleSceneHeading =
    sceneCount === 1
      ? sceneBlocks[0]?.data.title.trim() || 'Untitled Scene'
      : null

  const breakdownTitle =
    sceneCount >= 1
      ? `${sceneCount} Untitled Scene${sceneCount > 1 ? 's' : ''}`
      : 'Block breakdown'

  const [actionHint, setActionHint] = useState<string | null>(null)

  useEffect(() => {
    if (!actionHint) return
    const t = window.setTimeout(() => setActionHint(null), 2800)
    return () => window.clearTimeout(t)
  }, [actionHint])

  const plainExport = buildRunSheetPlainText(blocks, projectTitle)

  const breakdownRows = blocks.flatMap((b) => {
    switch (b.type) {
      case 'script':
        return [
          <BreakdownRow
            key={b.id}
            color="#a855f7"
            label="SCRIPT"
            icon={FileText}
            content={runSheetScriptBody(b.data)}
          />,
        ]
      case 'dialogue':
        return [
          <BreakdownRow
            key={b.id}
            color="#3b82f6"
            label="DIALOGUE"
            icon={MessageSquare}
            content={runSheetDialogueBody(b.data)}
          />,
        ]
      case 'audio':
        return [
          <BreakdownRow
            key={b.id}
            color="#22c55e"
            label="AUDIO"
            icon={Music}
            content={runSheetAudioBody(b.data)}
          />,
        ]
      case 'props':
        return [
          <BreakdownRow
            key={b.id}
            color="#f97316"
            label="PROPS"
            icon={Box}
            content={b.data.text.trim()}
          />,
        ]
      default:
        return []
    }
  })

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          icon={Clapperboard}
          label="Total Scenes"
          value={String(sceneCount)}
          iconWrapClass="bg-alloy-orange/15"
          iconClass="text-alloy-orange"
        />
        <StatCard
          icon={Clock}
          label="Total Runtime"
          value={formatRuntime(totalRuntimeSec)}
          iconWrapClass="bg-alloy-blue/15"
          iconClass="text-alloy-blue"
        />
        <StatCard
          icon={Box}
          label="Assets/Props"
          value={String(propsCount)}
          iconWrapClass="bg-alloy-green/15"
          iconClass="text-alloy-green"
        />
      </div>

      {empty ? (
        <div className="rounded-xl border border-dashed border-alloy-border bg-alloy-panel/50 px-6 py-14 text-center">
          <p className="text-sm text-zinc-500">
            Add blocks on the{' '}
            <span className="text-zinc-400">Blocks</span> tab to generate your
            production breakdown.
          </p>
        </div>
      ) : (
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-200">
            <FolderOpen className="h-4 w-4 text-zinc-500" strokeWidth={1.5} />
            Production Breakdown
          </div>
          <div className="rounded-xl border border-alloy-border bg-alloy-elevated p-4">
            {sceneCount >= 1 && (
              <div className="mb-4 flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-alloy-orange text-sm font-bold tabular-nums text-white shadow-sm shadow-alloy-orange/30">
                  {sceneCount === 1 ? '1' : sceneCount}
                </span>
                <span className="text-sm font-medium text-white">
                  {sceneCount === 1
                    ? singleSceneHeading
                    : `${sceneCount} Untitled Scenes`}
                </span>
              </div>
            )}
            {!sceneCount && (
              <div className="mb-4 text-sm font-medium text-white">
                {breakdownTitle}
              </div>
            )}
            {hasBreakdownRows ? (
              <div
                className={
                  sceneCount >= 1
                    ? 'space-y-2 border-l border-alloy-border pl-3'
                    : 'space-y-2'
                }
              >
                {breakdownRows}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">
                Add Script, Dialogue, Audio, or Props blocks to see rows here.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="border-t border-alloy-border pt-6">
        {actionHint && (
          <p className="mb-3 text-xs text-emerald-400/90" role="status">
            {actionHint}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <FooterAction
            icon={Download}
            label="Export PDF"
            onClick={() => {
              openPrintableRunSheet(projectTitle, plainExport)
              setActionHint('Print dialog opened — choose Save as PDF.')
            }}
          />
          <FooterAction
            icon={Copy}
            label="Copy as text"
            onClick={async () => {
              try {
                await copyTextToClipboard(plainExport)
                setActionHint('Run sheet copied to clipboard.')
              } catch {
                setActionHint('Could not copy — check browser permissions.')
              }
            }}
          />
          <FooterAction
            icon={Share2}
            label="Copy share link"
            onClick={async () => {
              try {
                await copyTextToClipboard(window.location.href)
                setActionHint('Link copied to clipboard.')
              } catch {
                setActionHint('Could not copy link.')
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  iconWrapClass,
  iconClass,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  value: string
  iconWrapClass: string
  iconClass: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-alloy-border bg-alloy-elevated px-4 py-4">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${iconWrapClass}`}
      >
        <Icon className={`h-6 w-6 ${iconClass}`} strokeWidth={1.5} />
      </div>
      <div>
        <div className="text-xs text-zinc-500">{label}</div>
        <div className="text-xl font-semibold tabular-nums text-white">
          {value}
        </div>
      </div>
    </div>
  )
}

function BreakdownRow({
  color,
  label,
  icon: Icon,
  content,
}: {
  color: string
  label: string
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
  /** Text from the Blocks editor; shown under the label like Alloy */
  content?: string
}) {
  const body =
    content !== undefined && content.trim().length > 0
      ? content.trim()
      : null

  return (
    <div
      className="overflow-hidden rounded-md bg-alloy-panel"
      style={{ boxShadow: `inset 4px 0 0 0 ${color}` }}
    >
      <div className="flex min-h-[2.5rem] items-center gap-3 py-2 pl-1 pr-3">
        <span className="ml-2 inline-flex shrink-0" style={{ color }}>
          <Icon className="h-4 w-4" strokeWidth={1.5} />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-200">
          {label}
        </span>
      </div>
      {body !== null ? (
        <div className="border-t border-alloy-border px-3 py-2.5 pl-10">
          <p className="whitespace-pre-wrap break-words text-left text-xs leading-relaxed text-zinc-400">
            {body}
          </p>
        </div>
      ) : (
        <div className="border-t border-alloy-border px-3 py-2 pl-10">
          <p className="text-xs italic text-zinc-600">No content yet</p>
        </div>
      )}
    </div>
  )
}

function FooterAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  onClick?: () => void | Promise<void>
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg border border-alloy-border bg-transparent px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.04]"
    >
      <Icon className="h-4 w-4 text-zinc-500" strokeWidth={1.5} />
      {label}
    </button>
  )
}
