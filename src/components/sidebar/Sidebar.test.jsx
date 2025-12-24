import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from './Sidebar';

describe('Sidebar', () => {
  const conversations = [
    { id: 'conv-1', title: 'Chat 1', updatedAt: new Date().toISOString() },
  ];

  it('renders header with title', () => {
    render(<Sidebar />);
    expect(screen.getByText('Chats')).toBeInTheDocument();
  });

  it('renders New button', () => {
    render(<Sidebar />);
    expect(screen.getByText('+ New')).toBeInTheDocument();
  });

  it('calls onCreateConversation when New clicked', () => {
    const handleCreate = jest.fn();
    render(<Sidebar onCreateConversation={handleCreate} />);

    fireEvent.click(screen.getByText('+ New'));
    expect(handleCreate).toHaveBeenCalledTimes(1);
  });

  it('renders conversations', () => {
    render(<Sidebar conversations={conversations} />);
    expect(screen.getByText('Chat 1')).toBeInTheDocument();
  });

  it('applies open class when isOpen is true', () => {
    const { container } = render(<Sidebar isOpen />);
    expect(container.querySelector('.sidebar')).toHaveClass('open');
  });

  it('renders toggle button when onToggle provided', () => {
    render(<Sidebar onToggle={jest.fn()} isOpen />);
    expect(screen.getByLabelText('Close sidebar')).toBeInTheDocument();
  });

  it('calls onToggle when toggle clicked', () => {
    const handleToggle = jest.fn();
    render(<Sidebar onToggle={handleToggle} isOpen />);

    fireEvent.click(screen.getByLabelText('Close sidebar'));
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it('shows delete confirmation modal', () => {
    const handleDelete = jest.fn();
    render(
      <Sidebar
        conversations={conversations}
        onDeleteConversation={handleDelete}
      />
    );

    fireEvent.click(screen.getByLabelText('Delete conversation'));
    expect(screen.getByText('Delete Conversation')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure/)).toBeInTheDocument();
  });

  it('confirms delete and calls onDeleteConversation', () => {
    const handleDelete = jest.fn();
    render(
      <Sidebar
        conversations={conversations}
        onDeleteConversation={handleDelete}
      />
    );

    fireEvent.click(screen.getByLabelText('Delete conversation'));
    fireEvent.click(screen.getByText('Delete'));

    expect(handleDelete).toHaveBeenCalledWith('conv-1');
  });

  it('cancels delete modal', () => {
    render(
      <Sidebar
        conversations={conversations}
        onDeleteConversation={jest.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText('Delete conversation'));
    fireEvent.click(screen.getByText('Cancel'));

    expect(screen.queryByText('Delete Conversation')).not.toBeInTheDocument();
  });
});
