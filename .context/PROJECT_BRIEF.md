# Wedding Thank You Card Generator - Project Brief

## Overview

A desktop application that helps users generate personalized thank you cards for wedding gifts using AI (OpenRouter). Users import a CSV of gift records, generate AI-assisted thank you messages for each, review/edit them, copy the message to paste into vendor systems, and mark them as completed.

## Input Data

CSV file with columns:

- Title, First Name, Last Name
- Partner Title, Partner First, Partner Last
- Company
- Address1, Address2, City, State, Zip, Country
- Gift description and value (from gift records)

## Core User Flow

1. **Import** - User loads CSV file with gift/recipient data
2. **Configure** - User enters OpenRouter API key and selects model
3. **Generate** - For each recipient, user can:
   - View recipient info, gift details, and value
   - Add optional context/prompt (e.g., personal anecdote)
   - Generate AI thank you message
   - Edit manually or request AI regeneration with modifications
   - Copy message to clipboard for pasting into vendor/card service
   - Mark as completed once message has been submitted
4. **Export** - Export CSV with addresses and completed messages (optional backup)

## UI Structure

### Sidebar (Recipient List)

- Scrollable list of all recipients (show name)
- Status indicators per recipient:
  - ⚠️ Warning icon: No card generated yet
  - 🔵 Blue dot: Card exists but not yet completed
  - ✅ Checkmark: Card completed (message copied and submitted to vendor)
  - 🏠 Missing address indicator (shown alongside other status)
- Click to navigate to any recipient
- Show loading spinner on currently-generating item

### Main Panel (Card Editor)

- **Recipient Info Section**
  - Names (recipient + partner if applicable)
  - Full address (or editable address fields if missing)
  - Gift description and value
  - **Missing Address Warning** - Yellow banner if address incomplete, with inline editing

- **Generation Section**
  - Text area for additional context/prompt
  - "Generate" button
  - Loading state while AI generates

- **Message Section**
  - Editable text area with generated message
  - "Regenerate with changes" option (feed current message + modification request to AI)
  - **"Copy Message" button** - Copies message to clipboard with visual feedback
  - "Mark Complete" / "Mark Incomplete" toggle button
  - **Note**: "Mark Complete" button is disabled if address is missing

- **Navigation**
  - Previous / Next buttons
  - Progress indicator (e.g., "5 of 47 completed")

## AI Integration (OpenRouter)

### Initial Generation

```
System prompt: [Base thank you card instructions]
User prompt:
- Recipient: {name}
- Gift: {gift description}
- Value: {value}
- Additional context: {user's custom prompt}
```

### Regeneration

```
System prompt: [Base thank you card instructions]
User prompt:
- Original message: {previous message}
- Modification request: {user's edit instructions}
```

### Output Format

- Just the message body (no "Dear X" or signature)
- Appropriate length for a thank you card

## Data Persistence

### Session File (`.json`)

```json
{
  "openRouterApiKey": "encrypted or stored separately",
  "model": "anthropic/claude-3-haiku",
  "recipients": [
    {
      "id": "uuid",
      "title": "Mr.",
      "firstName": "John",
      "lastName": "Smith",
      "partnerTitle": "Mrs.",
      "partnerFirst": "Jane",
      "partnerLast": "Smith",
      "company": "",
      "address1": "123 Main St",
      "address2": "",
      "city": "Springfield",
      "state": "IL",
      "zip": "62701",
      "country": "USA",
      "gift": "KitchenAid Mixer",
      "giftValue": "$350",
      "customPrompt": "John is my college roommate",
      "generatedMessage": "Thank you so much for...",
      "isCompleted": false,
      "lastModified": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Auto-save

- Save to JSON after each change (generation, edit, completion status)
- Load previous session on app start if file exists

## Export Format

CSV columns:

- Title, First Name, Last Name
- Partner Title, Partner First, Partner Last
- Company
- Address1, Address2, City, State, Zip, Country
- Message (plaintext body only, no salutation or signature)

## Technical Considerations

### OpenRouter API

- User provides their own API key
- Allow model selection (default to cost-effective model)
- Handle rate limits and errors gracefully
- Show token usage / cost estimate (optional)

### State Management

- React Query for API calls
- Local state or context for current session
- File system for persistence (via Electron IPC)

### New IPC Handlers Needed

- `file.openCsv()` - Open file dialog, parse CSV
- `file.saveSession(data)` - Save JSON session file
- `file.loadSession()` - Load existing session
- `file.exportCsv(data)` - Export final CSV

## MVP Scope

1. CSV import with column mapping
2. Sidebar with recipient list and status icons
3. Main editor with recipient info display
4. OpenRouter integration for generation
5. Manual editing of messages
6. **Copy message to clipboard** with visual confirmation
7. Mark complete/incomplete functionality
8. JSON persistence (auto-save)
9. CSV export of completed messages (optional backup)

## Future Enhancements

- Batch generation (generate all pending)
- Custom system prompt editing
- Multiple export formats (PDF, mail merge)
- Undo/redo for edits
- Dark mode support (already in template)
- Print preview
