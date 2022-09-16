const untilEndOfLineCaptureGroup = `([\\p{L}\\p{N}\\p{P} \\t]*)`;

export const regexCapturePatterns = {
  colonSeparatedKeyValuePair: (term: string) =>
    new RegExp(`(?:${term}:\\s*)${untilEndOfLineCaptureGroup}`, "u"),
};
