export function ProgressSkeleton() {
  return (
    <section
      className="progress-metrics"
      aria-busy="true"
      aria-label="Loading progress summary"
    >
      <p role="status">
        Reading your recorded activity. Totals are not yet available.
      </p>
      {[
        "Total submissions",
        "Distinct questions attempted",
        "Active-plan completion",
      ].map((title) => (
        <div className="student-card" key={title}>
          <h2>{title}</h2>
          <p aria-hidden="true">—</p>
        </div>
      ))}
    </section>
  );
}
