import { render, screen } from '@testing-library/react';
import MessageItem from './MessageItem';

describe('MessageItem', () => {
  const userMessage = {
    id: 'msg-1',
    role: 'user',
    content: 'Hello, world!',
    timestamp: '2024-01-01T12:00:00Z',
  };

  const assistantMessage = {
    id: 'msg-2',
    role: 'assistant',
    content: 'Hi there!',
    timestamp: '2024-01-01T12:01:00Z',
  };

  it('renders user message correctly', () => {
    render(<MessageItem message={userMessage} />);
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('Hello, world!')).toBeInTheDocument();
  });

  it('renders assistant message correctly', () => {
    render(<MessageItem message={assistantMessage} />);
    expect(screen.getByText('Assistant')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('shows streaming cursor when isStreaming is true', () => {
    const { container } = render(
      <MessageItem message={assistantMessage} isStreaming />
    );
    expect(container.querySelector('.cursor')).toBeInTheDocument();
  });

  it('renders error message when present', () => {
    const errorMessage = { ...userMessage, error: 'Something went wrong' };
    render(<MessageItem message={errorMessage} />);
    expect(screen.getByText('Error: Something went wrong')).toBeInTheDocument();
  });

  it('renders code blocks safely', () => {
    const codeMessage = {
      id: 'msg-3',
      role: 'assistant',
      content: '```javascript\nconsole.log("test");\n```',
    };
    render(<MessageItem message={codeMessage} />);
    expect(screen.getByText('console.log("test");')).toBeInTheDocument();
  });

  it('renders inline code safely', () => {
    const inlineCodeMessage = {
      id: 'msg-4',
      role: 'assistant',
      content: 'Use `npm install` to install',
    };
    render(<MessageItem message={inlineCodeMessage} />);
    expect(screen.getByText('npm install')).toBeInTheDocument();
  });

  it('renders bold text', () => {
    const boldMessage = {
      id: 'msg-5',
      role: 'assistant',
      content: 'This is **bold** text',
    };
    render(<MessageItem message={boldMessage} />);
    expect(screen.getByText('bold')).toBeInTheDocument();
  });

  it('renders italic text', () => {
    const italicMessage = {
      id: 'msg-6',
      role: 'assistant',
      content: 'This is *italic* text',
    };
    render(<MessageItem message={italicMessage} />);
    expect(screen.getByText('italic')).toBeInTheDocument();
  });

  it('prevents XSS by not rendering HTML', () => {
    const xssMessage = {
      id: 'msg-7',
      role: 'user',
      content: '<script>alert("xss")</script>',
    };
    const { container } = render(<MessageItem message={xssMessage} />);
    expect(container.querySelector('script')).not.toBeInTheDocument();
    expect(screen.getByText('<script>alert("xss")</script>')).toBeInTheDocument();
  });

  it('handles empty content', () => {
    const emptyMessage = {
      id: 'msg-8',
      role: 'assistant',
      content: '',
    };
    const { container } = render(<MessageItem message={emptyMessage} />);
    expect(container.querySelector('.body')).toBeInTheDocument();
  });

  it('sets data-message-id attribute', () => {
    const { container } = render(<MessageItem message={userMessage} />);
    expect(container.firstChild).toHaveAttribute('data-message-id', 'msg-1');
  });
});
