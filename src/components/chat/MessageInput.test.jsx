import { render, screen, fireEvent } from '@testing-library/react';
import MessageInput from './MessageInput';

describe('MessageInput', () => {
  it('renders textarea and send button', () => {
    render(<MessageInput onSend={jest.fn()} />);
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    expect(screen.getByText('Send')).toBeInTheDocument();
  });

  it('calls onSend when form is submitted', () => {
    const handleSend = jest.fn();
    render(<MessageInput onSend={handleSend} />);

    const textarea = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    fireEvent.click(screen.getByText('Send'));

    expect(handleSend).toHaveBeenCalledWith('Hello');
  });

  it('clears input after sending', () => {
    render(<MessageInput onSend={jest.fn()} />);

    const textarea = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    fireEvent.click(screen.getByText('Send'));

    expect(textarea.value).toBe('');
  });

  it('sends on Enter key', () => {
    const handleSend = jest.fn();
    render(<MessageInput onSend={handleSend} />);

    const textarea = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(handleSend).toHaveBeenCalledWith('Hello');
  });

  it('does not send on Shift+Enter', () => {
    const handleSend = jest.fn();
    render(<MessageInput onSend={handleSend} />);

    const textarea = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

    expect(handleSend).not.toHaveBeenCalled();
  });

  it('does not send empty message', () => {
    const handleSend = jest.fn();
    render(<MessageInput onSend={handleSend} />);

    fireEvent.click(screen.getByText('Send'));

    expect(handleSend).not.toHaveBeenCalled();
  });

  it('trims whitespace before sending', () => {
    const handleSend = jest.fn();
    render(<MessageInput onSend={handleSend} />);

    const textarea = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(textarea, { target: { value: '  Hello  ' } });
    fireEvent.click(screen.getByText('Send'));

    expect(handleSend).toHaveBeenCalledWith('Hello');
  });

  it('shows Stop button when streaming', () => {
    render(<MessageInput onSend={jest.fn()} isStreaming />);
    expect(screen.getByText('Stop')).toBeInTheDocument();
    expect(screen.queryByText('Send')).not.toBeInTheDocument();
  });

  it('calls onStop when Stop is clicked', () => {
    const handleStop = jest.fn();
    render(<MessageInput onSend={jest.fn()} onStop={handleStop} isStreaming />);

    fireEvent.click(screen.getByText('Stop'));
    expect(handleStop).toHaveBeenCalledTimes(1);
  });

  it('disables textarea when disabled prop is true', () => {
    render(<MessageInput onSend={jest.fn()} disabled />);
    expect(screen.getByPlaceholderText('Type a message...')).toBeDisabled();
  });

  it('uses custom placeholder', () => {
    render(<MessageInput onSend={jest.fn()} placeholder="Ask anything..." />);
    expect(screen.getByPlaceholderText('Ask anything...')).toBeInTheDocument();
  });

  it('disables send button when message is empty', () => {
    render(<MessageInput onSend={jest.fn()} />);
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
  });

  it('enables send button when message has content', () => {
    render(<MessageInput onSend={jest.fn()} />);

    const textarea = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(textarea, { target: { value: 'Hello' } });

    expect(screen.getByRole('button', { name: /send/i })).not.toBeDisabled();
  });
});
