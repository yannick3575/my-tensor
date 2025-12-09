import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculatePerformanceMetrics } from '../crypto'
import type { PredictionComparison } from '@/lib/supabase/types'

// Mock next/cache - unstable_cache returns the function directly (no caching in tests)
vi.mock('next/cache', () => ({
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
}))

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({
    getAll: () => [],
    set: vi.fn(),
  })),
}))

// Mock @supabase/ssr
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}))

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

// Import the mocked module AFTER mocking
import { createClient } from '@/lib/supabase/client'

// Now import the functions that use the mocked modules
// We need to dynamically import after mocks are set up
const getModule = async () => {
  const mod = await import('../crypto')
  return mod
}

const mockMetrics = [
  {
    id: '1',
    date: '2024-01-15',
    symbol: 'BTC-USD',
    actual_price: 42000,
    predicted_price: null,
    model_version: 'v1',
    confidence_score: null,
    prediction_lower_bound: null,
    prediction_upper_bound: null,
    created_at: '2024-01-15T00:00:00Z',
  },
  {
    id: '2',
    date: '2024-01-16',
    symbol: 'BTC-USD',
    actual_price: 43000,
    predicted_price: 43500,
    model_version: 'v1',
    confidence_score: 0.85,
    prediction_lower_bound: 42000,
    prediction_upper_bound: 45000,
    created_at: '2024-01-16T00:00:00Z',
  },
]

describe('getCryptoMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch metrics with default parameters', async () => {
    const mockLimit = vi.fn().mockResolvedValue({ data: mockMetrics, error: null })
    const mockOrder = vi.fn(() => ({ limit: mockLimit }))
    const mockEq = vi.fn(() => ({ order: mockOrder }))
    const mockSelect = vi.fn(() => ({ eq: mockEq }))
    const mockFrom = vi.fn(() => ({ select: mockSelect }))

    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as unknown as Awaited<ReturnType<typeof createClient>>)

    const { getCryptoMetrics } = await getModule()
    const result = await getCryptoMetrics()

    expect(mockFrom).toHaveBeenCalledWith('crypto_metrics')
    expect(mockSelect).toHaveBeenCalledWith('*')
    expect(mockEq).toHaveBeenCalledWith('symbol', 'BTC-USD')
    expect(mockOrder).toHaveBeenCalledWith('date', { ascending: true })
    expect(mockLimit).toHaveBeenCalledWith(31) // 30 days + 1
    expect(result).toEqual(mockMetrics)
  })

  it('should fetch metrics with custom symbol and days', async () => {
    const mockLimit = vi.fn().mockResolvedValue({ data: [], error: null })
    const mockOrder = vi.fn(() => ({ limit: mockLimit }))
    const mockEq = vi.fn(() => ({ order: mockOrder }))
    const mockSelect = vi.fn(() => ({ eq: mockEq }))
    const mockFrom = vi.fn(() => ({ select: mockSelect }))

    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as unknown as Awaited<ReturnType<typeof createClient>>)

    const { getCryptoMetrics } = await getModule()
    await getCryptoMetrics('ETH-USD', 7)

    expect(mockEq).toHaveBeenCalledWith('symbol', 'ETH-USD')
    expect(mockLimit).toHaveBeenCalledWith(8) // 7 days + 1
  })

  it('should throw error on Supabase failure', async () => {
    const mockError = { message: 'Database error' }
    const mockLimit = vi.fn().mockResolvedValue({ data: null, error: mockError })
    const mockOrder = vi.fn(() => ({ limit: mockLimit }))
    const mockEq = vi.fn(() => ({ order: mockOrder }))
    const mockSelect = vi.fn(() => ({ eq: mockEq }))
    const mockFrom = vi.fn(() => ({ select: mockSelect }))

    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as unknown as Awaited<ReturnType<typeof createClient>>)

    const { getCryptoMetrics } = await getModule()
    await expect(getCryptoMetrics()).rejects.toThrow('Impossible de récupérer les données: Database error')
  })

  it('should return empty array when data is null', async () => {
    const mockLimit = vi.fn().mockResolvedValue({ data: null, error: null })
    const mockOrder = vi.fn(() => ({ limit: mockLimit }))
    const mockEq = vi.fn(() => ({ order: mockOrder }))
    const mockSelect = vi.fn(() => ({ eq: mockEq }))
    const mockFrom = vi.fn(() => ({ select: mockSelect }))

    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as unknown as Awaited<ReturnType<typeof createClient>>)

    const { getCryptoMetrics } = await getModule()
    const result = await getCryptoMetrics()
    expect(result).toEqual([])
  })
})

describe('getChartData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should transform metrics to chart data format', async () => {
    const mockLimit = vi.fn().mockResolvedValue({ data: mockMetrics, error: null })
    const mockOrder = vi.fn(() => ({ limit: mockLimit }))
    const mockEq = vi.fn(() => ({ order: mockOrder }))
    const mockSelect = vi.fn(() => ({ eq: mockEq }))
    const mockFrom = vi.fn(() => ({ select: mockSelect }))

    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as unknown as Awaited<ReturnType<typeof createClient>>)

    const { getChartData } = await getModule()
    const result = await getChartData()

    expect(result).toHaveLength(2)
    expect(result[0]).toHaveProperty('date')
    expect(result[0]).toHaveProperty('actual', 42000)
    expect(result[0]).toHaveProperty('predicted', null)
    expect(result[0]).toHaveProperty('lowerBound', null)
    expect(result[0]).toHaveProperty('upperBound', null)
    expect(result[1]).toHaveProperty('actual', 43000)
    expect(result[1]).toHaveProperty('predicted', 43500)
    expect(result[1]).toHaveProperty('lowerBound', 42000)
    expect(result[1]).toHaveProperty('upperBound', 45000)
  })
})

