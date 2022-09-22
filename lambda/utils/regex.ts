const untilEndOfLineCaptureGroup = `([\\p{L}\\p{N}\\p{P} \\t]*)`;

// TODO: Fix parsing os special case: LÄMPÖTILA: 32.30  °C
export const regexCapturePatterns = {
  colonSeparatedKeyValuePair: (term: string) =>
    new RegExp(`(?:${term}:\\s*)${untilEndOfLineCaptureGroup}`, 'u'),
};
