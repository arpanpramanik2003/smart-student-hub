import './globals.css';
import Providers from './providers';
import { Analytics } from '@vercel/analytics/next';

const SITE_URL = 'https://ssh-v2.arpanpramanik.dev';

export const metadata = {
  // =====================
  // PRIMARY SEO
  // =====================
  title: {
    template: '%s | CampusSphere',
    default: 'CampusSphere | Academic Governance Platform',
  },
  description:
    'CampusSphere is a modern academic governance platform designed to help students manage learning resources, track co-curricular progress, and verify digital credentials efficiently.',
  keywords: [
    'CampusSphere',
    'Student Platform',
    'Academic Productivity',
    'Learning Dashboard',
    'Student Management',
    'Study Tools',
  ],
  authors: [{ name: 'Arpan Pramanik' }],
  robots: 'index, follow',
  canonical: SITE_URL,

  // =====================
  // PWA & FAVICON
  // =====================
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },

  // =====================
  // OPEN GRAPH (SOCIAL SHARE)
  // =====================
  openGraph: {
    type: 'website',
    url: SITE_URL,
    title: 'CampusSphere | Academic Governance Platform',
    description:
      'A modern academic productivity platform to help students manage resources, track performance, and improve learning efficiency.',
    images: [
      {
        url: `${SITE_URL}/android-chrome-512x512.png`,
        width: 512,
        height: 512,
        alt: 'CampusSphere Logo',
      },
    ],
    siteName: 'CampusSphere',
    locale: 'en_US',
  },

  // =====================
  // TWITTER CARD
  // =====================
  twitter: {
    card: 'summary_large_image',
    title: 'CampusSphere | Academic Governance Platform',
    description:
      'A smart academic productivity platform designed to enhance student learning and performance.',
    images: [`${SITE_URL}/android-chrome-512x512.png`],
  },
};

export const viewport = {
  themeColor: '#0b0f19',
};

export default function RootLayout({ children }) {
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'CampusSphere',
    url: SITE_URL,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    creator: {
      '@type': 'Person',
      name: 'Arpan Pramanik',
    },
    description:
      'A web-based academic productivity platform designed to help students manage learning and track performance.',
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* JSON-LD Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
