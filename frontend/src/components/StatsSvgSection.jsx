// Renders your 3-metrics SVG exactly as-is, responsive.
// Place your file at: src/assets/stats-3.svg
// You can replace it anytime; the component will auto-pick the new content.
import statsRaw from '../assets/stats-3.svg?raw'

export default function StatsSvgSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div
          className="w-full"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: statsRaw }}
        />
      </div>
    </section>
  )
}
