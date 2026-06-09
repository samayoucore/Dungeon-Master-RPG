import { useMemo } from 'react';

interface Particle {
  id: number;
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
}

const PARTICLE_COUNT = 22;

function createParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, id) => ({
    id,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 2 + Math.random() * 4,
    duration: 6 + Math.random() * 8,
    delay: Math.random() * 6,
  }));
}

/**
 * Decorative layer of slowly drifting, twinkling golden motes.
 * Animated via CSS keyframes (see index.css) rather than framer-motion, so the
 * perpetual loop never interferes with AnimatePresence exit completion.
 */
export default function ParticleField() {
  const particles = useMemo(createParticles, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="absolute rounded-full bg-gold opacity-0 shadow-[0_0_8px_rgba(201,162,39,0.7)]"
          // Per-particle position, size and timing have no Tailwind equivalent.
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: particle.size,
            height: particle.size,
            animation: `particle-float ${particle.duration}s ease-in-out ${particle.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
