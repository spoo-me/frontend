import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  clearDraft,
  stashDraft,
  takeComposerDraft,
  takeLinkDraft,
} from "./draft-stash"
import type { ComposerDraft } from "@/components/dashboard/links/composer"
import type { LinkDraft } from "@/components/dashboard/links/link-settings-form"

const composerDraft = { longUrl: "https://a.example", tab: "targeting" }
const linkDraft = { longUrl: "https://b.example", alias: "b" }

beforeEach(() => {
  const store = new Map<string, string>()
  vi.stubGlobal("window", {
    sessionStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
  })
})

describe("draft stash", () => {
  it("hands the composer draft back once", () => {
    stashDraft({ kind: "composer", draft: composerDraft as ComposerDraft })
    expect(takeComposerDraft()).toEqual(composerDraft)
    expect(takeComposerDraft()).toBeNull()
  })

  it("hands a link draft back only to its link, and leaves it for others", () => {
    stashDraft({ kind: "link", id: "l1", draft: linkDraft as LinkDraft })
    expect(takeLinkDraft("l2")).toBeNull()
    expect(takeComposerDraft()).toBeNull()
    expect(takeLinkDraft("l1")).toEqual(linkDraft)
    expect(takeLinkDraft("l1")).toBeNull()
  })

  it("survives garbage and a cleared slot", () => {
    window.sessionStorage.setItem("spoo:upsell:draft", "{not json")
    expect(takeComposerDraft()).toBeNull()
    stashDraft({ kind: "composer", draft: composerDraft as ComposerDraft })
    clearDraft()
    expect(takeComposerDraft()).toBeNull()
  })
})
