const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const createTransaction = async (transactionData, userId, accountId) => {
  try {
    const response = await fetch(`${API_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        account_id: accountId,
        title: transactionData.title,
        amount: transactionData.amount,
        category_id: transactionData.category_id,
        source: transactionData.source || 'sms', // Default to sms if not provided
        sms_id: transactionData.smsId || null,
        confidence: transactionData.confidence || null,
        // Add other fields as necessary
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create transaction');
    }

    const data = await response.json();
    console.log('Transaction created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

export const reportIncorrectExtraction = async (rawMessage, parsedTransaction, userId) => {
  try {
    const response = await fetch(`${API_URL}/feedback/incorrect-extraction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        raw_message: rawMessage,
        parsed_data: parsedTransaction,
        // Potentially add other context like app version, device info
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to report incorrect extraction');
    }

    const data = await response.json();
    console.log('Incorrect extraction reported successfully:', data);
    return data;
  } catch (error) {
    console.error('Error reporting incorrect extraction:', error);
    throw error;
  }
};
