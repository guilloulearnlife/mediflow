import { describe, it, expect } from 'vitest'

// ─── calcDist (Haversine) ────────────────────────────────────────────────────

function calcDist(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3
  const toRad = (d: number) => d * Math.PI / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

describe('calcDist', () => {
  it('Yaoundé → Douala ≈ 195 km', () => {
    const dist = calcDist(3.8667, 11.5167, 4.0511, 9.7679) / 1000
    expect(dist).toBeGreaterThan(185)
    expect(dist).toBeLessThan(205)
  })

  it('même point → 0 m', () => {
    expect(calcDist(3.8667, 11.5167, 3.8667, 11.5167)).toBe(0)
  })

  it('distance symétrique (A→B = B→A)', () => {
    const ab = calcDist(3.8667, 11.5167, 4.0511, 9.7679)
    const ba = calcDist(4.0511, 9.7679, 3.8667, 11.5167)
    expect(Math.abs(ab - ba)).toBeLessThan(1) // < 1 mètre d'écart
  })
})

// ─── dice (similarité bigram) ─────────────────────────────────────────────────

function dice(a: string, b: string): number {
  if (a === b) return 1
  if (a.length < 2 || b.length < 2) return 0
  const s1 = new Set(Array.from({ length: a.length - 1 }, (_, i) => a.slice(i, i + 2)))
  const s2 = new Set(Array.from({ length: b.length - 1 }, (_, i) => b.slice(i, i + 2)))
  const inter = [...s1].filter(x => s2.has(x)).length
  return (2 * inter) / (s1.size + s2.size)
}

describe('dice coefficient', () => {
  it('identiques → 1', () => {
    expect(dice('clinique', 'clinique')).toBe(1)
  })

  it('noms très similaires > 0.7', () => {
    expect(dice('hopital central', 'hospital central')).toBeGreaterThan(0.7)
    expect(dice('clinique saint luc', 'clinique st luc')).toBeGreaterThan(0.5)
  })

  it('noms différents < 0.3', () => {
    expect(dice('clinique abc', 'pharmacie xyz')).toBeLessThan(0.3)
  })

  it('chaîne trop courte → 0', () => {
    expect(dice('a', 'abc')).toBe(0)
  })
})

// ─── Cache key OSM ───────────────────────────────────────────────────────────

function buildCacheKey(lat: number, lon: number, rayon: string, specialite: string): string {
  return `${lat.toFixed(2)}:${lon.toFixed(2)}:${rayon}:${specialite}`
}

describe('buildCacheKey', () => {
  it('arrondit les coords à 2 décimales', () => {
    const key = buildCacheKey(3.86674, 11.51672, '10', 'all')
    expect(key).toBe('3.87:11.52:10:all')
  })

  it('deux points proches (< 1 km) donnent la même clé', () => {
    const k1 = buildCacheKey(3.8667, 11.5167, '10', 'hospital')
    const k2 = buildCacheKey(3.8670, 11.5170, '10', 'hospital')
    expect(k1).toBe(k2)
  })

  it('spécialités différentes → clés différentes', () => {
    const k1 = buildCacheKey(3.8667, 11.5167, '10', 'hospital')
    const k2 = buildCacheKey(3.8667, 11.5167, '10', 'pharmacie')
    expect(k1).not.toBe(k2)
  })
})
