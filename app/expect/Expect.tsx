import { type CSSProperties } from "react";
import { type Media, type Shot, type Track } from "./tracks";
import { PillPit } from "./PillPit";
import { onDisk } from "./assets";
import { PaperFrame } from "./PaperFrame";
import "./Expect.css";

/** How fast the looping band travels, in px per second. */
const STRIP_SPEED = 40;

export function ExpectPanel({ track }: { track: Track }) {
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
    case "photo": {
      // With one print there is nothing to cross-fade to, so the loop only
      // switches on once there is more than one.
      const cycling = media.shots.length > 1;
      return (
        <>
          {/* Only one panel is a photo, so the one clip path is defined where
              it is used and its id cannot collide. Artwork that already has
              the bowed edge drawn into it needs neither. */}
          {media.framed ? null : <WarpDef />}
          <PaperFrame
            className={["frame", media.framed && "frame--bare", cycling && "frame--cycling"]
              .filter(Boolean)
              .join(" ")}
          >
            {media.shots.map((s, i) => (
              <Art
                key={s.image ?? i}
                shot={s}
                className="frame__shot"
                style={{ ["--i" as string]: i }}
              />
            ))}
          </PaperFrame>
        </>
      );
    }

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

    case "strip": {
      // The band never ends: a second copy of the run sits directly after the
      // first and the track travels exactly one run's width, so the copy lands
      // where the original started and the seam never shows. Same trick the
      // hero's cloud bands use. The copy is decorative — only the first run is
      // read out.
      //
      // Duration is derived from the run's length rather than picked, so the
      // band travels at one speed whatever it carries: adding photographs
      // makes the lap longer, not faster. 240 is a shot plus its gap.
      const seconds = Math.round((media.shots.length * 240) / STRIP_SPEED);
      return (
        <div
          className="shots shots--strip"
          style={{ ["--strip-duration" as string]: `${seconds}s` }}
        >
          {[0, 1].map((copy) => (
            <div
              className="shots__run"
              key={copy}
              aria-hidden={copy === 1 || undefined}
            >
              {media.shots.map((s, i) => (
                <Art key={i} shot={s} className="shots__shot" />
              ))}
            </div>
          ))}
        </div>
      );
    }
  }
}

/* A shot is either the photograph or, until there is one, a tinted block in
   its place — same box either way, so the layout does not move when the real
   pictures land. */
function Art({
  shot,
  className,
  style,
}: {
  shot: Shot;
  className: string;
  style?: CSSProperties;
}) {
  // A path that has no file behind it yet falls back to the placeholder, so
  // the section is never a grid of broken frames while the shots are landing.
  if (shot.image && onDisk(shot.image)) {
    return (
      <img
        className={className}
        src={shot.image}
        alt={shot.alt ?? ""}
        style={style}
        loading="lazy"
        decoding="async"
      />
    );
  }
  return (
    <span
      className={`${className} art--placeholder`}
      style={{
        ...style,
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
