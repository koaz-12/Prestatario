'use client'

const PREDEFINED_TAGS = [
    { label: 'Familiar', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    { label: 'Negocio', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    { label: 'Emergencia', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    { label: 'Personal', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    { label: 'Viaje', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    { label: 'Educación', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
]

interface TagSelectorProps {
    selected: string[]
    onChange: (tags: string[]) => void
}

export function TagSelector({ selected, onChange }: TagSelectorProps) {
    function toggle(label: string) {
        if (selected.includes(label)) {
            onChange(selected.filter(t => t !== label))
        } else {
            onChange([...selected, label])
        }
    }

    return (
        <div className="flex flex-wrap gap-1.5">
            {PREDEFINED_TAGS.map(tag => {
                const isActive = selected.includes(tag.label)
                return (
                    <button
                        key={tag.label}
                        type="button"
                        onClick={() => toggle(tag.label)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all active:scale-95 ${isActive ? tag.color : 'bg-zinc-900 text-zinc-500 border-zinc-700/60 hover:border-zinc-600'}`}
                    >
                        {tag.label}
                    </button>
                )
            })}
        </div>
    )
}

export { PREDEFINED_TAGS }
