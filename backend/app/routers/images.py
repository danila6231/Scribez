from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import os
import tempfile

from app.cloudinary_config import cloudinary_service
from app.database import documents_collection

router = APIRouter()

class DeleteImageRequest(BaseModel):
    publicId: str

class ImageResponse(BaseModel):
    url: str
    publicId: str
    width: int
    height: int
    format: str
    bytes: int
    success: bool

@router.post("/upload", response_model=ImageResponse)
async def upload_image(file: UploadFile = File(...)):
    """
    Upload an image file to Cloudinary
    """
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Validate file size (10MB limit)
        max_size = 10 * 1024 * 1024  # 10MB
        contents = await file.read()
        if len(contents) > max_size:
            raise HTTPException(status_code=400, detail="File size must be less than 10MB")
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_file.write(contents)
            temp_file_path = temp_file.name
        
        try:
            # Upload to Cloudinary
            result = cloudinary_service.upload_image(
                file_path=temp_file_path,
                folder="writing-tool-images"
            )
            
            return ImageResponse(
                url=result['secure_url'],
                publicId=result['public_id'],
                width=result['width'],
                height=result['height'],
                format=result['format'],
                bytes=result['bytes'],
                success=True
            )
            
        finally:
            # Clean up temporary file
            os.unlink(temp_file_path)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")

@router.delete("/delete")
async def delete_image(request: DeleteImageRequest):
    """
    Delete an image from Cloudinary
    """
    try:
        result = cloudinary_service.delete_image(request.publicId)
        
        if result.get('result') == 'ok':
            return {"success": True, "message": "Image deleted successfully"}
        else:
            return {"success": False, "message": "Image not found or already deleted"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete image: {str(e)}")

@router.get("/{public_id}/info")
async def get_image_info(public_id: str):
    """
    Get information about an image
    """
    try:
        result = cloudinary_service.get_image_info(public_id)
        return {
            "success": True,
            "info": {
                "url": result['secure_url'],
                "publicId": result['public_id'],
                "width": result['width'],
                "height": result['height'],
                "format": result['format'],
                "bytes": result['bytes'],
                "createdAt": result['created_at']
            }
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Image not found: {str(e)}")

@router.get("/{public_id}/url")
async def get_optimized_image_url(
    public_id: str,
    width: Optional[int] = None,
    height: Optional[int] = None,
    quality: Optional[str] = "auto",
    format: Optional[str] = "auto"
):
    """
    Get an optimized URL for an image with transformations
    """
    try:
        transformations = {
            "quality": quality,
            "fetch_format": format
        }
        
        if width:
            transformations["width"] = width
        if height:
            transformations["height"] = height
            
        url = cloudinary_service.get_image_url(public_id, transformations)
        
        return {
            "success": True,
            "url": url
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate image URL: {str(e)}")

# Document-specific image operations
@router.post("/documents/{document_id}/images")
async def save_image_to_document(document_id: str, image_data: Dict[str, Any]):
    """
    Save image reference to a document
    """
    try:
        # Update document to include image reference
        result = await documents_collection.update_one(
            {"_id": document_id},
            {
                "$push": {
                    "images": {
                        "url": image_data["url"],
                        "publicId": image_data["publicId"],
                        "width": image_data["width"],
                        "height": image_data["height"],
                        "uploadedAt": datetime.utcnow()
                    }
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Document not found")
            
        return {"success": True, "message": "Image reference saved to document"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save image reference: {str(e)}")

@router.get("/documents/{document_id}/images")
async def get_document_images(document_id: str):
    """
    Get all images associated with a document
    """
    try:
        document = await documents_collection.find_one({"_id": document_id})
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
            
        images = document.get("images", [])
        return {"success": True, "images": images}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get document images: {str(e)}") 