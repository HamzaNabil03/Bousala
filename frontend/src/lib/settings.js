export function normalizeSettings(settings = {}) {
  const base = {
    profile_visible: false,
    share_data_with_universities: false,
    notify_new_matches: false,
    notify_application_status: false,
    notify_news: false,
  };

  return {
    ...base,
    ...Object.fromEntries(
      Object.entries(settings).map(([key, value]) => [key, Boolean(value)]),
    ),
  };
}

export function mergeSettingsState(currentSettings = {}, resultSettings = {}, preferredSettings = {}) {
  return {
    ...(currentSettings ?? {}),
    ...(resultSettings ?? {}),
    ...(preferredSettings ?? {}),
  };
}
