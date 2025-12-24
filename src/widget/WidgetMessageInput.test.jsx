import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WidgetMessageInput from './WidgetMessageInput';

describe('WidgetMessageInput', () => {
  const mockOnSend = jest.fn();

  beforeEach(() => {
    mockOnSend.mockClear();
  });

  it('renders input and send button', () => {
    render(<WidgetMessageInput onSend={mockOnSend} />);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('displays custom placeholder', () => {
    render(<WidgetMessageInput onSend={mockOnSend} placeholder="Custom placeholder" />);

    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });

  it('displays default placeholder', () => {
    render(<WidgetMessageInput onSend={mockOnSend} />);

    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
  });

  it('calls onSend when form is submitted', async () => {
    const user = userEvent.setup();
    render(<WidgetMessageInput onSend={mockOnSend} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'Hello world');

    const button = screen.getByRole('button', { name: /send/i });
    await user.click(button);

    expect(mockOnSend).toHaveBeenCalledWith('Hello world');
  });

  it('calls onSend when Enter is pressed', async () => {
    const user = userEvent.setup();
    render(<WidgetMessageInput onSend={mockOnSend} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'Test message{Enter}');

    expect(mockOnSend).toHaveBeenCalledWith('Test message');
  });

  it('clears input after sending', async () => {
    const user = userEvent.setup();
    render(<WidgetMessageInput onSend={mockOnSend} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'Test message');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(input).toHaveValue('');
  });

  it('does not send empty messages', async () => {
    const user = userEvent.setup();
    render(<WidgetMessageInput onSend={mockOnSend} />);

    const button = screen.getByRole('button', { name: /send/i });
    await user.click(button);

    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('does not send whitespace-only messages', async () => {
    const user = userEvent.setup();
    render(<WidgetMessageInput onSend={mockOnSend} />);

    const input = screen.getByRole('textbox');
    await user.type(input, '   ');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('disables input when disabled prop is true', () => {
    render(<WidgetMessageInput onSend={mockOnSend} disabled />);

    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
  });

  it('does not send message when disabled', async () => {
    const user = userEvent.setup();
    render(<WidgetMessageInput onSend={mockOnSend} disabled />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Test' } });

    const button = screen.getByRole('button', { name: /send/i });
    await user.click(button);

    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('trims whitespace from messages', async () => {
    const user = userEvent.setup();
    render(<WidgetMessageInput onSend={mockOnSend} />);

    const input = screen.getByRole('textbox');
    await user.type(input, '  Hello world  ');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(mockOnSend).toHaveBeenCalledWith('Hello world');
  });

  it('updates input value as user types', async () => {
    const user = userEvent.setup();
    render(<WidgetMessageInput onSend={mockOnSend} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'Testing');

    expect(input).toHaveValue('Testing');
  });

  it('send button is disabled when input is empty', () => {
    render(<WidgetMessageInput onSend={mockOnSend} />);

    const button = screen.getByRole('button', { name: /send/i });
    expect(button).toBeDisabled();
  });

  it('send button is enabled when input has content', async () => {
    const user = userEvent.setup();
    render(<WidgetMessageInput onSend={mockOnSend} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'Test');

    const button = screen.getByRole('button', { name: /send/i });
    expect(button).not.toBeDisabled();
  });
});
