'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus } from 'lucide-react'

const STORAGE_KEY = 'fab_position'
const NAV_HEIGHT = 80
const LONG_PRESS_MS = 350
const SIZE = 52

interface Pos { x: number; y: number }
interface DraggableFABProps { onTap: () => void }

function clamp(p: Pos): Pos {
    return {
        x: Math.max(8, Math.min(window.innerWidth - SIZE - 8, p.x)),
        y: Math.max(8, Math.min(window.innerHeight - NAV_HEIGHT - SIZE - 8, p.y)),
    }
}

export function DraggableFAB({ onTap }: DraggableFABProps) {
    const btnRef = useRef<HTMLButtonElement>(null)
    const posRef = useRef<Pos>({ x: 0, y: 0 })
    const isDragging = useRef(false)
    const hasMoved = useRef(false)
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [ready, setReady] = useState(false)
    const [dragging, setDragging] = useState(false)

    // Apply position directly to DOM — no re-render
    const applyPos = useCallback((p: Pos) => {
        if (btnRef.current) {
            btnRef.current.style.left = `${p.x}px`
            btnRef.current.style.top = `${p.y}px`
        }
    }, [])

    // Init position from localStorage or default
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY)
        let p: Pos
        if (saved) {
            try {
                p = clamp(JSON.parse(saved))
            } catch {
                p = clamp({ x: window.innerWidth / 2 - SIZE / 2, y: window.innerHeight - NAV_HEIGHT - SIZE - 8 })
            }
        } else {
            p = clamp({ x: window.innerWidth / 2 - SIZE / 2, y: window.innerHeight - NAV_HEIGHT - SIZE - 8 })
        }
        posRef.current = p
        applyPos(p)
        setReady(true)
    }, [applyPos])

    const startDrag = useCallback(() => {
        isDragging.current = true
        setDragging(true)
    }, [])

    const endDrag = useCallback(() => {
        if (!isDragging.current) return
        isDragging.current = false
        setDragging(false)
        const p = clamp(posRef.current)
        posRef.current = p
        applyPos(p)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
    }, [applyPos])

    // ── Touch ──────────────────────────────────────────────────────
    const onTouchStart = useCallback((e: React.TouchEvent) => {
        hasMoved.current = false
        longPressTimer.current = setTimeout(startDrag, LONG_PRESS_MS)
    }, [startDrag])

    const onTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isDragging.current) {
            clearTimeout(longPressTimer.current!)
            return
        }
        e.preventDefault()
        hasMoved.current = true
        const t = e.touches[0]
        const p = clamp({ x: t.clientX - SIZE / 2, y: t.clientY - SIZE / 2 })
        posRef.current = p
        applyPos(p)
    }, [applyPos])

    const onTouchEnd = useCallback(() => {
        clearTimeout(longPressTimer.current!)
        if (isDragging.current) {
            endDrag()
        } else if (!hasMoved.current) {
            onTap()
        }
    }, [endDrag, onTap])

    // ── Mouse ──────────────────────────────────────────────────────
    const onMouseDown = useCallback((e: React.MouseEvent) => {
        hasMoved.current = false
        longPressTimer.current = setTimeout(startDrag, LONG_PRESS_MS)
    }, [startDrag])

    const handleClick = useCallback(() => {
        clearTimeout(longPressTimer.current!)
        if (!isDragging.current && !hasMoved.current) onTap()
    }, [onTap])

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (!isDragging.current) return
            hasMoved.current = true
            const p = clamp({ x: e.clientX - SIZE / 2, y: e.clientY - SIZE / 2 })
            posRef.current = p
            applyPos(p)
        }
        const onMouseUp = () => {
            clearTimeout(longPressTimer.current!)
            endDrag()
        }
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
        return () => {
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
        }
    }, [applyPos, endDrag])

    return (
        <button
            ref={btnRef}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
            onClick={handleClick}
            style={{
                position: 'fixed',
                width: SIZE,
                height: SIZE,
                opacity: ready ? 1 : 0,
                // position set via applyPos, not state
            }}
            className={`z-50 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center select-none touch-none transition-[opacity,box-shadow,transform] duration-150 ${dragging
                    ? 'shadow-2xl shadow-emerald-500/50 scale-110 cursor-grabbing ring-2 ring-white/20'
                    : 'shadow-lg shadow-emerald-500/25 cursor-pointer hover:scale-105 active:scale-95'
                }`}
        >
            <Plus className={`w-5 h-5 transition-transform duration-200 ${dragging ? 'rotate-45' : ''}`} />
        </button>
    )
}
