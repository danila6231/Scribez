// Test utility for debugging diff application in the browser
export function testDiffApplication() {
  console.log('=== Testing Diff Application ===');
  
  // Test case 1: Simple replacements
  const test1 = {
    original: "The quick brown fox jumps over the lazy dog.",
    changes: [
      {
        type: "replace",
        start_pos: 4,
        end_pos: 9,
        old_text: "quick",
        new_text: "slow"
      },
      {
        type: "replace",
        start_pos: 20,
        end_pos: 25,
        old_text: "jumps",
        new_text: "leaps"
      },
      {
        type: "replace",
        start_pos: 40,
        end_pos: 44,
        old_text: "dog.",
        new_text: "cat."
      }
    ],
    expected: "The slow brown fox leaps over the lazy cat."
  };
  
  const result1 = applyChanges(test1.original, test1.changes);
  console.log('Test 1 - Simple replacements:');
  console.log('Original:', test1.original);
  console.log('Result:', result1);
  console.log('Expected:', test1.expected);
  console.log('Pass:', result1 === test1.expected);
  console.log('');
  
  // Test case 2: Insertions
  const test2 = {
    original: "The fox jumps.",
    changes: [
      {
        type: "insert",
        start_pos: 4,
        end_pos: 4,
        new_text: "quick brown "
      },
      {
        type: "insert",
        start_pos: 13,
        end_pos: 13,
        new_text: " high"
      }
    ],
    expected: "The quick brown fox jumps high."
  };
  
  const result2 = applyChanges(test2.original, test2.changes);
  console.log('Test 2 - Insertions:');
  console.log('Original:', test2.original);
  console.log('Result:', result2);
  console.log('Expected:', test2.expected);
  console.log('Pass:', result2 === test2.expected);
  console.log('');
  
  // Test case 3: Deletions
  const test3 = {
    original: "The very quick brown fox jumps.",
    changes: [
      {
        type: "delete",
        start_pos: 4,
        end_pos: 20,
        old_text: "very quick brown"
      }
    ],
    expected: "The  fox jumps."
  };
  
  const result3 = applyChanges(test3.original, test3.changes);
  console.log('Test 3 - Deletions:');
  console.log('Original:', test3.original);
  console.log('Result:', result3);
  console.log('Expected:', test3.expected);
  console.log('Pass:', result3 === test3.expected);
  console.log('');
  
  // Test case 4: Mixed changes applied selectively
  const test4 = {
    original: "The quick brown fox jumps over the lazy dog.",
    changes: [
      {
        type: "replace",
        start_pos: 4,
        end_pos: 9,
        old_text: "quick",
        new_text: "slow"
      },
      {
        type: "replace",
        start_pos: 40,
        end_pos: 44,
        old_text: "dog.",
        new_text: "cat."
      }
    ],
    expected: "The slow brown fox jumps over the lazy cat."
  };
  
  const result4 = applyChanges(test4.original, test4.changes);
  console.log('Test 4 - Selective changes:');
  console.log('Original:', test4.original);
  console.log('Applied changes 0 and 2 (skipping 1)');
  console.log('Result:', result4);
  console.log('Expected:', test4.expected);
  console.log('Pass:', result4 === test4.expected);
}

function applyChanges(originalText, changes) {
  if (!changes || changes.length === 0) {
    return originalText;
  }
  
  // Sort changes by position (deletions/replacements before insertions at same position)
  const sortedChanges = [...changes].sort((a, b) => {
    // First by start position (reverse order for processing)
    if (a.start_pos !== b.start_pos) {
      return b.start_pos - a.start_pos;
    }
    // Then prioritize deletes/replaces over inserts
    const typeOrder = { 'delete': 0, 'replace': 0, 'insert': 1 };
    return typeOrder[a.type] - typeOrder[b.type];
  });
  
  // Apply changes from end to beginning
  let result = originalText;
  
  sortedChanges.forEach(change => {
    if (change.type === 'delete') {
      result = result.substring(0, change.start_pos) + result.substring(change.end_pos);
    } else if (change.type === 'insert') {
      result = result.substring(0, change.start_pos) + change.new_text + result.substring(change.start_pos);
    } else if (change.type === 'replace') {
      result = result.substring(0, change.start_pos) + change.new_text + result.substring(change.end_pos);
    }
  });
  
  return result;
}

// Export for use in browser console
window.testDiffApplication = testDiffApplication; 