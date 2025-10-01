# Requirements Document

## Introduction

This feature enables the expense tracker app to automatically detect financial transactions from SMS messages and present them to users via overlay popups for quick addition to their expense tracking. The system will monitor incoming SMS messages, parse financial information using natural language processing, and display a confirmation popup similar to TrueCaller's overlay functionality when money-related messages are detected.

## Requirements

### Requirement 1

**User Story:** As a user, I want the app to automatically read my SMS messages so that I can capture financial transactions without manual entry.

#### Acceptance Criteria

1. WHEN the app is installed THEN the system SHALL request SMS read permissions from the user
2. WHEN SMS read permission is granted THEN the system SHALL monitor incoming SMS messages in real-time
3. WHEN SMS read permission is denied THEN the system SHALL display a message explaining the feature limitation
4. WHEN the app is running in background THEN the system SHALL continue monitoring SMS messages

### Requirement 2

**User Story:** As a user, I want the app to identify money-related SMS messages so that only relevant financial information is processed.

#### Acceptance Criteria

1. WHEN an SMS message is received THEN the system SHALL analyze the message content for financial keywords
2. WHEN a message contains currency symbols, amounts, or banking terms THEN the system SHALL classify it as a financial message
3. WHEN a message contains words like "debited", "credited", "balance", "transaction", "payment" THEN the system SHALL flag it for processing
4. WHEN a message is from known banking/financial service senders THEN the system SHALL prioritize it for analysis
5. WHEN a message does not contain financial indicators THEN the system SHALL ignore it

### Requirement 3

**User Story:** As a user, I want the app to extract transaction details from SMS messages so that accurate financial data is captured.

#### Acceptance Criteria

1. WHEN a financial SMS is detected THEN the system SHALL extract the transaction amount
2. WHEN parsing the message THEN the system SHALL determine if the transaction is income (credit/deposit) or expense (debit/withdrawal)
3. WHEN available in the message THEN the system SHALL extract the merchant/sender name
4. WHEN available in the message THEN the system SHALL extract the account balance
5. WHEN available in the message THEN the system SHALL extract the transaction date and time
6. WHEN extraction fails for critical data THEN the system SHALL mark fields as "unknown" for user input

### Requirement 4

**User Story:** As a user, I want to see a popup overlay when financial transactions are detected so that I can quickly review and add them to my expense tracker.

#### Acceptance Criteria

1. WHEN a financial transaction is parsed THEN the system SHALL display an overlay popup from the bottom of the screen
2. WHEN the popup appears THEN it SHALL display over other apps similar to TrueCaller functionality
3. WHEN the popup is shown THEN it SHALL contain the extracted transaction details (amount, type, merchant, balance)
4. WHEN the popup is displayed THEN it SHALL provide options to "Add Transaction" or "Dismiss"
5. WHEN the popup appears THEN it SHALL auto-dismiss after 30 seconds if no action is taken

### Requirement 5

**User Story:** As a user, I want to customize transaction details before adding them so that I can ensure accuracy and proper categorization.

#### Acceptance Criteria

1. WHEN the popup is displayed THEN the system SHALL allow editing of the transaction title
2. WHEN the popup is shown THEN the system SHALL provide category selection buttons
3. WHEN a category is selected THEN the system SHALL highlight the selected category
4. WHEN transaction details are incomplete THEN the system SHALL allow manual input of missing fields
5. WHEN "Add Transaction" is clicked THEN the system SHALL validate required fields before saving

### Requirement 6

**User Story:** As a user, I want the app to work seamlessly with system overlay permissions so that popups can appear over other apps.

#### Acceptance Criteria

1. WHEN the app is first launched THEN the system SHALL request "Display over other apps" permission
2. WHEN overlay permission is granted THEN the system SHALL enable popup functionality
3. WHEN overlay permission is denied THEN the system SHALL show in-app notifications instead of overlays
4. WHEN the device is locked THEN the system SHALL not display overlay popups
5. WHEN another overlay is active THEN the system SHALL queue the popup for later display

### Requirement 7

**User Story:** As a user, I want the SMS parsing to be accurate across different bank message formats so that transactions from all my accounts are captured.

#### Acceptance Criteria

1. WHEN messages are from different banks THEN the system SHALL handle varying message formats
2. WHEN parsing amounts THEN the system SHALL correctly identify currency symbols and decimal places
3. WHEN processing transaction types THEN the system SHALL recognize various terms for debits and credits
4. WHEN extracting merchant names THEN the system SHALL clean up formatting and abbreviations
5. WHEN balance information is present THEN the system SHALL extract and format it correctly

### Requirement 8

**User Story:** As a user, I want to control SMS monitoring settings so that I can manage privacy and performance.

#### Acceptance Criteria

1. WHEN in app settings THEN the user SHALL be able to enable/disable SMS monitoring
2. WHEN SMS monitoring is disabled THEN the system SHALL stop processing messages immediately
3. WHEN in settings THEN the user SHALL be able to view and manage trusted sender numbers
4. WHEN in settings THEN the user SHALL be able to set popup display duration
5. WHEN in settings THEN the user SHALL be able to choose between overlay and in-app notifications