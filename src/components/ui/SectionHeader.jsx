export function SectionHeader({ eyebrow, title, description, align = "left" }) {
  return (
    <div className={`section-header section-header-${align}`}>
      {eyebrow ? <span className="section-kicker">{eyebrow}</span> : null}
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
    </div>
  );
}
