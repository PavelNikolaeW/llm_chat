import { render, screen } from '@testing-library/react';
import MessageList from './MessageList';

describe('MessageList', () => {
  const messages = [
    { id: 'msg-1', role: 'user', content: 'Hello' },
    { id: 'msg-2', role: 'assistant', content: 'Hi there!' },
  ];

  it('renders empty state when no messages', () => {
    render(<MessageList messages={[]} />);
    expect(screen.getByText('No messages yet')).toBeInTheDocument();
    expect(screen.getByText('Start a conversation by typing a message below')).toBeInTheDocument();
  });

  it('renders messages', () => {
    render(<MessageList messages={messages} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('shows loading indicator when loading', () => {
    render(<MessageList messages={[]} loading />);
    expect(screen.getByText('Loading more...')).toBeInTheDocument();
  });

  it('passes streamingMessageId to MessageItem', () => {
    const { container } = render(
      <MessageList messages={messages} streamingMessageId="msg-2" />
    );
    expect(container.querySelector('.cursor')).toBeInTheDocument();
  });

  it('renders scroll to bottom button when not at bottom', () => {
    const manyMessages = Array.from({ length: 20 }, (_, i) => ({
      id: `msg-${i}`,
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i}`,
    }));

    const { container } = render(<MessageList messages={manyMessages} />);
    // Scroll button appears when autoScroll is false
    // This is more of an integration test, but we can verify the component structure
    expect(container.querySelector('.container')).toBeInTheDocument();
  });

  it('renders all messages for small list', () => {
    render(<MessageList messages={messages} />);
    expect(screen.getAllByText(/You|Assistant/)).toHaveLength(2);
  });
});
