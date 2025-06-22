# backend for diffing two files
import difflib
from typing import List, Dict, Any, Tuple, Optional
from enum import Enum
import re

class ChangeType(Enum):
    """Types of changes in a diff"""
    INSERT = "insert"
    DELETE = "delete"
    REPLACE = "replace"

class Change:
    """Represents a single change in the document"""
    def __init__(self,
                 change_type: ChangeType,
                 start_pos: int,
                 end_pos: int,
                 old_text: Optional[str] = None,
                 new_text: Optional[str] = None,
                 line_number: Optional[int] = None,
                 word_index: Optional[int] = None):
        self.change_type = change_type
        self.start_pos = start_pos  # Character position in document
        self.end_pos = end_pos      # Character position in document
        self.old_text = old_text
        self.new_text = new_text
        self.line_number = line_number
        self.word_index = word_index
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        result = {
            "type": self.change_type.value,
            "start_pos": self.start_pos,
            "end_pos": self.end_pos
        }
        
        if self.old_text is not None:
            result["old_text"] = self.old_text
        if self.new_text is not None:
            result["new_text"] = self.new_text
        if self.line_number is not None:
            result["line_number"] = self.line_number
        if self.word_index is not None:
            result["word_index"] = self.word_index
            
        return result

def compute_exact_diff(old_content: str, new_content: str, granularity: str = "word") -> List[Dict[str, Any]]:
    """
    Compute exact differences between two documents at word or character level.
    
    Args:
        old_content: The original document content
        new_content: The modified document content
        granularity: "word" or "character" level comparison
        
    Returns:
        List of exact changes with their positions
    """
    changes = []
    
    if granularity == "word":
        # Split content into words while preserving whitespace
        old_tokens = _tokenize_with_positions(old_content)
        new_tokens = _tokenize_with_positions(new_content)
        
        # Use sequence matcher on the tokens
        old_words = [token['text'] for token in old_tokens]
        new_words = [token['text'] for token in new_tokens]
        
        matcher = difflib.SequenceMatcher(isjunk=None, a=old_words, b=new_words)
        
        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == 'equal':
                continue  # Skip unchanged content
                
            elif tag == 'delete':
                # Words removed
                start_pos = old_tokens[i1]['start']
                end_pos = old_tokens[i2-1]['end'] if i2 > i1 else start_pos
                old_text = old_content[start_pos:end_pos]
                
                changes.append(Change(
                    change_type=ChangeType.DELETE,
                    start_pos=start_pos,
                    end_pos=end_pos,
                    old_text=old_text,
                    line_number=_get_line_number(old_content, start_pos),
                    word_index=i1
                ))
                
            elif tag == 'insert':
                # Words added
                if j1 < len(new_tokens):
                    start_pos = new_tokens[j1]['start']
                    end_pos = new_tokens[j2-1]['end'] if j2 > j1 else start_pos
                    new_text = new_content[start_pos:end_pos]
                    
                    # For inserts, position is where it would go in the old document
                    if i1 > 0 and i1 <= len(old_tokens):
                        insert_pos = old_tokens[i1-1]['end']
                    elif i1 == 0:
                        insert_pos = 0
                    else:
                        insert_pos = len(old_content)
                    
                    changes.append(Change(
                        change_type=ChangeType.INSERT,
                        start_pos=insert_pos,
                        end_pos=insert_pos,
                        new_text=new_text,
                        line_number=_get_line_number(old_content, insert_pos),
                        word_index=i1
                    ))
                    
            elif tag == 'replace':
                # Words replaced - create a single replace operation
                old_start = old_tokens[i1]['start']
                old_end = old_tokens[i2-1]['end'] if i2 > i1 else old_start
                old_text = old_content[old_start:old_end]
                
                new_start = new_tokens[j1]['start']
                new_end = new_tokens[j2-1]['end'] if j2 > j1 else new_start
                new_text = new_content[new_start:new_end]
                
                changes.append(Change(
                    change_type=ChangeType.REPLACE,
                    start_pos=old_start,
                    end_pos=old_end,
                    old_text=old_text,
                    new_text=new_text,
                    line_number=_get_line_number(old_content, old_start),
                    word_index=i1
                ))
    
    else:  # character-level diff
        matcher = difflib.SequenceMatcher(isjunk=None, a=old_content, b=new_content)
        
        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == 'equal':
                continue
                
            elif tag == 'delete':
                changes.append(Change(
                    change_type=ChangeType.DELETE,
                    start_pos=i1,
                    end_pos=i2,
                    old_text=old_content[i1:i2],
                    line_number=_get_line_number(old_content, i1)
                ))
                
            elif tag == 'insert':
                changes.append(Change(
                    change_type=ChangeType.INSERT,
                    start_pos=i1,
                    end_pos=i1,
                    new_text=new_content[j1:j2],
                    line_number=_get_line_number(old_content, i1)
                ))
                
            elif tag == 'replace':
                changes.append(Change(
                    change_type=ChangeType.REPLACE,
                    start_pos=i1,
                    end_pos=i2,
                    old_text=old_content[i1:i2],
                    new_text=new_content[j1:j2],
                    line_number=_get_line_number(old_content, i1)
                ))
    
    return [change.to_dict() for change in changes]

