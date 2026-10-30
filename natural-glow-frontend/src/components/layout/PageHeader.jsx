// Banner for inner pages (sits under the floating navbar).
export default function PageHeader({ eyebrow, title, children }) {
  return (
    <section className="bg-gradient-to-b from-sage-100 to-cream-100 pb-12 pt-36 sm:pb-16 sm:pt-44">
      <div className="container-x text-center">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">{title}</h1>
        {children && <p className="mx-auto mt-4 max-w-2xl text-base text-ink/70">{children}</p>}
      </div>
    </section>
  );
}
