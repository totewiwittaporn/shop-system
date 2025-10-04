import assert from "node:assert/strict";
import test from "node:test";

import { cn } from "./utils";

test("merges class names while ignoring falsy values", () => {
  assert.equal(cn("px-2", undefined, "", "py-1", false), "px-2 py-1");
});

test("applies tailwind-merge conflict resolution", () => {
  assert.equal(cn("text-sm", "text-lg"), "text-lg");
});