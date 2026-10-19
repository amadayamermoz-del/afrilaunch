type SectionHeadingProps = { eyebrow: string; title: string; description?: string; centered?: boolean };

export function SectionHeading({ eyebrow, title, description, centered = false }: SectionHeadingProps) {
  return <div className={centered ? "section-heading centered" : "section-heading"}>
    <span className="eyebrow">{eyebrow}</span>
    <h2>{title}</h2>
    {description && <p>{description}</p>}
  </div>;
}
