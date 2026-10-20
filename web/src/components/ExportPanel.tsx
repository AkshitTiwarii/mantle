import { useMemo, useState } from 'react'
import { EXPORTS, download, exportJson } from '../lib/exports'
import type { ExportKind } from '../lib/exports'
import type { Palette } from '../lib/palettes.js'
import { Segmented, copy } from './ui'

export function ExportPanel({ palette, title = 'Export' }: { palette: Palette; title?: string }) {
  const [kind, setKind] = useState<ExportKind>('code')
  const spec = EXPORTS.find(e => e.kind === kind)!
  const text = useMemo(() => exportJson(kind, palette), [kind, palette])
  const filename = spec.file(palette)
  return (
    <section className="panel export">
      <div className="export-head">
        <h2>{title}</h2>
        <Segmented label="Export format" value={kind} onChange={setKind} options={EXPORTS.map(e => ({ value: e.kind, label: e.label }))} />
      </div>
      <p className="muted">
        <code>{filename}</code> · {spec.hint}
      </p>
      <pre className="code" tabIndex={0}>
        <code>{text}</code>
      </pre>
      <div className="row">
        <button className="btn btn-primary" onClick={() => copy(text, `${spec.label} copied`)}>
          Copy JSON
        </button>
        <button className="btn btn-secondary" onClick={() => download(filename, text)}>
          Download {filename}
        </button>
      </div>
    </section>
  )
}
