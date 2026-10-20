import { useState } from 'react'
import { SquareTerminal, Sparkles } from 'lucide-react'
import { siClaude, siCline, siCursor, siGithubcopilot, siGooglegemini, siWindsurf } from 'simple-icons'
import { copy } from './ui'

// "Set up with your agent": paste one prompt into the agent you already use and
// it installs Mantle (Claude Code) or the Mantle Atlas skill (every other agent).
type Agent = { id: string; name: string; icon?: { path: string; hex: string }; glyph?: 'terminal' | 'any'; prompt: string }

const atlas = (flag: string, name: string) =>
  `Install the Mantle Atlas skill for ${name}: run \`npx skills add AkshitTiwarii/mantle --skill mantle-atlas -a ${flag} -y\` in the terminal. ` +
  `From now on, whenever I ask which skill, connector, plugin or setting fits a task, use mantle-atlas to answer with what it is, when to use it and the exact install command.`

const AGENTS: Agent[] = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    icon: siClaude,
    prompt:
      'Install Mantle for me: run `claude plugin install mantle --marketplace AkshitTiwarii/mantle` in the terminal. ' +
      'It adds the /mantle theme studio, live theme reactions, wallpapers for Windows Terminal and claude.ai, and the mantle-atlas knowledge base. ' +
      'When it finishes, tell me to run /reload-plugins and then /mantle aurora.',
  },
  { id: 'cursor', name: 'Cursor', icon: siCursor, prompt: atlas('cursor', 'Cursor') },
  { id: 'codex', name: 'Codex', glyph: 'terminal', prompt: atlas('codex', 'Codex') },
  { id: 'github-copilot', name: 'GitHub Copilot', icon: siGithubcopilot, prompt: atlas('github-copilot', 'GitHub Copilot') },
  { id: 'gemini-cli', name: 'Gemini CLI', icon: siGooglegemini, prompt: atlas('gemini-cli', 'Gemini CLI') },
  { id: 'windsurf', name: 'Windsurf', icon: siWindsurf, prompt: atlas('windsurf', 'Windsurf') },
  { id: 'cline', name: 'Cline', icon: siCline, prompt: atlas('cline', 'Cline') },
  { id: 'any', name: 'Any agent', glyph: 'any', prompt: atlas("'*'", 'every agent on this machine') },
]

function Logo({ agent, size = 18 }: { agent: Agent; size?: number }) {
  if (agent.icon) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-hidden fill={`#${agent.icon.hex}`}>
        <path d={agent.icon.path} />
      </svg>
    )
  }
  const Icon = agent.glyph === 'terminal' ? SquareTerminal : Sparkles
  return <Icon size={size} strokeWidth={1.8} aria-hidden />
}

export function AgentConnect() {
  const [id, setId] = useState('claude-code')
  const agent = AGENTS.find(a => a.id === id) ?? AGENTS[0]
  return (
    <div className="agent-connect">
      <p className="agent-title">Set up with your agent</p>
      <div className="agent-row" role="tablist" aria-label="Choose your AI agent">
        {AGENTS.map(a => (
          <button key={a.id} role="tab" aria-selected={a.id === id} className={`agent-tab ${a.id === id ? 'on' : ''}`} onClick={() => setId(a.id)} title={a.name}>
            <Logo agent={a} />
            <span>{a.name}</span>
          </button>
        ))}
      </div>
      <div className="agent-prompt" role="tabpanel" aria-label={`Prompt for ${agent.name}`}>
        <p>{agent.prompt}</p>
        <button className="btn btn-primary btn-sm" onClick={() => copy(agent.prompt, `Prompt for ${agent.name} copied`)}>
          Copy prompt
        </button>
      </div>
      <p className="agent-note">Paste it into {agent.name}. Logos belong to their owners; Mantle is independent and works alongside them.</p>
    </div>
  )
}
