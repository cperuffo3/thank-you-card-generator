# Wedding Thank You Card Generator - Implementation Plan

## Overview

Transform the existing Electron + React template into a wedding thank you card generator app. The user will go through 4 linear pages to import CSV data, configure OpenRouter API, and generate/approve personalized thank you messages.

---

## Phase 1: Strip Unused Features ✅ COMPLETE

### Files to DELETE

```
src/localization/           # Entire folder (i18n.ts, langs.ts, language.ts)
src/components/lang-toggle.tsx
src/components/toggle-theme.tsx
src/components/navigation-menu.tsx
src/components/ui/toggle.tsx
src/components/ui/toggle-group.tsx
src/components/ui/navigation-menu.tsx
src/routes/second.tsx
src/actions/language.ts
src/tests/unit/sum.test.ts
src/tests/unit/toggle-theme.test.tsx
src/tests/e2e/example.test.ts
```

### Files to MODIFY

- `src/App.tsx` - Remove i18n imports and language sync
- `src/routes/index.tsx` - Clear and rebuild as Welcome page
- `src/layouts/base-layout.tsx` - Update title to "Wedding Thank You Cards"
- `package.json` - Remove i18next, react-i18next; update name/description

### Dependencies to REMOVE from package.json

```
"i18next": "^25.7.3"
"react-i18next": "^16.5.0"
```

---

## Phase 2: Add Required shadcn Components ✅ COMPLETE

Run shadcn CLI to add:

```bash
npx shadcn@latest add card input textarea label select progress scroll-area separator badge alert dialog
```

These provide:

- `Card` - For recipient info and message containers
- `Input` / `Textarea` - For API key, custom prompts, message editing
- `Label` - Form labels
- `Select` - Model selection dropdown
- `Progress` - Show generation progress
- `ScrollArea` - Recipient sidebar scrolling
- `Separator` - Visual dividers
- `Badge` - Status indicators
- `Alert` - Error messages
- `Dialog` - Confirmations

---

## Phase 3: Create Type Definitions ✅ COMPLETE

### `src/types/recipient.ts`

```typescript
export interface Recipient {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  partnerTitle: string;
  partnerFirst: string;
  partnerLast: string;
  company: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  gift: string;
  giftValue: string;
  customPrompt: string;
  generatedMessage: string;
  isApproved: boolean;
  lastModified: string;
}

export interface Session {
  openRouterApiKey: string;
  model: string;
  recipients: Recipient[];
  filePath?: string; // Where session was last saved
}
```

---

## Phase 4: Create File IPC Handlers ✅ COMPLETE

### `src/ipc/file/schemas.ts`

- `saveSessionInputSchema` - Session data for saving
- `exportCsvInputSchema` - Data for CSV export

### `src/ipc/file/handlers.ts`

- `openCsv()` - Show open dialog, read & parse CSV, return data
- `saveSession(data)` - Save JSON to file (with dialog or existing path)
- `loadSession()` - Show open dialog, read JSON, return session
- `exportCsv(data)` - Export approved recipients to CSV

### `src/ipc/file/index.ts`

- Export all handlers

### Update `src/ipc/router.ts`

- Add `file` handlers to router

### `src/actions/file.ts`

- Wrapper functions for renderer to call file IPC methods

---

## Phase 5: Create OpenRouter Service ✅ COMPLETE

### `src/services/openrouter.ts`

Functions to call OpenRouter API using @openrouter/sdk:

- `generateMessage(options)` - Initial generation with recipient context
- `regenerateMessage(options)` - Refinement with previous message and modification request
- `fetchAvailableModels(apiKey)` - Get model list (filters to popular providers)
- `getDefaultModels()` - Returns hardcoded list of popular models
- `testConnection(apiKey)` - Validates API key works

System prompt template for thank you card generation included.

---

## Phase 6: Create State Management ✅ COMPLETE

### `src/context/session-context.tsx`

React Context for session state:

- `session: Session | null`
- `setSession(session)`
- `updateRecipient(id, updates)`
- `currentRecipientId: string | null`
- `setCurrentRecipientId(id)`
- `saveCurrentSession(saveAs?)` - Persists session to file
- `isDirty: boolean` - Tracks unsaved changes

Provider wraps the app via `__root.tsx`, persists to file on demand.

---

## Phase 7: Create Route Pages ✅ COMPLETE

### Route Structure

```
src/routes/
  __root.tsx          # Root layout (keep, update)
  index.tsx           # Welcome page (load/new session)
  import.tsx          # CSV import page
  configure.tsx       # API key + model selection
  editor.tsx          # Main card editor with sidebar
```

