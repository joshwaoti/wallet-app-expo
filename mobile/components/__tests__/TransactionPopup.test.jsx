import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Animated, Dimensions, Platform } from 'react-native';
import TransactionPopup from '../TransactionPopup';

// Mock Dimensions.get for consistent testing
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Animated: {
    ...jest.requireActual('react-native').Animated,
    timing: jest.fn(),
    Value: jest.fn(),
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })),
  },
  Platform: {
    OS: 'android',
  },
}));

// Mock expo-blur for tests
jest.mock('expo-blur', () => ({ BlurView: 'BlurView' }));

const mockTransaction = {
  amount: 49.99,
  currency: 'USD',
  type: 'expense',
  merchant: 'AMAZON.COM',
  title: 'New Headphones',
  date: new Date(),
};

const mockCategories = ['Shopping', 'Bills', 'Entertainment'];

describe('TransactionPopup', () => {
  const onAddTransactionMock = jest.fn();
  const onDismissMock = jest.fn();
  const onViewDetailsMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Reset Animated.Value to off-screen for each test
    (Animated.Value).mockImplementation(() => ({
      __getValue: jest.fn(() => Dimensions.get('window').height),
      setValue: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders correctly when visible', () => {
    const { getByText, getByDisplayValue } = render(
      <TransactionPopup
        visible={true}
        transaction={mockTransaction}
        onAddTransaction={onAddTransactionMock}
        onDismiss={onDismissMock}
        categories={mockCategories}
        userId="testUser123"
        accountId="testAccount456"
        onViewDetails={onViewDetailsMock}
      />
    );

    expect(getByText('New Transaction Detected')).toBeTruthy();
    expect(getByText('from "AMAZON.COM"')).toBeTruthy();
    expect(getByText('-$49.99')).toBeTruthy();
    expect(getByDisplayValue('New Headphones')).toBeTruthy();
    expect(getByText('Shopping')).toBeTruthy();
    expect(getByText('Add Transaction')).toBeTruthy();
    expect(getByText('Dismiss')).toBeTruthy();
    expect(getByText('View Details')).toBeTruthy();
  });

  test('does not render when not visible and animation is complete', () => {
    const { queryByText } = render(
      <TransactionPopup
        visible={false}
        transaction={mockTransaction}
        onAddTransaction={onAddTransactionMock}
        onDismiss={onDismissMock}
        categories={mockCategories}
        userId="testUser123"
        accountId="testAccount456"
        onViewDetails={onViewDetailsMock}
      />
    );
    expect(queryByText('New Transaction Detected')).toBeNull();
  });

  test('calls onDismiss when dismiss button is pressed', () => {
    const { getByText } = render(
      <TransactionPopup
        visible={true}
        transaction={mockTransaction}
        onAddTransaction={onAddTransactionMock}
        onDismiss={onDismissMock}
        categories={mockCategories}
        userId="testUser123"
        accountId="testAccount456"
        onViewDetails={onViewDetailsMock}
      />
    );
    fireEvent.press(getByText('Dismiss'));
    expect(onDismissMock).toHaveBeenCalledTimes(1);
  });

  test('calls onViewDetails when View Details button is pressed', () => {
    const { getByText } = render(
      <TransactionPopup
        visible={true}
        transaction={{ ...mockTransaction, id: 'test-transaction-id' }}
        onAddTransaction={onAddTransactionMock}
        onDismiss={onDismissMock}
        categories={mockCategories}
        userId="testUser123"
        accountId="testAccount456"
        onViewDetails={onViewDetailsMock}
      />
    );
    fireEvent.press(getByText('View Details'));
    expect(onViewDetailsMock).toHaveBeenCalledTimes(1);
    expect(onViewDetailsMock).toHaveBeenCalledWith('test-transaction-id');
  });

  test('updates title on text input change', () => {
    const { getByDisplayValue } = render(
      <TransactionPopup
        visible={true}
        transaction={mockTransaction}
        onAddTransaction={onAddTransactionMock}
        onDismiss={onDismissMock}
        categories={mockCategories}
        userId="testUser123"
        accountId="testAccount456"
        onViewDetails={onViewDetailsMock}
      />
    );
    const titleInput = getByDisplayValue('New Headphones');
    fireEvent.changeText(titleInput, 'Updated Title');
    expect(titleInput.props.value).toBe('Updated Title');
  });

  test('changes selected category on button press', () => {
    const { getByText } = render(
      <TransactionPopup
        visible={true}
        transaction={mockTransaction}
        onAddTransaction={onAddTransactionMock}
        onDismiss={onDismissMock}
        categories={mockCategories}
        userId="testUser123"
        accountId="testAccount456"
        onViewDetails={onViewDetailsMock}
      />
    );

    const shoppingButton = getByText('Shopping');
    const billsButton = getByText('Bills');

    expect(shoppingButton.props.style).toContainEqual(expect.objectContaining({ backgroundColor: '#8B593E' }));
    expect(billsButton.props.style).not.toContainEqual(expect.objectContaining({ backgroundColor: '#8B593E' }));

    fireEvent.press(billsButton);

    expect(shoppingButton.props.style).not.toContainEqual(expect.objectContaining({ backgroundColor: '#8B593E' }));
    expect(billsButton.props.style).toContainEqual(expect.objectContaining({ backgroundColor: '#8B593E' }));
  });

  test('calls onAddTransaction with updated data and user/account IDs when add button is pressed', () => {
    const { getByText, getByDisplayValue } = render(
      <TransactionPopup
        visible={true}
        transaction={mockTransaction}
        onAddTransaction={onAddTransactionMock}
        onDismiss={onDismissMock}
        categories={mockCategories}
        userId="testUser123"
        accountId="testAccount456"
        onViewDetails={onViewDetailsMock}
      />
    );

    const titleInput = getByDisplayValue('New Headphones');
    fireEvent.changeText(titleInput, 'Custom Title');

    fireEvent.press(getByText('Bills'));

    fireEvent.press(getByText('Add Transaction'));

    expect(onAddTransactionMock).toHaveBeenCalledTimes(1);
    expect(onAddTransactionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        ...mockTransaction,
        title: 'Custom Title',
        category: 'Bills',
      }),
      "testUser123",
      "testAccount456"
    );
  });

  test('implements slide-up animation when visible becomes true', () => {
    const AnimatedTimingMock = Animated.timing;
    const AnimatedValueMock = Animated.Value;
    const mockSlideAnim = { __getValue: jest.fn(() => Dimensions.get('window').height), setValue: jest.fn() };
    AnimatedValueMock.mockReturnValue(mockSlideAnim);

    const { rerender } = render(
      <TransactionPopup
        visible={false}
        transaction={mockTransaction}
        onAddTransaction={onAddTransactionMock}
        onDismiss={onDismissMock}
        categories={mockCategories}
        userId="testUser123"
        accountId="testAccount456"
        onViewDetails={onViewDetailsMock}
      />
    );

    // Simulate initial state where popup is off-screen
    expect(mockSlideAnim.__getValue()).toBe(Dimensions.get('window').height);

    rerender(
      <TransactionPopup
        visible={true}
        transaction={mockTransaction}
        onAddTransaction={onAddTransactionMock}
        onDismiss={onDismissMock}
        categories={mockCategories}
        userId="testUser123"
        accountId="testAccount456"
        onViewDetails={onViewDetailsMock}
      />
    );

    expect(AnimatedTimingMock).toHaveBeenCalledTimes(1);
    expect(AnimatedTimingMock).toHaveBeenCalledWith(mockSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    });
    expect(mockSlideAnim.setValue).not.toHaveBeenCalled(); // setValue is not called by Animated.timing
  });

  test('implements slide-down animation when visible becomes false', () => {
    const AnimatedTimingMock = Animated.timing;
    const AnimatedValueMock = Animated.Value;
    const mockSlideAnim = { __getValue: jest.fn(() => 0), setValue: jest.fn() }; // Simulate initially on-screen
    AnimatedValueMock.mockReturnValue(mockSlideAnim);

    const { rerender } = render(
      <TransactionPopup
        visible={true}
        transaction={mockTransaction}
        onAddTransaction={onAddTransactionMock}
        onDismiss={onDismissMock}
        categories={mockCategories}
        userId="testUser123"
        accountId="testAccount456"
        onViewDetails={onViewDetailsMock}
      />
    );

    rerender(
      <TransactionPopup
        visible={false}
        transaction={mockTransaction}
        onAddTransaction={onAddTransactionMock}
        onDismiss={onDismissMock}
        categories={mockCategories}
        userId="testUser123"
        accountId="testAccount456"
        onViewDetails={onViewDetailsMock}
      />
    );

    expect(AnimatedTimingMock).toHaveBeenCalledTimes(2); // One for show, one for hide
    expect(AnimatedTimingMock).toHaveBeenCalledWith(mockSlideAnim, {
      toValue: Dimensions.get('window').height,
      duration: 300,
      useNativeDriver: true,
    });
  });

  test('auto-dismiss timer triggers onDismiss after duration', () => {
    jest.setSystemTime(new Date(2024, 0, 1)); // Set a fixed system time
    const { rerender } = render(
      <TransactionPopup
        visible={true}
        transaction={mockTransaction}
        onAddTransaction={onAddTransactionMock}
        onDismiss={onDismissMock}
        categories={mockCategories}
        userId="testUser123"
        accountId="testAccount456"
        onViewDetails={onViewDetailsMock}
      />
    );

    // Advance timers by 29 seconds (less than default 30)
    jest.advanceTimersByTime(29000);
    expect(onDismissMock).not.toHaveBeenCalled();

    // Advance timers by 1 more second to reach 30 seconds
    jest.advanceTimersByTime(1000);
    expect(onDismissMock).toHaveBeenCalledTimes(1);
  });

  test('auto-dismiss timer is cleared on manual dismiss', () => {
    jest.setSystemTime(new Date(2024, 0, 1));
    const { getByText } = render(
      <TransactionPopup
        visible={true}
        transaction={mockTransaction}
        onAddTransaction={onAddTransactionMock}
        onDismiss={onDismissMock}
        categories={mockCategories}
        userId="testUser123"
        accountId="testAccount456"
        onViewDetails={onViewDetailsMock}
      />
    );

    fireEvent.press(getByText('Dismiss'));
    expect(onDismissMock).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(30000); // Advance past auto-dismiss duration

    expect(onDismissMock).toHaveBeenCalledTimes(1); // Should not be called again
  });
});
