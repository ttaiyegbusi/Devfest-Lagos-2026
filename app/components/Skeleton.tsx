import "./Skeleton.css";

interface SkeletonProps {
  variant?: "text" | "card" | "avatar" | "button" | "heading";
  width?: string | number;
  height?: string | number;
  className?: string;
}

/* Skeleton loading placeholder for async content.
   Shows a smooth shimmer animation while content loads, then
   gracefully reveals the real content. */
export function Skeleton({
  variant = "text",
  width,
  height,
  className = "",
}: SkeletonProps) {
  const style: React.CSSProperties = {};

  if (width) {
    style.width = typeof width === "number" ? `${width}px` : width;
  }
  if (height) {
    style.height = typeof height === "number" ? `${height}px` : height;
  }

  const variantClass = `skeleton--${variant}`;

  return <div className={`skeleton ${variantClass} ${className}`} style={style} />;
}

/* Skeleton card grid for speaker/team listings */
export function SkeletonGrid({ count = 6, columns = 3 }: { count?: number; columns?: number }) {
  return (
    <div
      className="skeleton-grid"
      style={
        {
          "--skeleton-columns": columns,
        } as React.CSSProperties
      }
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-grid-item">
          <Skeleton variant="card" className="skeleton-card" />
          <Skeleton variant="heading" width="80%" className="skeleton-text" />
          <Skeleton variant="text" width="60%" className="skeleton-text" />
        </div>
      ))}
    </div>
  );
}
