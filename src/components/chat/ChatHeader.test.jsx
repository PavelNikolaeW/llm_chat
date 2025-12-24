import { render, screen, fireEvent } from '@testing-library/react';
import ChatHeader from './ChatHeader';

describe('ChatHeader', () => {
  it('renders title', () => {
    render(<ChatHeader title="Test Chat" />);
    expect(screen.getByText('Test Chat')).toBeInTheDocument();
  });

  it('uses default title when not provided', () => {
    render(<ChatHeader />);
    expect(screen.getByText('New Chat')).toBeInTheDocument();
  });

  it('shows menu button when showMenuButton is true', () => {
    render(<ChatHeader showMenuButton onMenuClick={jest.fn()} />);
    expect(screen.getByLabelText('Toggle menu')).toBeInTheDocument();
  });

  it('hides menu button when showMenuButton is false', () => {
    render(<ChatHeader showMenuButton={false} />);
    expect(screen.queryByLabelText('Toggle menu')).not.toBeInTheDocument();
  });

  it('calls onMenuClick when menu button clicked', () => {
    const handleMenu = jest.fn();
    render(<ChatHeader showMenuButton onMenuClick={handleMenu} />);

    fireEvent.click(screen.getByLabelText('Toggle menu'));
    expect(handleMenu).toHaveBeenCalledTimes(1);
  });

  it('shows settings button when onSettingsClick provided', () => {
    render(<ChatHeader onSettingsClick={jest.fn()} />);
    expect(screen.getByLabelText('Settings')).toBeInTheDocument();
  });

  it('hides settings button when onSettingsClick not provided', () => {
    render(<ChatHeader />);
    expect(screen.queryByLabelText('Settings')).not.toBeInTheDocument();
  });

  it('calls onSettingsClick when settings button clicked', () => {
    const handleSettings = jest.fn();
    render(<ChatHeader onSettingsClick={handleSettings} />);

    fireEvent.click(screen.getByLabelText('Settings'));
    expect(handleSettings).toHaveBeenCalledTimes(1);
  });
});
