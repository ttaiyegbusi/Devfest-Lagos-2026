import { TRACKS, type Media, type Shot, type Track } from "./tracks";
import { PillPit } from "./PillPit";
import "./Expect.css";

/* The panels are handed to the stack in page.tsx as siblings of the hero
   rather than wrapped in a stack of their own here. 01 has to rise over the
   hero the same way 02 rises over 01, and it can only do that if the hero is
   a pinned layer in the same stack — a stack starting at 01 leaves 01 with
   nothing underneath to climb over. */
export function expectPanels() {
  return TRACKS.map((track) => <Panel key={track.n} track={track} />);
}

function Panel({ track }: { track: Track }) {
  const id = `expect-${track.n}`;

  return (
    <section
      className={`panel panel--${track.side} panel--${track.media.kind}`}
      aria-labelledby={id}
      style={{
        ["--bg" as string]: track.bg,
        ["--ink" as string]: track.ink,
        ["--fg" as string]: track.fg,
        ["--line" as string]: track.line,
      }}
    >
      <div className="panel__head">
        {/* The number is the first line of the heading block, on the same
            leading as the title, which is how the reference sets it. */}
        <p className="panel__n" aria-hidden="true">
          {track.n}
        </p>
        <h2 className="panel__title" id={id}>
          {track.title.split("\n").map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h2>
      </div>

      <hr className="panel__rule" />

      <div className="panel__body">
        {track.body ? <p className="panel__prose">{track.body}</p> : null}

        {track.points ? (
          <ul className="panel__points">
            {track.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        ) : null}

        {track.close ? <p className="panel__close">{track.close}</p> : null}
      </div>

      <div className="panel__media">
        <MediaBlock media={track.media} />
      </div>
    </section>
  );
}

function MediaBlock({ media }: { media: Media }) {
  switch (media.kind) {
    case "photo":
      return (
        <>
          {/* Only one panel is a photo, so the one clip path is defined where
              it is used and its id cannot collide. */}
          <WarpDef />
          <figure className="frame">
            <Art shot={media.shot} className="frame__shot" />
          </figure>
        </>
      );

    case "pills":
      return <PillPit rows={media.rows} />;

    case "grid":
      return (
        <div className="shots shots--grid">
          {media.shots.map((s, i) => (
            <Art key={i} shot={s} className="shots__shot" />
          ))}
        </div>
      );

    case "strip":
      return (
        <div className="shots shots--strip">
          {media.shots.map((s, i) => (
            <Art key={i} shot={s} className="shots__shot" />
          ))}
        </div>
      );
  }
}

/* A shot is either the photograph or, until there is one, a tinted block in
   its place — same box either way, so the layout does not move when the real
   pictures land. */
function Art({ shot, className }: { shot: Shot; className: string }) {
  if (shot.image) {
    return <img className={className} src={shot.image} alt={shot.alt ?? ""} />;
  }
  return (
    <span
      className={`${className} art--placeholder`}
      style={{
        ["--from" as string]: shot.tint[0],
        ["--to" as string]: shot.tint[1],
      }}
    />
  );
}

/* Panel 01's frame has bowed edges, the way a print photographed slightly
   off-flat does. objectBoundingBox units, so the one path serves the frame at
   every width and the sliver behind it can reuse the path verbatim. */
function WarpDef() {
  return (
    <svg className="panel__defs" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="expect-warp" clipPathUnits="objectBoundingBox">
          <path d="M.010.030 Q.500.008 .990.016 Q1.002.500 .986.980 Q.500 1.002 .020.988 Q.002.500 .010.030 Z" />
        </clipPath>
      </defs>
    </svg>
  );
}
