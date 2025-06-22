from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import sys
import os

# Add the parent directory to the path so we can import the diff module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from diff import compute_exact_diff, compute_line_based_exact_diff

router = APIRouter()

class DiffRequest(BaseModel):
    old_content: str
    new_content: str
    granularity: str = "word"  # "word" or "character"
    
class DiffResponse(BaseModel):
    changes: List[Dict[str, Any]]
    
@router.post("/compute", response_model=DiffResponse)
async def compute_diff(request: DiffRequest):
    """
    Compute the diff between two texts
    """
    try:
        changes = compute_exact_diff(
            request.old_content, 
            request.new_content, 
            request.granularity
        )
        return DiffResponse(changes=changes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/compute-line-based", response_model=DiffResponse)
async def compute_line_based_diff(request: DiffRequest):
    """
    Compute line-based diff between two texts
    """
    try:
        changes = compute_line_based_exact_diff(
            request.old_content, 
            request.new_content
        )
        return DiffResponse(changes=changes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 