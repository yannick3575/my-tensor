import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PredictionCard } from '../PredictionCard'

describe('PredictionCard', () => {
  it('should render title and value', () => {
    render(<PredictionCard title="Test Title" value={1000} />)

    expect(screen.getByText('Test Title')).toBeInTheDocument()
    // toLocaleString() uses system locale, match the rendered value
    expect(screen.getByText(/1[,.\s]?000/)).toBeInTheDocument()
  })

  it('should format USD values correctly', () => {
    render(<PredictionCard title="Price" value={42500} suffix="USD" />)

    expect(screen.getByText('$42,500')).toBeInTheDocument()
  })

  it('should format percentage values with sign', () => {
    render(<PredictionCard title="Change" value={5.25} suffix="%" />)
    expect(screen.getByText('+5.25%')).toBeInTheDocument()
  })

  it('should format negative percentage values', () => {
    render(<PredictionCard title="Change" value={-3.5} suffix="%" />)
    expect(screen.getByText('-3.50%')).toBeInTheDocument()
  })

  it('should display dash for null value', () => {
    render(<PredictionCard title="No Data" value={null} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('should display dash for undefined value', () => {
    render(<PredictionCard title="No Data" value={undefined} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('should render date when provided', () => {
    render(<PredictionCard title="Test" value={100} date="2024-01-15" />)

    // French locale date format
    expect(screen.getByText(/15 janvier 2024/)).toBeInTheDocument()
  })

  it('should not render date when not provided', () => {
    render(<PredictionCard title="Test" value={100} />)

    const container = screen.getByText('Test').closest('div')
    expect(container?.querySelector('.text-xs')).toBeNull()
  })

  it('should apply highlight styles when highlight is true', () => {
    const { container } = render(<PredictionCard title="Test" value={100} highlight />)

    const card = container.firstChild as HTMLElement
    expect(card.className).toContain('border-accent')
    expect(card.className).toContain('bg-accent/5')
  })

  it('should render up trend icon with green color', () => {
    render(<PredictionCard title="Test" value={100} trend="up" />)

    const svg = document.querySelector('svg')
    expect(svg).toBeInTheDocument()
    // SVG uses classList in jsdom, check via getAttribute
    expect(svg?.getAttribute('class')).toContain('text-green-500')
  })

  it('should render down trend icon with red color', () => {
    render(<PredictionCard title="Test" value={100} trend="down" />)

    const svg = document.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg?.getAttribute('class')).toContain('text-red-500')
  })

  it('should apply green text color for up trend', () => {
    render(<PredictionCard title="Test" value={100} trend="up" />)

    const valueElement = screen.getByText('100')
    expect(valueElement.className).toContain('text-green-500')
  })

  it('should apply red text color for down trend', () => {
    render(<PredictionCard title="Test" value={100} trend="down" />)

    const valueElement = screen.getByText('100')
    expect(valueElement.className).toContain('text-red-500')
  })

  it('should not render trend icon when trend is undefined', () => {
    render(<PredictionCard title="Test" value={100} />)

    const svg = document.querySelector('svg')
    expect(svg).toBeNull()
  })
})
