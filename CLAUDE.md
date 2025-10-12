# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "soriplay" - a social media web application with Instagram-like features including user authentication, social feeds, stories, and profile management. The application is built using React with client-side routing and Supabase for backend services.

## Architecture

### Frontend Stack
- **React 18**: UI framework loaded via ESM from esm.sh CDN
- **React Router DOM v6**: Client-side routing
- **Supabase JS Client v2**: Authentication and backend services
- **No build system**: Uses native browser module support with import maps

### Application Structure

The application follows a hybrid architecture:
- Static HTML files (`index.html`, `main.html`, `signup.html`, `password-recovery.html`) serve as entry points
- React components in JSX files (`app.jsx`, `MyPage.jsx`) handle the dynamic UI
- A single root div (`#root`) is used for React app mounting

### Module Loading Pattern

Import maps are defined in `index.html` to enable CDN-based module resolution:
```javascript
{
  "imports": {
    "react": "https://esm.sh/react@18",
    "react-dom/client": "https://esm.sh/react-dom@18/client",
    "react-router-dom": "https://esm.sh/react-router-dom@6",
    "@supabase/supabase-js": "https://esm.sh/@supabase/supabase-js@2",
    "react/jsx-runtime": "https://esm.sh/react@18/jsx-runtime",
    "react/jsx-dev-runtime": "https://esm.sh/react@18/jsx-dev-runtime"
  }
}
```

### Routing Architecture

The application has the following route structure (defined in `app.jsx:178-183`):
- `/` - Login page (Login component)
- `/signup` - Registration page (Signup component)
- `/recover` - Password recovery page (Recover component)
- `/main` - Main social feed (Main component)
- `/me` - User profile page (MyPage component)

### Authentication Flow

**Supabase Integration** (`supabaseClient.js:1-6`):
- Credentials are stored in global `window.SUPABASE_URL` and `window.SUPABASE_ANON_KEY`
- Single Supabase client instance is exported for use across components
- OAuth providers supported: Google and Apple (via `signInWithOAuth`)

**OAuth Redirect Pattern**:
```javascript
supabase.auth.signInWithOAuth({
  provider: 'google' | 'apple',
  options: { redirectTo: window.location.origin + '/main' }
})
```

### Component Structure

**Shared Components**:
- `SocialLogin` (`app.jsx:7-63`): Reusable OAuth button component for Google/Apple login

**Page Components**:
1. **Login** (`app.jsx:64-230`): Email/password login with OAuth options
2. **Signup** (`app.jsx:231-451`): Registration with password matching validation
3. **Recover** (`app.jsx:452-552`): Password recovery via email
4. **Main** (`app.jsx:553-891`): Social feed with stories, posts, and bottom navigation
5. **MyPage** (`MyPage.jsx`): User profile with stats, highlights, and post grid

### Styling Architecture

- **Base styles**: `styles.css` - shared form components, buttons, layouts
- **Profile styles**: `mypage.css` - profile-specific styles
- **Inline styles**: `main.html` contains embedded CSS for the feed view
- **Theme system**: Uses CSS custom properties (variables) for colors and spacing
- **Responsive design**: Mobile-first with breakpoints at 600px

### State Management

- Local component state using React hooks (`useState`, `useEffect`)
- Navigation via React Router's `useNavigate` hook
- No global state management library
- Authentication state managed by Supabase client

### Data Flow

**Image Sources**:
- Placeholder images from picsum.photos with random parameters
- User avatars, story images, and post images all use this service
- Example: `https://picsum.photos/60/60?random=1`

**Navigation Pattern**:
- Bottom navigation (mobile-only) with 5 items: home, check, add, bell, profile
- Navigation handled via `navigate()` from React Router
- Some nav items incorrectly navigate to `/signup` or `/recover` (apparent placeholder logic)

## Development

### Running the Application

This is a static web application with no build step. To develop:

1. **Serve files locally**: Use any static file server
   ```bash
   python -m http.server 8000
   # or
   npx serve .
   ```

2. **Configure Supabase**: Set credentials in the HTML before loading
   ```html
   <script>
     window.SUPABASE_URL = 'your-project-url';
     window.SUPABASE_ANON_KEY = 'your-anon-key';
   </script>
   ```

3. **Access**: Navigate to `http://localhost:8000/member_design/index.html`

### File Organization

```
member_design/
├── index.html              # Login page entry point
├── signup.html             # Registration page entry point
├── main.html               # Feed page (standalone HTML)
├── password-recovery.html  # Password reset entry point
├── app.jsx                 # Main React app with routing
├── MyPage.jsx              # Profile page component
├── supabaseClient.js       # Supabase client configuration
├── styles.css              # Global styles
└── mypage.css              # Profile-specific styles
```

### Code Patterns

**Loading States**:
```javascript
const [loading, setLoading] = useState(false);
// On submit:
setLoading(true);
setTimeout(() => {
  setLoading(false);
  navigate('/target');
}, 800);
```

**Form Handling**:
- All forms use `e.preventDefault()` to intercept submission
- Password matching validation in Signup component (`app.jsx:235-243`)
- Required fields enforced via HTML5 `required` attribute

**Component Navigation**:
- Use `useNavigate()` hook from react-router-dom
- Call `navigate('/path')` to change routes

### Important Notes

1. **No TypeScript**: Pure JavaScript codebase
2. **No package.json**: Dependencies loaded via CDN
3. **Mixed architecture**: Both static HTML and React SPA patterns coexist
4. **Development mode**: Using React development runtime (`jsx-dev-runtime`)
5. **No authentication state persistence**: Users will be logged out on page refresh unless Supabase session is configured
6. **Hardcoded data**: Stories, posts, and user data are all mock/placeholder content
7. **Navigation inconsistencies**: Some bottom nav buttons navigate to incorrect pages (likely needs fixing)

### Common Modifications

**Adding a new route**:
1. Create component in `app.jsx` or separate `.jsx` file
2. Add `<Route>` in App component's Routes block
3. Add navigation trigger in appropriate component

**Styling changes**:
- Form components: Edit `styles.css`
- Profile page: Edit `mypage.css`
- Feed view: Edit inline styles in `main.html` or create separate CSS file

**Supabase operations**:
- Import from `./supabaseClient.js`
- Use `supabase.auth.*` for authentication
- Use `supabase.from().*` for database operations (not currently implemented)