def _tokenize_with_positions(text: str) -> List[Dict[str, Any]]:
    """
    Tokenize text into words while tracking their positions.
    Preserves whitespace between words.
    """
    tokens = []
    # Pattern matches words and whitespace separately
    pattern = r'(\S+|\s+)'
    
    current_pos = 0
    for match in re.finditer(pattern, text):
        token_text = match.group(0)
        start_pos = match.start()
        end_pos = match.end()
        
        # Only include non-whitespace as tokens for comparison
        if not token_text.isspace():
            tokens.append({
                'text': token_text,
                'start': start_pos,
                'end': end_pos
            })
    
    return tokens

def _get_line_number(text: str, position: int) -> int:
    """Get the line number for a given character position"""
    return text[:position].count('\n') + 1

def compute_line_based_exact_diff(old_content: str, new_content: str) -> List[Dict[str, Any]]:
    """
    Compute differences line by line, but only return exact changes within modified lines.
    This is useful when you want to see changes organized by line.
    """
    old_lines = old_content.splitlines(keepends=True)
    new_lines = new_content.splitlines(keepends=True)
    
    changes = []
    current_old_pos = 0
    current_new_pos = 0
    
    matcher = difflib.SequenceMatcher(isjunk=None, a=old_lines, b=new_lines)
    
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == 'equal':
            # Update positions but don't record changes
            for i in range(i1, i2):
                current_old_pos += len(old_lines[i])
            for j in range(j1, j2):
                current_new_pos += len(new_lines[j])
                
        elif tag == 'replace':
            # For replaced lines, find exact differences within them
            for old_idx, new_idx in zip(range(i1, i2), range(j1, j2)):
                if old_idx < i2 and new_idx < j2:
                    old_line = old_lines[old_idx].rstrip('\n')
                    new_line = new_lines[new_idx].rstrip('\n')
                    
                    # Get word-level changes within this line
                    line_changes = _get_inline_changes(
                        old_line, 
                        new_line, 
                        current_old_pos,
                        old_idx + 1
                    )
                    changes.extend(line_changes)
                    
                    current_old_pos += len(old_lines[old_idx])
                    current_new_pos += len(new_lines[new_idx])
            
            # Handle any remaining lines
            for old_idx in range(old_idx + 1 if 'old_idx' in locals() else i1, i2):
                changes.append({
                    "type": "delete",
                    "start_pos": current_old_pos,
                    "end_pos": current_old_pos + len(old_lines[old_idx].rstrip('\n')),
                    "old_text": old_lines[old_idx].rstrip('\n'),
                    "line_number": old_idx + 1
                })
                current_old_pos += len(old_lines[old_idx])
                
            for new_idx in range(new_idx + 1 if 'new_idx' in locals() else j1, j2):
                changes.append({
                    "type": "insert",
                    "start_pos": current_old_pos,
                    "end_pos": current_old_pos,
                    "new_text": new_lines[new_idx].rstrip('\n'),
                    "line_number": i2 + 1
                })
                current_new_pos += len(new_lines[new_idx])
                
        elif tag == 'delete':
            for i in range(i1, i2):
                changes.append({
                    "type": "delete",
                    "start_pos": current_old_pos,
                    "end_pos": current_old_pos + len(old_lines[i].rstrip('\n')),
                    "old_text": old_lines[i].rstrip('\n'),
                    "line_number": i + 1
                })
                current_old_pos += len(old_lines[i])
                
        elif tag == 'insert':
            for j in range(j1, j2):
                changes.append({
                    "type": "insert",
                    "start_pos": current_old_pos,
                    "end_pos": current_old_pos,
                    "new_text": new_lines[j].rstrip('\n'),
                    "line_number": i1 + 1
                })
                current_new_pos += len(new_lines[j])
    
    return changes

