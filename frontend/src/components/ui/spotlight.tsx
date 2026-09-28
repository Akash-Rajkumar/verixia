import { useRef, useState, useEffect } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

export interface SpotlightProps {
  className?: string
  fill?: string
}

export function Spotlight({ className = '', fill = 'rgba(6, 182, 212, 0.15)' }: SpotlightProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  const mouseX = useSpring(0, { stiffness: 150, damping: 20 })
  const mouseY = useSpring(0, { stiffness: 150, damping: 20 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.parentElement?.getBoundingClientRect()
      if (!rect) return
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      mouseX.set(x)
      mouseY.set(y)
    }

    const parent = containerRef.current?.parentElement
    if (parent) {
      const onEnter = () => setIsHovered(true)
      const onLeave = () => setIsHovered(false)
      parent.addEventListener('mousemove', handleMouseMove)
      parent.addEventListener('mouseenter', onEnter)
      parent.addEventListener('mouseleave', onLeave)
      return () => {
        parent.removeEventListener('mousemove', handleMouseMove)
        parent.removeEventListener('mouseenter', onEnter)
        parent.removeEventListener('mouseleave', onLeave)
      }
    }
  }, [mouseX, mouseY])

  const background = useTransform(
    [mouseX, mouseY],
    ([x, y]) =>
      `radial-gradient(600px circle at ${x}px ${y}px, ${fill}, transparent 80%)`
  )

  return (
    <div ref={containerRef} className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <motion.div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background,
          opacity: isHovered ? 1 : 0.4,
        }}
      />
    </div>
  )
}
