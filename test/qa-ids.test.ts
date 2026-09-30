import { describe, expect, it } from "vitest";
import { findingId } from "../tools/qa/ids";

describe("findingId", () => {
  it("dépend du contrôle, de la scène et de l'élément", () => {
    const id = findingId("petit-texte", "a", "p|Bonjour");
    expect(id).toMatch(/^[0-9a-f]{8}$/);
    expect(findingId("petit-texte", "a", "p|Bonjour")).toBe(id);
    expect(findingId("petit-texte", "b", "p|Bonjour")).not.toBe(id);
    expect(findingId("petit-texte", null, "p|Bonjour")).not.toBe(id);
    expect(findingId("contraste", "a", "p|Bonjour")).not.toBe(id);
    expect(findingId("petit-texte", "a", "p|Bonsoir")).not.toBe(id);
  });
});