def _get_inline_changes(old_line: str, new_line: str, line_start_pos: int, line_number: int) -> List[Dict[str, Any]]:
    """Get exact changes within a single line"""
    changes = []
    
    # Tokenize both lines
    old_tokens = _tokenize_with_positions(old_line)
    new_tokens = _tokenize_with_positions(new_line)
    
    old_words = [t['text'] for t in old_tokens]
    new_words = [t['text'] for t in new_tokens]
    
    matcher = difflib.SequenceMatcher(isjunk=None, a=old_words, b=new_words)
    
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == 'equal':
            continue
            
        elif tag == 'delete':
            if i1 < len(old_tokens):
                start = line_start_pos + old_tokens[i1]['start']
                end = line_start_pos + (old_tokens[i2-1]['end'] if i2 > i1 else old_tokens[i1]['end'])
                changes.append({
                    "type": "delete",
                    "start_pos": start,
                    "end_pos": end,
                    "old_text": old_line[old_tokens[i1]['start']:old_tokens[i2-1]['end'] if i2 > i1 else old_tokens[i1]['end']],
                    "line_number": line_number
                })
                
        elif tag == 'insert':
            if j1 < len(new_tokens) and i1 <= len(old_tokens):
                insert_pos = line_start_pos + (old_tokens[i1-1]['end'] if i1 > 0 else 0)
                changes.append({
                    "type": "insert",
                    "start_pos": insert_pos,
                    "end_pos": insert_pos,
                    "new_text": new_line[new_tokens[j1]['start']:new_tokens[j2-1]['end'] if j2 > j1 else new_tokens[j1]['end']],
                    "line_number": line_number
                })
                
        elif tag == 'replace':
            if i1 < len(old_tokens) and j1 < len(new_tokens):
                start = line_start_pos + old_tokens[i1]['start']
                end = line_start_pos + (old_tokens[i2-1]['end'] if i2 > i1 else old_tokens[i1]['end'])
                
                # Create a single replace operation
                changes.append({
                    "type": "replace",
                    "start_pos": start,
                    "end_pos": end,
                    "old_text": old_line[old_tokens[i1]['start']:old_tokens[i2-1]['end'] if i2 > i1 else old_tokens[i1]['end']],
                    "new_text": new_line[new_tokens[j1]['start']:new_tokens[j2-1]['end'] if j2 > j1 else new_tokens[j1]['end']],
                    "line_number": line_number
                })
    
    return changes

# Hardcoded example usage and testing
if __name__ == "__main__":
    # Test with word processor content
    old_text = """The Smart City Initiative aims to transform urban living through technology."""
    
    new_text = """The City Initiative aims to revolutionize urban living through cutting-edge technology."""
    
    print("Word-level exact diff:")
    changes = compute_exact_diff(old_text, new_text, granularity="word")
    import json
    print(json.dumps(changes, indent=2))


