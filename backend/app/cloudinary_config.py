import os
import cloudinary
import cloudinary.uploader
import cloudinary.api
from typing import Dict, Any

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"), 
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

class CloudinaryService:
    """Service for handling Cloudinary image operations"""
    
    @staticmethod
    def upload_image(file_path: str, public_id: str = None, folder: str = "writing-tool-images") -> Dict[str, Any]:
        """
        Upload an image to Cloudinary
        
        Args:
            file_path: Path to the image file
            public_id: Custom public ID for the image
            folder: Cloudinary folder to store the image
            
        Returns:
            Dict containing upload result
        """
        try:
            upload_result = cloudinary.uploader.upload(
                file_path,
                public_id=public_id,
                folder=folder,
                resource_type="image",
                quality="auto",
                fetch_format="auto"
            )
            return upload_result
        except Exception as e:
            raise Exception(f"Failed to upload image to Cloudinary: {str(e)}")
    
    @staticmethod
    def delete_image(public_id: str) -> Dict[str, Any]:
        """
        Delete an image from Cloudinary
        
        Args:
            public_id: The public ID of the image to delete
            
        Returns:
            Dict containing deletion result
        """
        try:
            result = cloudinary.uploader.destroy(public_id)
            return result
        except Exception as e:
            raise Exception(f"Failed to delete image from Cloudinary: {str(e)}")
    
    @staticmethod
    def get_image_url(public_id: str, transformations: Dict[str, Any] = None) -> str:
        """
        Get optimized image URL
        
        Args:
            public_id: The public ID of the image
            transformations: Optional transformations to apply
            
        Returns:
            Optimized image URL
        """
        try:
            if transformations:
                url = cloudinary.CloudinaryImage(public_id).build_url(**transformations)
            else:
                url = cloudinary.CloudinaryImage(public_id).build_url(
                    quality="auto",
                    fetch_format="auto"
                )
            return url
        except Exception as e:
            raise Exception(f"Failed to generate image URL: {str(e)}")
    
    @staticmethod
    def get_image_info(public_id: str) -> Dict[str, Any]:
        """
        Get information about an image
        
        Args:
            public_id: The public ID of the image
            
        Returns:
            Dict containing image information
        """
        try:
            result = cloudinary.api.resource(public_id)
            return result
        except Exception as e:
            raise Exception(f"Failed to get image info: {str(e)}")

# Export the service instance
cloudinary_service = CloudinaryService() 