require("../jscript-runtime");

import { readText } from "./3_search_substring.js";

function boyerMoore(s, t) {
  result = {
    indexes: [],
    count: 0,
  };
  t = t.split("");

  symbols = new Array();
  for (var k = 0; k < t.length; k++) {
    symbols[t[k]] = k;
  }

  var m = t.length;
  var n = s.length;

  var start = 0;

  while (start < n - m + 1) {
    sub = s.substr(start, m);
    sub = sub.split("");
    var flag = true;

    // Backward search
    for (var k = 0; k <= m; k++) {
      if (sub[m - k - 1] == t[m - k - 1]) {
        continue;
      }
      badSymbol = sub[m - k - 1];
      if (symbols[badSymbol]) {
        start += max(1, m - k - 1 - symbols[badSymbol]);
      } else {
        start += m - k - 1;
      }
      flag = false;
      break;
    }

    if (flag) {
      result.count++;
      result.indexes.length < 10 && result.indexes.push(start);
      start++;
    }
  }

  return result;
}

const max = (a, b) => (a > b ? a : b);

part1 = readText("~/Developer/uni/scripts/problem/wap1.txt");
part2 = readText("~/Developer/uni/scripts/problem/wap2.txt");
part3 = readText("~/Developer/uni/scripts/problem/wap3.txt");
part4 = readText("~/Developer/uni/scripts/problem/wap4.txt");

// 1 (part 1 & target = "князь)
WSH.Echo("1");
target = "князь";
start = new Date();
result = boyerMoore(part1, target);
end = new Date();
WSH.Echo("A - indexes =", result.indexes);
WSH.Echo("B - count =", result.count);
WSH.Echo("C - collisions =", result.collisions);
WSH.Echo("D - time =", end - start);

WSH.Echo();
WSH.Echo();
WSH.Echo();

// 2 (part 2 & target = "князь" parts 1, 2, 3, 4)
WSH.Echo("2");
target = "князь";
start = new Date();
result = boyerMoore(part1 + part2 + part3 + part4, target);
end = new Date();
WSH.Echo("A - indexes =", result.indexes);
WSH.Echo("B - count =", result.count);
WSH.Echo("C - collisions =", result.collisions);
WSH.Echo("D - time =", end - start);

WSH.Echo();
WSH.Echo();
WSH.Echo();

// 3 (part 3 & target = "князь андрей")
WSH.Echo(3);
target = "князь андрей";
start = new Date();
result = boyerMoore(part1 + part2, target);
end = new Date();
WSH.Echo("A - indexes =", result.indexes);
WSH.Echo("B - count =", result.count);
WSH.Echo("C - collisions =", result.collisions);
WSH.Echo("D - time =", end - start);

WSH.Echo();
WSH.Echo();
WSH.Echo();

// 4 (part 4 & target = "князь андрей болконский")
WSH.Echo("3");
target = "князь андрей болконский";
WSH.Echo("Brute force");
start = new Date();
result = boyerMoore(part1 + part2 + part3 + part4, target);
end = new Date();
WSH.Echo("A - indexes =", result.indexes);
WSH.Echo("B - count =", result.count);
WSH.Echo("C - collisions =", result.collisions);
WSH.Echo("D - time =", end - start);
