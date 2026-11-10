require("../jscript-runtime");

function escapeEncode(s, esc) {
  let res = "";
  let l = 0;

  while (l < s.length) {
    const ch = s[l];
    let r = l + 1;
    while (r < s.length && s[r] === ch) {
      r++;
    }
    let n = r - l;

    // compress substrings more than 3 symbols; escape symbol always compressed
    if (n > 3 || ch === esc) {
      while (n > 0) {
        const k = Math.min(n, 255);
        res += esc + getAsciiSymbol(k) + ch;
        n -= k;
      }
    } else {
      // skip substrings under 4 symbols
      for (let i = 0; i < n; i++) {
        res += ch;
      }
    }
    l = r;
  }

  return res;
}

function escapeDecode(s, esc) {
  let res = "";
  let n = 0;
  while (n < s.length) {
    if (s[n] !== esc) {
      res += s[n];
      n += 1;
    } else {
      const k = getAsciiNumber(s[n + 1]);
      for (let i = 0; i < k; i++) {
        res += s[n + 2];
      }
      n += 3;
    }
  }

  return res;
}
s = "abcc###dddddeefffffffffffffffffffff";
for (i = 0; i < 300; i++) {
  s += "g";
}
WSH.Echo("s =", s);
e = escapeEncode(s, "#");
WSH.Echo("encoded =", e);
d = escapeDecode(e, "#");
WSH.Echo("d =", d);
WSH.Echo(s == d);

function getAsciiSymbol(num) {
  return String.fromCharCode(num);
}
function getAsciiNumber(sym) {
  if (sym.length > 1) return -1;

  return sym.charCodeAt(0);
}

function jumpEncode(s) {
  l = 0;
  res = "";
  s = s.split("");

  while (l < s.length) {
    r = l + 1;

    // Find a repeating sequence, up to 127 characters.
    while (r < s.length && s[l] == s[r] && r - l < 127) {
      r++;
    }

    // Repeated sequence: flag bit is 1.
    if (r - l > 1) {
      res += getAsciiSymbol(128 + r - l);
      res += s[l];

      l = r;
    } else {
      r = l;

      // Collect literal characters until a repeated sequence begins.
      while (r < s.length && r - l < 127) {
        if (r + 1 < s.length && s[r] == s[r + 1]) {
          break;
        }

        r++;
      }

      // Literal sequence: flag bit is 0.
      res += getAsciiSymbol(r - l);

      while (l < r) {
        res += s[l];
        l++;
      }
    }
  }

  return res;
}

function jumpDecode(s) {
  res = "";
  s = s.split("");
  n = 0;

  while (n < s.length) {
    code = getAsciiNumber(s[n]);
    n++;

    // Repeated sequence: 128–255.
    if (code >= 128) {
      count = code - 128;
      symbol = s[n];

      for (i = 0; i < count; i++) {
        res += symbol;
      }

      n++;
    } else {
      // Literal sequence: 0–127.
      for (i = 0; i < code; i++) {
        res += s[n];
        n++;
      }
    }
  }

  return res;
}
WSH.Echo("s =", s);

e = jumpEncode(s, "#");
WSH.Echo("encoded =", e);

d = jumpDecode(e, "#");
WSH.Echo("d =", d);
WSH.Echo(s == d);
