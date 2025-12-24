import { render, screen, fireEvent } from '@testing-library/react';
import ConversationItem from './ConversationItem';

describe('ConversationItem', () => {
  const conversation = {
    id: 'conv-1',
    title: 'Test Conversation',
    lastMessage: 'Last message preview',
    updatedAt: new Date().toISOString(),
  };

  it('renders conversation title', () => {
    render(<ConversationItem conversation={conversation} />);
    expect(screen.getByText('Test Conversation')).toBeInTheDocument();
  });

  it('renders "New Chat" when no title', () => {
    render(<ConversationItem conversation={{ ...conversation, title: '' }} />);
    expect(screen.getByText('New Chat')).toBeInTheDocument();
  });

  it('renders last message preview', () => {
    render(<ConversationItem conversation={conversation} />);
    expect(screen.getByText('Last message preview')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<ConversationItem conversation={conversation} onClick={handleClick} />);

    fireEvent.click(screen.getByText('Test Conversation'));
    expect(handleClick).toHaveBeenCalledWith('conv-1');
  });

  it('calls onClick on Enter key', () => {
    const handleClick = jest.fn();
    render(<ConversationItem conversation={conversation} onClick={handleClick} />);

    const item = screen.getByRole('button');
    fireEvent.keyDown(item, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledWith('conv-1');
  });

  it('applies active class when isActive', () => {
    const { container } = render(
      <ConversationItem conversation={conversation} isActive />
    );
    expect(container.firstChild).toHaveClass('active');
  });

  it('calls onDelete when delete button clicked', () => {
    const handleDelete = jest.fn();
    render(
      <ConversationItem conversation={conversation} onDelete={handleDelete} />
    );

    fireEvent.click(screen.getByLabelText('Delete conversation'));
    expect(handleDelete).toHaveBeenCalledWith('conv-1');
  });

  it('calls onEdit when edit button clicked', () => {
    const handleEdit = jest.fn();
    render(
      <ConversationItem conversation={conversation} onEdit={handleEdit} />
    );

    fireEvent.click(screen.getByLabelText('Edit conversation'));
    expect(handleEdit).toHaveBeenCalledWith(conversation);
  });

  it('stops propagation on delete click', () => {
    const handleClick = jest.fn();
    const handleDelete = jest.fn();
    render(
      <ConversationItem
        conversation={conversation}
        onClick={handleClick}
        onDelete={handleDelete}
      />
    );

    fireEvent.click(screen.getByLabelText('Delete conversation'));
    expect(handleDelete).toHaveBeenCalled();
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('formats time for today', () => {
    const today = new Date();
    render(
      <ConversationItem
        conversation={{ ...conversation, updatedAt: today.toISOString() }}
      />
    );
    // Should show time format like "12:00"
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
  });
});
