# Test Plan for Diff Acceptance Functionality

## Overview
This document outlines the test plan for verifying that both individual change acceptance and "accept all" functionality work correctly in the diff view.

## Setup
1. Backend server running on http://localhost:8000
2. Frontend server running on http://localhost:5173
3. Browser console open for debugging

## Test Cases

### Test 1: Accept All Changes
1. Create a new document with text: "The quick brown fox jumps over the lazy dog."
2. Switch to "Edit" mode
3. Request: "Change quick to slow, jumps to leaps, and dog to cat"
4. When diff view appears:
   - Verify 3 changes are shown
   - Click "Accept All"
   - Verify editor updates with all changes applied
   - Expected result: "The slow brown fox leaps over the lazy cat."

### Test 2: Individual Change Acceptance
1. Create a document with text: "The quick brown fox jumps over the lazy dog."
2. Switch to "Edit" mode
3. Request: "Change quick to slow, jumps to leaps, and dog to cat"
4. When diff view appears:
   - Accept only the first change (quick → slow)
   - Verify editor updates immediately
   - Accept the third change (dog → cat)
   - Verify editor updates with both changes
   - Expected result: "The slow brown fox jumps over the lazy cat."

### Test 3: Mixed Accept/Reject
1. Create a document with text: "Hello world. This is a test document."
2. Switch to "Edit" mode
3. Request: "Change Hello to Hi, world to there, and test to sample"
4. When diff view appears:
   - Accept first change (Hello → Hi)
   - Reject second change (world → there)
   - Accept third change (test → sample)
   - Expected result: "Hi world. This is a sample document."

### Test 4: Reject All Changes
1. Create any document
2. Request an edit
3. Click "Reject All"
4. Verify document remains unchanged

### Test 5: Close Without Saving
1. Create any document
2. Request an edit
3. Accept some changes
4. Click X or click outside the diff overlay
5. Verify document returns to original state

## Debug Commands
Run these in the browser console:

```javascript
// Test the diff application logic
window.testDiffApplication()

// Check current editor content
window.lexicalEditor.getEditorState().read(() => {
  const root = $getRoot();
  console.log('Editor content:', root.getTextContent());
});

// Check diff changes
console.log('Current diff changes:', window.diffChanges);
```

## Expected Issues Fixed
1. ✅ Individual change acceptance should now update the editor immediately
2. ✅ Accept all should apply all changes correctly
3. ✅ Rejected changes should not be applied
4. ✅ Closing the diff view should restore original content
5. ✅ State should be properly tracked for accepted/rejected changes 