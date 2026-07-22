import { Band } from "@/components/shared/section-shell"
import { SectionHeading } from "@/components/shared/section-heading"
import { DimensionIcon } from "@/components/dashboard/dim-icon"

/* Every dimension the product tracks today, with the question it
   answers. The chips carry product-real sample values, rendered by the
   same DimensionIcon the dashboard uses. */

type Dim = {
  key: string
  name: string
  samples: string[]
  answers: string
}

const DIMENSIONS: Dim[] = [
  {
    key: "country",
    name: "Country",
    samples: ["DE", "US", "JP"],
    answers:
      "Where the audience actually is. The market you localize for next, and the proof when a regional campaign lands.",
  },
  {
    key: "city",
    name: "City",
    samples: ["Berlin", "Tokyo", "San Francisco"],
    answers:
      "Sharper than country. Event traffic, out-of-home campaigns, and meetup posters show up as cities lighting up.",
  },
  {
    key: "referrer",
    name: "Referrer",
    samples: ["google.com", "discord.com", "news.ycombinator.com"],
    answers:
      "Which channel does the work. The tweet versus the newsletter versus the community post, settled with numbers.",
  },
  {
    key: "browser",
    name: "Browser",
    samples: ["Chrome", "Safari", "Firefox"],
    answers:
      "What to test against. When Safari is a third of your clicks, that rendering bug stops being a low priority.",
  },
  {
    key: "os",
    name: "Operating system",
    samples: ["iOS", "Android", "Windows"],
    answers:
      "Mobile or desk, Apple or not. Whether your landing page should lead with an App Store badge or a terminal command.",
  },
  {
    key: "short_code",
    name: "Link",
    samples: ["/launch", "/spring-promo", "/docs"],
    answers:
      "Which link, of all of yours, is carrying the quarter. Every dimension above can be scoped to just one of them.",
  },
]

export function Dimensions() {
  return (
    <>
      <Band rule className="px-5 py-24 sm:px-9 sm:py-32">
        <SectionHeading
          align="center"
          title={
            <>
              Six dimensions,{" "}
              <span className="font-normal font-serif text-muted-foreground italic">
                every one a filter.
              </span>
            </>
          }
          description="Everything below is tracked on every click and doubles as a scope: pick a value, and the whole board answers for just that slice."
        />
      </Band>

      <Band rule>
        <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 xl:grid-cols-3">
          {DIMENSIONS.map((d) => (
            <div
              key={d.key}
              className="flex flex-col gap-4 bg-background p-6 sm:p-7"
            >
              <div className="flex flex-wrap gap-1.5">
                {d.samples.map((s) => (
                  <span
                    key={s}
                    className="flex shrink-0 items-center gap-1.5 rounded-full bg-muted/60 px-2 py-0.5 font-mono text-[11px] text-muted-foreground tabular-nums"
                  >
                    <DimensionIcon
                      dimension={d.key}
                      value={s}
                      className="size-3.5 shrink-0"
                    />
                    {s}
                  </span>
                ))}
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm tracking-tight">
                  {d.name}
                </h3>
                <p className="mt-1.5 text-muted-foreground text-sm leading-relaxed">
                  {d.answers}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Band>
    </>
  )
}
