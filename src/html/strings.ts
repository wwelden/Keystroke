// Mirrors Go's strings.TrimSpace (unicode.IsSpace), which differs slightly from
// String.prototype.trim(): Go trims U+0085 but not U+FEFF.
const leadingSpace = /^[\t\n\v\f\r \u0085\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]+/;
const trailingSpace = /[\t\n\v\f\r \u0085\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]+$/;

export function trimSpace(s: string): string {
    return s.replace(leadingSpace, '').replace(trailingSpace, '');
}
