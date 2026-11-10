require("../jscript-runtime");

function H(s) {
  var counts = {};
  var len = s.length;
  var A = 0; // number of unique chars

  for (var i = 0; i < len; i++) {
    if (!counts[s[i]]) {
      counts[s[i]] = 0;
      A++;
    }
    counts[s[i]]++;
  }
  if (A == 1) return 0;

  var result = 0;
  for (var ch in counts) {
    var p = counts[ch] / len;
    result -= (p * Math.log(p)) / Math.log(A);
  }

  return result;
}

var s = "asdffdsa";

WSH.Echo(H(s));
