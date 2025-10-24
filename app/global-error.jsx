'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Global Error Boundary for Root Layout
 *
 * This catches errors in the root layout and provides a minimal fallback UI.
 * Required to be separate from error.jsx to catch layout-level errors.
 *
 * Next.js 14 App Router Convention: app/global-error.jsx
 *
 * IMPORTANT: This component uses inline styles instead of Tailwind CSS
 * because when a critical error occurs, the CSS may fail to load.
 * Inline styles ensure the error UI always displays correctly.
 */
export default function GlobalError({ error, reset }) {
  const [isResetting, setIsResetting] = React.useState(false);

  React.useEffect(() => {
    console.error('Global Application Error:', {
      error,
      timestamp: new Date().toISOString(),
      boundary: 'global-error'
    });
  }, [error]);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await reset();
    } catch (resetError) {
      console.error('Failed to reset:', resetError);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Rush Policy Assistant - Critical Error</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&family=Source+Sans+3:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{
        margin: 0,
        padding: 0,
        fontFamily: '"Source Sans 3", Montserrat, system-ui, sans-serif',
        backgroundColor: '#DFF9EB', // Rush sage color
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          style={{
            maxWidth: '600px',
            padding: '2rem',
            backgroundColor: 'white',
            borderRadius: '1rem',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}
        >
          <AlertTriangle
            size={64}
            color="#006332"
            strokeWidth={2}
            style={{ margin: '0 auto 1.5rem' }}
            aria-hidden="true"
          />
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#006332', // Rush legacy green
            marginBottom: '1rem',
            fontFamily: 'Montserrat, sans-serif'
          }}>
            Critical Error
          </h1>
          <p style={{
            color: '#5F5858', // Rush black
            marginBottom: '2rem',
            lineHeight: '1.6',
            fontSize: '1rem'
          }}>
            The Rush Policy Assistant encountered a critical error and needs to restart.
            Your data is safe. If this issue persists, please contact{' '}
            <a
              href="mailto:support@rush.edu"
              style={{
                color: '#006332',
                textDecoration: 'underline'
              }}
            >
              support@rush.edu
            </a>
            .
          </p>
          <button
            onClick={handleReset}
            disabled={isResetting}
            aria-label="Restart the application"
            style={{
              backgroundColor: isResetting ? '#AFAEAF' : '#006332', // Rush gray when disabled
              color: 'white',
              padding: '0.75rem 2rem',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: isResetting ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s ease',
              opacity: isResetting ? 0.6 : 1,
              outline: 'none'
            }}
            onFocus={(e) => {
              if (!isResetting) {
                e.target.style.outline = '2px solid #30AE6E';
                e.target.style.outlineOffset = '2px';
              }
            }}
            onBlur={(e) => {
              e.target.style.outline = 'none';
            }}
            onMouseEnter={(e) => {
              if (!isResetting) {
                e.target.style.backgroundColor = '#30AE6E'; // Rush growth green
              }
            }}
            onMouseLeave={(e) => {
              if (!isResetting) {
                e.target.style.backgroundColor = '#006332';
              }
            }}
          >
            {isResetting ? 'Restarting...' : 'Restart Application'}
          </button>
        </div>
      </body>
    </html>
  );
}
