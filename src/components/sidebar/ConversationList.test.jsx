import { render, screen } from '@testing-library/react';
import ConversationList from './ConversationList';

describe('ConversationList', () => {
  const conversations = [
    { id: 'conv-1', title: 'Chat 1', updatedAt: new Date().toISOString() },
    { id: 'conv-2', title: 'Chat 2', updatedAt: new Date().toISOString() },
  ];

  it('renders empty state when no conversations', () => {
    render(<ConversationList conversations={[]} />);
    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
    expect(screen.getByText('Start a new chat to begin')).toBeInTheDocument();
  });

  it('renders loading skeleton when loading', () => {
    const { container } = render(<ConversationList loading />);
    expect(container.querySelectorAll('.skeleton')).toHaveLength(3);
  });

  it('renders conversations', () => {
    render(<ConversationList conversations={conversations} />);
    expect(screen.getByText('Chat 1')).toBeInTheDocument();
    expect(screen.getByText('Chat 2')).toBeInTheDocument();
  });

  it('marks active conversation', () => {
    const { container } = render(
      <ConversationList conversations={conversations} activeId="conv-1" />
    );
    const items = container.querySelectorAll('.item');
    expect(items[0]).toHaveClass('active');
    expect(items[1]).not.toHaveClass('active');
  });

  it('passes event handlers to items', () => {
    const onSelect = jest.fn();
    const onDelete = jest.fn();
    const onEdit = jest.fn();

    render(
      <ConversationList
        conversations={conversations}
        onSelect={onSelect}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    );

    expect(screen.getAllByLabelText('Delete conversation')).toHaveLength(2);
    expect(screen.getAllByLabelText('Edit conversation')).toHaveLength(2);
  });
});
