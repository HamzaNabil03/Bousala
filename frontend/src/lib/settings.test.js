import test from "node:test";
import assert from "node:assert/strict";

import { mergeSettingsState, normalizeSettings } from "./settings.js";

test("fills missing toggle values with explicit booleans", () => {
  assert.deepEqual(normalizeSettings({ notify_new_matches: true }), {
    profile_visible: false,
    share_data_with_universities: false,
    notify_new_matches: true,
    notify_application_status: false,
    notify_news: false,
  });
});

test("preserves explicit false values when sending updates", () => {
  assert.deepEqual(normalizeSettings({ notify_application_status: false }), {
    profile_visible: false,
    share_data_with_universities: false,
    notify_new_matches: false,
    notify_application_status: false,
    notify_news: false,
  });
});

test("keeps the newest toggle state even if the API response is stale", () => {
  assert.deepEqual(
    mergeSettingsState({ notify_new_matches: false }, { notify_new_matches: false }, { notify_new_matches: true }),
    { notify_new_matches: true },
  );
});
