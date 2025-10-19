import React from 'react';
import { render, screen } from '@testing-library/react';
import Card from '../components/Card';

describe('Card Component', () => {
  it('should render children correctly', () => {
    render(
      <Card>
        <div>Test Content</div>
      </Card>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <Card className="custom-class">
        <div>Content</div>
      </Card>
    );

    const card = container.firstChild;
    expect(card).toHaveClass('custom-class');
  });

  it('should apply onClick handler', () => {
    const handleClick = jest.fn();
    render(
      <Card onClick={handleClick}>
        <div>Clickable Content</div>
      </Card>
    );

    const card = screen.getByText('Clickable Content').parentElement;
    card?.click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
