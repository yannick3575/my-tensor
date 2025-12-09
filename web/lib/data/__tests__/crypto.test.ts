import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCryptoMetrics, getChartData, getLatestPrediction, getLatestActualPrice } from '../crypto'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              single: vi.fn(),
            })),
          })),
          not: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({
                single: vi.fn(),
              })),
            })),
          })),
        })),
      })),
    })),
  })),
}))

// Import the mocked module
import { createClient } from '@/lib/supabase/client'

const mockMetrics = [
  {
    id: 1,
    date: '2024-01-15',
    symbol: 'BTC-USD',
    actual_price: 42000,
    predicted_price: null,
    model_version: 'v1',
    confidence_score: null,
  },
  {
    id: 2,
    date: '2024-01-16',
    symbol: 'BTC-USD',
    actual_price: 43000,
    predicted_price: 43500,
    model_version: 'v1',
    confidence_score: 0.85,
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

    vi.mocked(createClient).mockReturnValue({ from: mockFrom } as ReturnType<typeof createClient>)

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

    vi.mocked(createClient).mockReturnValue({ from: mockFrom } as ReturnType<typeof createClient>)

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

    vi.mocked(createClient).mockReturnValue({ from: mockFrom } as ReturnType<typeof createClient>)

    await expect(getCryptoMetrics()).rejects.toThrow('Impossible de récupérer les données: Database error')
  })

  it('should return empty array when data is null', async () => {
    const mockLimit = vi.fn().mockResolvedValue({ data: null, error: null })
    const mockOrder = vi.fn(() => ({ limit: mockLimit }))
    const mockEq = vi.fn(() => ({ order: mockOrder }))
    const mockSelect = vi.fn(() => ({ eq: mockEq }))
    const mockFrom = vi.fn(() => ({ select: mockSelect }))

    vi.mocked(createClient).mockReturnValue({ from: mockFrom } as ReturnType<typeof createClient>)

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

    vi.mocked(createClient).mockReturnValue({ from: mockFrom } as ReturnType<typeof createClient>)

    const result = await getChartData()

    expect(result).toHaveLength(2)
    expect(result[0]).toHaveProperty('date')
    expect(result[0]).toHaveProperty('actual', 42000)
    expect(result[0]).toHaveProperty('predicted', null)
    expect(result[1]).toHaveProperty('actual', 43000)
    expect(result[1]).toHaveProperty('predicted', 43500)
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

    vi.mocked(createClient).mockReturnValue({ from: mockFrom } as ReturnType<typeof createClient>)

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

    vi.mocked(createClient).mockReturnValue({ from: mockFrom } as ReturnType<typeof createClient>)

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

    vi.mocked(createClient).mockReturnValue({ from: mockFrom } as ReturnType<typeof createClient>)

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

    vi.mocked(createClient).mockReturnValue({ from: mockFrom } as ReturnType<typeof createClient>)

    const result = await getLatestActualPrice()
    expect(result).toBeNull()
  })
})