### Page 1: Welcome (`index.tsx`)

- App title and description
- "Start New Session" button - navigates to /import
- "Load Existing Session" button - opens file dialog, loads JSON, navigates to /editor
- Simple, centered layout

### Page 2: Import CSV (`import.tsx`)

- "Select CSV File" button - opens file dialog
- Preview of imported data (table showing first few rows)
- Column mapping UI (if needed, or auto-detect)
- "Continue" button - navigates to /configure
- Store parsed recipients in session context

### Page 3: Configure API (`configure.tsx`)

- OpenRouter API key input (password field with show/hide)
- Model selection dropdown (preset list of popular models)
- "Test Connection" button (optional)
- "Start Editing" button - navigates to /editor
- Link to OpenRouter to get API key

### Page 4: Card Editor (`editor.tsx`)

- **Left Sidebar**: Scrollable recipient list with status icons
  - Warning icon: No message generated
  - Blue dot: Message exists, not approved
  - Checkmark: Approved
  - Click to select recipient
- **Main Panel**:
  - Recipient info display (name, address, gift, value)
  - Custom prompt textarea
  - "Generate" button
  - Generated message textarea (editable)
  - "Regenerate" button (with modification input)
  - "Approve" / "Unapprove" toggle
- **Footer**:
  - Previous / Next navigation buttons
  - Progress indicator ("5 of 47 approved")
  - "Export CSV" button
  - "Save Session" button

---

## Phase 8: Implement Card Generation Flow

### Generate Message

1. User clicks "Generate" button
2. Show loading spinner
3. Call `openrouter.generateMessage()` with recipient info + custom prompt
4. Display result in textarea
5. Update recipient in context (auto-save to file)

### Regenerate Message

1. User types modification request
2. User clicks "Regenerate"
3. Show loading spinner
4. Call `openrouter.regenerateMessage()` with current message + modification
5. Update textarea and context

### Approve/Unapprove

1. Toggle button updates `isApproved` in context
2. Sidebar icon updates automatically
3. Auto-save to file

### Export

1. User clicks "Export CSV"
2. Filter to approved recipients only
3. Generate CSV with address + message columns
4. Show save dialog
5. Write file

---

## Implementation Order

1. ✅ **Phase 1**: Strip unused features (clean slate)
2. ✅ **Phase 2**: Add shadcn components
3. **Phase 3**: Create types
4. **Phase 4**: Create file IPC handlers
5. **Phase 6**: Create session context
6. **Phase 7.1**: Create Welcome page
7. **Phase 7.2**: Create Import page
8. **Phase 7.3**: Create Configure page
9. **Phase 7.4**: Create Editor page (basic layout)
10. **Phase 5**: Create OpenRouter service
11. **Phase 8**: Wire up generation flow

---

## Critical Files Summary

### New Files

| File                                   | Purpose                                         |
| -------------------------------------- | ----------------------------------------------- |
| `src/types/recipient.ts`               | TypeScript interfaces for Recipient and Session |
| `src/ipc/file/handlers.ts`             | IPC handlers for file operations                |
| `src/ipc/file/schemas.ts`              | Zod schemas for file handler inputs             |
| `src/ipc/file/index.ts`                | Export file handlers                            |
| `src/actions/file.ts`                  | Renderer-side file action wrappers              |
| `src/services/openrouter.ts`           | OpenRouter API integration                      |
| `src/context/session-context.tsx`      | Session state management                        |
| `src/routes/import.tsx`                | CSV import page                                 |
| `src/routes/configure.tsx`             | API configuration page                          |
| `src/routes/editor.tsx`                | Main card editor page                           |
| `src/components/recipient-sidebar.tsx` | Recipient list sidebar                          |
| `src/components/recipient-card.tsx`    | Recipient info display                          |
| `src/components/message-editor.tsx`    | Message generation/editing UI                   |

### Modified Files

| File                          | Changes                              |
| ----------------------------- | ------------------------------------ |
| `src/App.tsx`                 | Remove i18n, simplify to just router |
| `src/routes/index.tsx`        | Rebuild as Welcome page              |
| `src/routes/__root.tsx`       | Add SessionProvider wrapper          |
| `src/layouts/base-layout.tsx` | Update app title                     |
| `src/ipc/router.ts`           | Add file handlers                    |
| `package.json`                | Update name, remove i18n deps        |

---

## Notes

- **Linear flow**: Users cannot go back to previous pages once completed
- **API key storage**: Saved in session JSON file (user preference)
- **Auto-save**: Session saves after each change
- **Theme**: Keep existing dark mode system intact
- **Tests**: Removed initially, can add later for critical paths
