import { render, screen } from '@testing-library/react';
import WidgetMessageList from './WidgetMessageList';

describe('WidgetMessageList', () => {
  const mockMessages = [
    { id: 'msg-1', role: 'user', content: 'Hello' },
    { id: 'msg-2', role: 'assistant', content: 'Hi there!' },
  ];

  it('renders empty state when no messages', () => {
    render(<WidgetMessageList messages={[]} />);

    expect(screen.getByText(/how can i help you today/i)).toBeInTheDocument();
  });

  it('renders empty state with default messages prop', () => {
    render(<WidgetMessageList />);

    expect(screen.getByText(/how can i help you today/i)).toBeInTheDocument();
  });

  it('renders user messages', () => {
    render(<WidgetMessageList messages={mockMessages} />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders assistant messages', () => {
    render(<WidgetMessageList messages={mockMessages} />);

    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('renders multiple messages in order', () => {
    render(<WidgetMessageList messages={mockMessages} />);

    const messages = screen.getAllByText(/hello|hi there/i);
    expect(messages).toHaveLength(2);
  });

  it('shows typing indicator when streaming with empty assistant content', () => {
    const messagesWithEmptyAssistant = [
      { id: 'msg-1', role: 'user', content: 'Hello' },
      { id: 'msg-2', role: 'assistant', content: '' },
    ];

    render(<WidgetMessageList messages={messagesWithEmptyAssistant} isStreaming />);

    // The typing indicator should be present (3 spans for dots)
    const container = document.querySelector('.typing');
    expect(container).toBeInTheDocument();
  });

  it('does not show typing indicator when not streaming', () => {
    const messagesWithEmptyAssistant = [
      { id: 'msg-1', role: 'user', content: 'Hello' },
      { id: 'msg-2', role: 'assistant', content: '' },
    ];

    render(<WidgetMessageList messages={messagesWithEmptyAssistant} isStreaming={false} />);

    const container = document.querySelector('.typing');
    expect(container).not.toBeInTheDocument();
  });

  it('renders streaming message content', () => {
    const streamingMessages = [
      { id: 'msg-1', role: 'user', content: 'Hello' },
      { id: 'msg-2', role: 'assistant', content: 'I am responding...' },
    ];

    render(<WidgetMessageList messages={streamingMessages} isStreaming />);

    expect(screen.getByText('I am responding...')).toBeInTheDocument();
  });

  it('applies correct CSS classes for user messages', () => {
    const userMessages = [{ id: 'msg-1', role: 'user', content: 'Test' }];
    render(<WidgetMessageList messages={userMessages} />);

    const messageContainer = screen.getByText('Test').closest('.message');
    expect(messageContainer).toHaveClass('user');
  });

  it('applies correct CSS classes for assistant messages', () => {
    const assistantMessages = [{ id: 'msg-1', role: 'assistant', content: 'Test' }];
    render(<WidgetMessageList messages={assistantMessages} />);

    const messageContainer = screen.getByText('Test').closest('.message');
    expect(messageContainer).toHaveClass('assistant');
  });

  it('preserves whitespace in messages', () => {
    const messagesWithWhitespace = [
      { id: 'msg-1', role: 'user', content: 'Line 1\nLine 2' },
    ];
    render(<WidgetMessageList messages={messagesWithWhitespace} />);

    expect(screen.getByText(/line 1/i)).toBeInTheDocument();
  });

  it('renders long messages', () => {
    const longMessage = 'A'.repeat(1000);
    const messagesWithLong = [
      { id: 'msg-1', role: 'user', content: longMessage },
    ];
    render(<WidgetMessageList messages={messagesWithLong} />);

    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it('renders empty icon in empty state', () => {
    render(<WidgetMessageList messages={[]} />);

    expect(screen.getByText('💬')).toBeInTheDocument();
  });

  it('handles messages with special characters', () => {
    const specialMessages = [
      { id: 'msg-1', role: 'user', content: '<script>alert("xss")</script>' },
    ];
    render(<WidgetMessageList messages={specialMessages} />);

    // Should render as text, not execute script
    expect(screen.getByText(/<script>/)).toBeInTheDocument();
  });
});
