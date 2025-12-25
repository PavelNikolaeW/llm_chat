import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from './Sidebar';

const renderWithRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('Sidebar', () => {
  const conversations = [
    { id: 'conv-1', title: 'Chat 1', updatedAt: new Date().toISOString() },
  ];

  it('renders header with title', () => {
    renderWithRouter(<Sidebar />);
    expect(screen.getByText('Chats')).toBeInTheDocument();
  });

  it('renders New button', () => {
    renderWithRouter(<Sidebar />);
    expect(screen.getByText('+ New')).toBeInTheDocument();
  });

  it('calls onCreateConversation when New clicked', () => {
    const handleCreate = jest.fn();
    renderWithRouter(<Sidebar onCreateConversation={handleCreate} />);

    fireEvent.click(screen.getByText('+ New'));
    expect(handleCreate).toHaveBeenCalledTimes(1);
  });

  it('renders conversations', () => {
    renderWithRouter(<Sidebar conversations={conversations} />);
    expect(screen.getByText('Chat 1')).toBeInTheDocument();
  });

  it('applies open class when isOpen is true', () => {
    const { container } = renderWithRouter(<Sidebar isOpen />);
    expect(container.querySelector('.sidebar')).toHaveClass('open');
  });

  it('renders toggle button when onToggle provided', () => {
    renderWithRouter(<Sidebar onToggle={jest.fn()} isOpen />);
    expect(screen.getByLabelText('Close sidebar')).toBeInTheDocument();
  });

  it('calls onToggle when toggle clicked', () => {
    const handleToggle = jest.fn();
    renderWithRouter(<Sidebar onToggle={handleToggle} isOpen />);

    fireEvent.click(screen.getByLabelText('Close sidebar'));
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it('shows delete confirmation modal', () => {
    const handleDelete = jest.fn();
    renderWithRouter(
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
    renderWithRouter(
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
    renderWithRouter(
      <Sidebar
        conversations={conversations}
        onDeleteConversation={jest.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText('Delete conversation'));
    fireEvent.click(screen.getByText('Cancel'));

    expect(screen.queryByText('Delete Conversation')).not.toBeInTheDocument();
  });

  it('renders settings button', () => {
    renderWithRouter(<Sidebar />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });
});
