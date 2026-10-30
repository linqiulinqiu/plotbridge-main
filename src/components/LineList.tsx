// renders an i18n list where items are plain strings or {text, url} links
export default function LineList({ list }: { list: (string | { text: string; url: string })[] }) {
  return (
    <div style={{ lineHeight: 1.9 }}>
      {list.map((li, i) =>
        typeof li === 'object' ? (
          <p key={i}>
            <a href={li.url} target="_blank" rel="noreferrer">
              {li.text}
            </a>
          </p>
        ) : (
          <p key={i}>{li}</p>
        ),
      )}
    </div>
  )
}
