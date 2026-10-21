import { useState } from 'react'
import {
  siAnthropic, siAsana, siAtlassian, siBetterauth, siCloudflare, siConvex, siExpo, siFigma, siFirebase, siGithub, siGoogle,
  siGsap, siLinear, siModelcontextprotocol, siNeon, siNotion, siPosthog, siPrisma, siSentry, siShadcnui, siStripe, siSupabase,
  siUpstash, siVercel, siZapier,
} from 'simple-icons'
import type { Item } from '../lib/catalog'
import { TypeIcon } from './ui'

// The maker's own mark on every listing: a Simple Icons logo when the brand is
// in that set, otherwise the GitHub avatar of the account that publishes it.
// Logos belong to their owners and only identify the project.
type SimpleIcon = { path: string; hex: string; title: string }

const BY_ID: Record<string, SimpleIcon> = {
  'skill-document-skills': siAnthropic,
  'skill-example-skills': siAnthropic,
  'plugin-feature-dev': siAnthropic,
  'plugin-code-review': siAnthropic,
  'plugin-pr-review-toolkit': siAnthropic,
  'plugin-security-guidance': siAnthropic,
  'plugin-frontend-design': siAnthropic,
  'plugin-hookify': siAnthropic,
  'skill-find-skills': siVercel,
  'skill-agent-browser': siVercel,
  'skill-react-best-practices': siVercel,
  'skill-web-design-guidelines': siVercel,
  'skill-deploy-to-vercel': siVercel,
  'connector-vercel': siVercel,
  'skill-supabase-postgres-best-practices': siSupabase,
  'connector-supabase': siSupabase,
  'skill-prisma-client-api': siPrisma,
  'skill-shadcn': siShadcnui,
  'skill-neon-postgres': siNeon,
  'connector-neon': siNeon,
  'skill-firebase-basics': siFirebase,
  'skill-convex': siConvex,
  'skill-better-auth-best-practices': siBetterauth,
  'skill-stripe-best-practices': siStripe,
  'connector-stripe': siStripe,
  'skill-expo-dev-client': siExpo,
  'skill-gsap': siGsap,
  'skill-google-agents-cli-adk-code': siGoogle,
  'connector-github': siGithub,
  'connector-context7': siUpstash,
  'connector-filesystem': siModelcontextprotocol,
  'connector-fetch': siModelcontextprotocol,
  'connector-sentry': siSentry,
  'connector-linear': siLinear,
  'connector-notion': siNotion,
  'connector-figma': siFigma,
  'connector-zapier': siZapier,
  'connector-cloudflare': siCloudflare,
  'connector-atlassian': siAtlassian,
  'connector-asana': siAsana,
  'connector-posthog': siPosthog,
}

// Publishers whose listing has no GitHub link, or whose brand isn't in Simple Icons.
const OWNER: Record<string, string> = {
  'skill-improve-codebase-architecture': 'mattpocock',
  'skill-azure-deploy': 'microsoft',
  'skill-playwright-cli': 'microsoft',
  'connector-playwright': 'microsoft',
  'connector-slack': 'slackapi',
  'connector-browserbase': 'browserbase',
  'connector-exa': 'exa-labs',
  'connector-composio': 'ComposioHQ',
  'plugin-mantle': 'AkshitTiwarii',
}

function owner(item: Item): string | undefined {
  if (OWNER[item.id]) return OWNER[item.id]
  const m = item.source?.url.match(/^https:\/\/github\.com\/([^/]+)/)
  return m?.[1]
}

// Very light or near-black brand colors would vanish on the card tile, so they
// draw in the ink color instead.
function ink(hex: string): string {
  const n = parseInt(hex, 16)
  const l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  return l > 0.85 || l < 0.16 ? 'var(--text)' : `#${hex}`
}

export function Brand({ item, size = 20 }: { item: Item; size?: number }) {
  const [failed, setFailed] = useState(false)
  const icon = BY_ID[item.id]
  const login = owner(item)
  if (icon) {
    return (
      <span className="brand-logo" title={icon.title}>
        <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={`${icon.title} logo`} fill={ink(icon.hex)}>
          <path d={icon.path} />
        </svg>
      </span>
    )
  }
  if (login && !failed) {
    return (
      <span className="brand-logo brand-avatar">
        <img src={`https://github.com/${login}.png?size=96`} alt={`${login} on GitHub`} width={size + 8} height={size + 8} loading="lazy" decoding="async" onError={() => setFailed(true)} />
      </span>
    )
  }
  return (
    <span className={`brand-logo icon-${item.type}`}>
      <TypeIcon type={item.type} size={size} />
    </span>
  )
}
