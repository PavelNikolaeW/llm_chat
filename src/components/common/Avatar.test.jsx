import { render, screen } from '@testing-library/react';
import Avatar from './Avatar';

describe('Avatar', () => {
  it('renders initials from name', () => {
    render(<Avatar name="John Doe" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders single initial for single name', () => {
    render(<Avatar name="John" />);
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('renders ? when no name provided', () => {
    render(<Avatar />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('renders image when src is provided', () => {
    render(<Avatar name="John" src="/avatar.jpg" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/avatar.jpg');
    expect(img).toHaveAttribute('alt', 'John');
  });

  it('uses Avatar as default alt text', () => {
    render(<Avatar src="/avatar.jpg" />);
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Avatar');
  });

  it('applies size class', () => {
    const { container } = render(<Avatar name="Test" size="large" />);
    expect(container.firstChild).toHaveClass('large');
  });

  it('applies custom className', () => {
    const { container } = render(<Avatar name="Test" className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('truncates initials to 2 characters', () => {
    render(<Avatar name="John Michael Doe Smith" />);
    expect(screen.getByText('JM')).toBeInTheDocument();
  });

  it('shows title with full name', () => {
    render(<Avatar name="John Doe" />);
    expect(screen.getByTitle('John Doe')).toBeInTheDocument();
  });
});
