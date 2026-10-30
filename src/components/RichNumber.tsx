// integer part bold monospace, decimal part dimmed (old-site RichNumber)
export default function RichNumber({ data }: { data: string | number }) {
  const raw = typeof data === 'number' ? String(data) : data
  const [whole = '-', dec] = raw.split('.')
  const wholeStr = Number.isFinite(parseInt(whole, 10))
    ? parseInt(whole, 10).toLocaleString()
    : raw
  return (
    <span>
      <span style={{ fontFamily: "'Courier New', Courier, monospace", fontWeight: 'bolder' }}>
        {wholeStr}
      </span>
      {dec !== undefined && (
        <>
          .<span style={{ fontFamily: "'Courier New', Courier, monospace", opacity: 0.65 }}>{dec}</span>
        </>
      )}
    </span>
  )
}
