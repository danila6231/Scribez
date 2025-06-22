# Assets Folder

This folder contains static assets for the frontend application.

## Structure

```
assets/
├── icons/          # Icon files (PNG, SVG, etc.)
├── images/         # General images
└── README.md       # This file
```

## Usage

### Importing Assets in Components

```jsx
// Import an icon
import linkIcon from '../assets/icons/link-icon.png';

// Use in component
<img src={linkIcon} alt="Link" width="16" height="16" />
```

### File Naming Convention

- Use kebab-case for file names: `link-icon.png`, `user-avatar.jpg`
- Be descriptive: `toolbar-bold-icon.png` rather than `icon1.png`

## Supported Formats

- **Icons**: PNG, SVG, ICO
- **Images**: PNG, JPG, JPEG, GIF, WebP
- **Other**: Any static assets needed by the application 