import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'

describe('Button', () => {
  it('renders its children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('is disabled and shows spinner when isLoading is true', () => {
    render(<Button isLoading>Submit</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    expect(btn.querySelector('svg')).toBeInTheDocument()
  })

  it('is disabled when the disabled prop is passed', () => {
    render(<Button disabled>Submit</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('calls onClick when clicked', () => {
    const handler = vi.fn()
    render(<Button onClick={handler}>Click</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when disabled', () => {
    const handler = vi.fn()
    render(
      <Button disabled onClick={handler}>
        Click
      </Button>,
    )
    fireEvent.click(screen.getByRole('button'))
    expect(handler).not.toHaveBeenCalled()
  })
})

describe('Badge', () => {
  it('renders the label', () => {
    render(<Badge label="Pending" />)
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<Badge label="High" className="bg-red-100" />)
    expect(screen.getByText('High')).toHaveClass('bg-red-100')
  })
})

describe('Modal', () => {
  it('renders nothing when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Test">
        <p>content</p>
      </Modal>,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders title and children when isOpen is true', () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="My Modal">
        <p>inner content</p>
      </Modal>,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('My Modal')).toBeInTheDocument()
    expect(screen.getByText('inner content')).toBeInTheDocument()
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen onClose={onClose} title="Modal">
        <p>content</p>
      </Modal>,
    )
    fireEvent.click(screen.getByRole('dialog').firstChild as Element)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen onClose={onClose} title="Modal">
        <p>content</p>
      </Modal>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Close modal' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen onClose={onClose} title="Modal">
        <p>content</p>
      </Modal>,
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('blocks body scroll when open and restores it on close', () => {
    const { rerender } = render(
      <Modal isOpen onClose={vi.fn()} title="Modal">
        <p>content</p>
      </Modal>,
    )
    expect(document.body.style.overflow).toBe('hidden')

    rerender(
      <Modal isOpen={false} onClose={vi.fn()} title="Modal">
        <p>content</p>
      </Modal>,
    )
    expect(document.body.style.overflow).toBe('')
  })
})
