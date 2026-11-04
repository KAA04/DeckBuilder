export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return <div className="loading-state"><span className="spinner" />{label}</div>
}
