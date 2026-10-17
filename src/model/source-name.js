import { decode } from 'he';
/** Decode source encodings once. The returned string is always rendered as ordinary text. */
export function sourceName(value) {
  if (typeof value !== 'string') return value;
  return decode(value, { isAttributeValue: false, strict: false });
}
