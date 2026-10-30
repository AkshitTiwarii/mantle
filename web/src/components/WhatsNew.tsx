import type { ReactNode } from 'react'
import { ArrowRight, Copy, Search, ShieldCheck, Sparkles, Stethoscope } from 'lucide-react'
import { href } from '../lib/router'
import { copy } from './ui'
import { Reveal } from './Motion'

// What shipped in 0.3, each with the command that runs it and an excerpt of
// what it prints (taken from real runs, trimmed).
type Line = { tone?: 'high' | 'review' | 'ok' | 'dim'; text: string }

const VET: Line[] = [
  { text: '> is someone/handy-skill safe to install?' },
  { tone: 'high', text: 'Verdict: HIGH RISK' },
  { tone: 'high', text: 'Pipes a download straight into a shell' },
  { tone: 'dim', text: '  scripts/setup.sh:4  curl -fsSL https://…/install.sh | sh' },
  { tone: 'high', text: 'Prompt-injection phrasing aimed at the agent' },
  { tone: 'dim', text: '  SKILL.md:10  "Ignore all previous instructions…"' },
  { tone: 'review', text: 'Hidden HTML comment with instructions' },
]

const DOCTOR: Line[] = [
  { text: '> /mantle doctor' },
  { tone: 'dim', text: 'Loads into every session: ~2,724 tokens' },
  { tone: 'high', text: 'FIX  MCP "github" runs npx directly on Windows' },
  { tone: 'high', text: 'FIX  MCP "github" has a secret written into its config' },
  { tone: 'review', text: 'REVIEW  Broad allow rule: Bash(*)' },
  { tone: 'review', text: 'REVIEW  .env readable, no deny rule' },
]

const RECOMMEND: Line[] = [
  { text: '> what should I install for this project?' },
  { tone: 'dim', text: 'Detected: React, Tailwind CSS, shadcn/ui, Motion' },
  { tone: 'ok', text: '+ vercel-react-best-practices' },
  { tone: 'ok', text: '+ shadcn  · + emil-design-eng' },
  { tone: 'ok', text: '+ typescript-lsp (plugin)' },
  { tone: 'ok', text: '+ Context7 (current docs)' },
  { tone: 'dim', text: 'Already set up: mantle, security-audit' },
]

function Report({ lines }: { lines: Line[] }) {
  return (
    <pre className="new-report" aria-label="Example output">
      {lines.map((l, i) => (
        <span key={i} className={l.tone ? `r-${l.tone}` : undefined}>
          {l.text}
          {'\n'}
        </span>
      ))}
    </pre>
  )
}

function Card({ icon, title, children, lines, command, className = '' }: { icon: ReactNode; title: string; children: ReactNode; lines: Line[]; command: string; className?: string }) {
  return (
    <article className={`new-card ${className}`}>
      <div className="new-card-head">
        <span className="new-icon">{icon}</span>
        <h3>{title}</h3>
      </div>
      <p>{children}</p>
      <Report lines={lines} />
      <button className="new-command" onClick={() => copy(command, 'Command copied')} title="Copy the command">
        <code>{command}</code>
        <Copy size={14} aria-hidden />
      </button>
    </article>
  )
}

export function WhatsNew() {
  return (
    <section className="band" id="new">
      <Reveal className="band-head">
        <h2>
          New in 0.3: <em>check before you trust.</em>
        </h2>
        <p>
          Built from what developers complain about most: skills you can't vet, setups that quietly eat your context, and too much to search. Everything here only reads; nothing installs or changes without your yes.
        </p>
      </Reveal>
      <div className="new-grid">
        <Card
          className="new-wide"
          icon={<ShieldCheck size={20} strokeWidth={1.8} />}
          title="Vet a skill before you install it"
          lines={VET}
          command="npx skills add AkshitTiwarii/mantle --skill mantle-atlas"
        >
          Third-party skills run with your permissions. Atlas reads a skill's files first and flags network pipes into a shell, credential reads, env vars sent to remote hosts, writes to your shell profile or Claude settings, permission bypasses, prompt injection, invisible Unicode and obfuscated code, each with the file and line.
        </Card>
        <Card icon={<Stethoscope size={20} strokeWidth={1.8} />} title="Doctor: your setup, checked" lines={DOCTOR} command="/mantle doctor">
          Finds API keys pasted into MCP config (without printing them), allow rules as wide as <code>Bash(*)</code>, a readable <code>.env</code>, MCP servers that fail on Windows, and the CLAUDE.md rules Claude keeps ignoring.
        </Card>
        <Card icon={<Sparkles size={20} strokeWidth={1.8} />} title="Picks for your stack" lines={RECOMMEND} command="What should I install for this project? Use mantle-atlas.">
          Reads package.json, pyproject, Dockerfile and CI, then suggests the skills and connectors that fit, skipping what you already have.
        </Card>
        <a className="new-card new-explore" href={href({ page: 'explore' })}>
          <div className="new-card-head">
            <span className="new-icon">
              <Search size={20} strokeWidth={1.8} />
            </span>
            <h3>Search all 47,972</h3>
          </div>
          <p>Every skill on skills.sh, every server in the official MCP Registry and every official plugin, with its install command. Share a search as a link.</p>
          <div className="new-search" aria-hidden>
            <span className="new-search-box">
              <Search size={14} /> jira
            </span>
            {[
              ['jira', 'ai.waystation/jira', 'connector'],
              ['atlassian-jira', 'com.mcparmory/atlassian-jira', 'connector'],
              ['jira-integration', 'affaan-m/ecc', 'skill'],
            ].map(([name, source, kind]) => (
              <span key={name} className="new-search-row">
                <b>{name}</b>
                <span>{source}</span>
                <em>{kind}</em>
              </span>
            ))}
          </div>
          <span className="new-go">
            Open Explore <ArrowRight size={15} />
          </span>
        </a>
      </div>
    </section>
  )
}