describe('getLatestPrediction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch latest prediction', async () => {
    const predictionMetric = mockMetrics[1]
    const mockSingle = vi.fn().mockResolvedValue({ data: predictionMetric, error: null })
    const mockLimit = vi.fn(() => ({ single: mockSingle }))
    const mockOrder = vi.fn(() => ({ limit: mockLimit }))
    const mockNot = vi.fn(() => ({ order: mockOrder }))
    const mockEq = vi.fn(() => ({ not: mockNot }))
    const mockSelect = vi.fn(() => ({ eq: mockEq }))
    const mockFrom = vi.fn(() => ({ select: mockSelect }))

    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as unknown as Awaited<ReturnType<typeof createClient>>)

    const { getLatestPrediction } = await getModule()
    const result = await getLatestPrediction()

    expect(mockNot).toHaveBeenCalledWith('predicted_price', 'is', null)
    expect(mockOrder).toHaveBeenCalledWith('date', { ascending: false })
    expect(result).toEqual(predictionMetric)
  })

  it('should return null on error', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
    const mockLimit = vi.fn(() => ({ single: mockSingle }))
    const mockOrder = vi.fn(() => ({ limit: mockLimit }))
    const mockNot = vi.fn(() => ({ order: mockOrder }))
    const mockEq = vi.fn(() => ({ not: mockNot }))
    const mockSelect = vi.fn(() => ({ eq: mockEq }))
    const mockFrom = vi.fn(() => ({ select: mockSelect }))

    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as unknown as Awaited<ReturnType<typeof createClient>>)

    const { getLatestPrediction } = await getModule()
    const result = await getLatestPrediction()
    expect(result).toBeNull()
  })
})

describe('getLatestActualPrice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch latest actual price', async () => {
    const actualMetric = mockMetrics[0]
    const mockSingle = vi.fn().mockResolvedValue({ data: actualMetric, error: null })
    const mockLimit = vi.fn(() => ({ single: mockSingle }))
    const mockOrder = vi.fn(() => ({ limit: mockLimit }))
    const mockNot = vi.fn(() => ({ order: mockOrder }))
    const mockEq = vi.fn(() => ({ not: mockNot }))
    const mockSelect = vi.fn(() => ({ eq: mockEq }))
    const mockFrom = vi.fn(() => ({ select: mockSelect }))

    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as unknown as Awaited<ReturnType<typeof createClient>>)

    const { getLatestActualPrice } = await getModule()
    const result = await getLatestActualPrice()

    expect(mockNot).toHaveBeenCalledWith('actual_price', 'is', null)
    expect(result).toEqual(actualMetric)
  })

  it('should return null on error', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
    const mockLimit = vi.fn(() => ({ single: mockSingle }))
    const mockOrder = vi.fn(() => ({ limit: mockLimit }))
    const mockNot = vi.fn(() => ({ order: mockOrder }))
    const mockEq = vi.fn(() => ({ not: mockNot }))
    const mockSelect = vi.fn(() => ({ eq: mockEq }))
    const mockFrom = vi.fn(() => ({ select: mockSelect }))

    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as unknown as Awaited<ReturnType<typeof createClient>>)

    const { getLatestActualPrice } = await getModule()
    const result = await getLatestActualPrice()
    expect(result).toBeNull()
  })
})

describe('calculatePerformanceMetrics', () => {
  it('should return zero metrics for empty history', () => {
    const result = calculatePerformanceMetrics([])

    expect(result).toEqual({
      mae: 0,
      rmse: 0,
      accuracy: 0,
      totalPredictions: 0,
    })
  })

  it('should calculate correct metrics for prediction history', () => {
    const history: PredictionComparison[] = [
      { date: '2024-01-15', predicted: 42000, actual: 42500, error: 500, errorPercent: 1.18, confidence: 0.85 },
      { date: '2024-01-16', predicted: 43000, actual: 42000, error: -1000, errorPercent: -2.38, confidence: 0.80 },
      { date: '2024-01-17', predicted: 44000, actual: 40000, error: -4000, errorPercent: -10, confidence: 0.75 },
    ]

    const result = calculatePerformanceMetrics(history)

    // MAE = (500 + 1000 + 4000) / 3 = 1833.33
    expect(result.mae).toBeCloseTo(1833.33, 0)
    // RMSE = sqrt((500^2 + 1000^2 + 4000^2) / 3) = sqrt(5750000) ≈ 2397.92
    expect(result.rmse).toBeCloseTo(2397.92, 0)
    // Accuracy: 2 out of 3 predictions have < 5% error = 66.7%
    expect(result.accuracy).toBeCloseTo(66.7, 0)
    expect(result.totalPredictions).toBe(3)
  })

  it('should count accurate predictions correctly', () => {
    const history: PredictionComparison[] = [
      { date: '2024-01-15', predicted: 42000, actual: 42100, error: 100, errorPercent: 0.24, confidence: 0.9 },
      { date: '2024-01-16', predicted: 43000, actual: 43200, error: 200, errorPercent: 0.46, confidence: 0.9 },
    ]

    const result = calculatePerformanceMetrics(history)

    // Both predictions are < 5% error
    expect(result.accuracy).toBe(100)
  })
})
