// все в таблицу
require("../jscript-runtime");

function checkSum(s) {
  s = s.split("");
  var sum = 0;
  for (var i = 0; i < s.length; i++) {
    sum += getAsciiCode(s[i]);
  }
  return sum;
}

function nextCheckSum(prevString, prevCheckSum, s) {
  s = s.split("");
  prevString = prevString.split("");
  return (
    prevCheckSum + getAsciiCode(s[s.length - 1]) - getAsciiCode(prevString[0])
  );
}

function checkSumSquared(s) {
  s = s.split("");
  var sum = 0;
  for (var i = 0; i < s.length; i++) {
    code = getAsciiCode(s[i]);
    sum += code * code;
  }
  return sum;
}

function nextCheckSumSquared(prevString, prevCheckSum, s) {
  s = s.split("");
  prevString = prevString.split("");
  return (
    prevCheckSum +
    getAsciiCode(s[s.length - 1]) * getAsciiCode(s[s.length - 1]) -
    getAsciiCode(prevString[0]) * getAsciiCode(prevString[0])
  );
}

function checkSumRabinKarp(s) {
  s = s.split("");
  var sum = 0;
  var mult = 2;
  for (var i = 0; i < s.length; i++) {
    code = getAsciiCode(s[i]);
    sum += code * mult;
    mult <<= 1;
  }
  return sum;
}

function nextCheckSumRabinKarp(prevString, prevCheckSum, s) {
  s = s.split("");
  prevString = prevString.split("");
  return (
    (prevCheckSum - getAsciiCode(prevString[0]) * 2) / 2 +
    getAsciiCode(s[s.length - 1]) * (2 << (s.length - 1))
  );
}

function compare(s, t) {
  s = s.split("");
  t = t.split("");

  for (var i = 0; i < s.length; i++) {
    if (s[i] != t[i]) {
      return false;
    }
  }
  return true;
}

function getAsciiCode(sym) {
  if (sym.length > 1) return -1;

  return sym.charCodeAt(0);
}

function bruteForce(s, t) {
  var result = {
    indexes: [],
    count: 0,
    collisions: 0,
  };

  var n = s.length;
  var m = t.length;
  for (var i = 0; i < n - m + 1; i++) {
    var sub = s.substr(i, m);

    if (compare(sub, t)) {
      result.count++;
      result.indexes.length < 10 && result.indexes.push(i);
    }
  }
  return result;
}

// @param s - string to search
// @param t - substring to search
// @param checkSumFunc - function to calculate checksum
// @return - {
//   count: number of substrings found,
//   collisions: number of collisions
// }
function findSubstrings(s, t, checkSumFunc, nextCheckSumFunc) {
  var targetCheckSum = checkSumFunc(t);
  var result = {
    indexes: [],
    count: 0,
    collisions: 0,
  };

  var n = s.length;
  var m = t.length;
  var lastChecksum = 0;
  var lastSubstring = "";

  for (var i = 0; i < n - m + 1; i++) {
    var sub = s.substr(i, m);

    // Recurrent call of the function for getting checksum
    var checksum =
      i == 0
        ? checkSumFunc(sub)
        : nextCheckSumFunc(lastSubstring, lastChecksum, sub);

    if (checksum == targetCheckSum) {
      if (compare(sub, t)) {
        result.count++;
        result.indexes.length < 10 && result.indexes.push(i);
      } else {
        result.collisions++;
      }
    }
    lastChecksum = checksum;
    lastSubstring = sub;
  }
  return result;
}

function readText(filePath) {
  var fso = WSH.CreateObject("Scripting.FileSystemObject");
  var file = fso.OpenTextFile(filePath, 1);

  var text = file.ReadAll();
  file.Close();

  return text.replace(/\r\n|\r|\n/g, " ");
}

part1 = readText("wap1.txt");
part2 = readText("wap2.txt");
part3 = readText("wap3.txt");
part4 = readText("wap4.txt");

// 1 (part 1 & target = "князь)
WSH.Echo("1");
target = "князь";
WSH.Echo("Brute force");
start = new Date();
result = bruteForce(part1, target);
end = new Date();
WSH.Echo("A - indexes =", result.indexes);
WSH.Echo("B - count =", result.count);
WSH.Echo("C - collisions =", result.collisions);
WSH.Echo("D - time =", end - start);

WSH.Echo();

WSH.Echo("Check sum");
start = new Date();
result = findSubstrings(part1, target, checkSum, nextCheckSum);
end = new Date();
WSH.Echo("A - indexes =", result.indexes);
WSH.Echo("B - count =", result.count);
WSH.Echo("C - collisions =", result.collisions);
WSH.Echo("D - time =", end - start);

WSH.Echo();

WSH.Echo("Squared check sum");
start = new Date();
result = findSubstrings(part1, target, checkSumSquared, nextCheckSumSquared);
end = new Date();
WSH.Echo("A - indexes =", result.indexes);
WSH.Echo("B - count =", result.count);
WSH.Echo("C - collisions =", result.collisions);
WSH.Echo("D - time =", end - start);

WSH.Echo();

WSH.Echo("Rabin-Karp check sum");
start = new Date();
result = findSubstrings(
  part1,
  target,
  checkSumRabinKarp,
  nextCheckSumRabinKarp,
);
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
WSH.Echo("Brute force");
start = new Date();
result = bruteForce(part1 + part2, target);
end = new Date();
WSH.Echo("A - indexes =", result.indexes);
WSH.Echo("B - count =", result.count);
WSH.Echo("C - collisions =", result.collisions);
WSH.Echo("D - time =", end - start);

WSH.Echo();

WSH.Echo("Check sum");
start = new Date();
result = findSubstrings(part1 + part2, target, checkSum, nextCheckSum);
end = new Date();
WSH.Echo("A - indexes =", result.indexes);
WSH.Echo("B - count =", result.count);
WSH.Echo("C - collisions =", result.collisions);
WSH.Echo("D - time =", end - start);

WSH.Echo();

WSH.Echo("Squared check sum");
start = new Date();
result = findSubstrings(
  part1 + part2,
  target,
  checkSumSquared,
  nextCheckSumSquared,
);
end = new Date();
WSH.Echo("A - indexes =", result.indexes);
WSH.Echo("B - count =", result.count);
WSH.Echo("C - collisions =", result.collisions);
WSH.Echo("D - time =", end - start);

WSH.Echo();

WSH.Echo("Rabin-Karp check sum");
start = new Date();
result = findSubstrings(
  part1 + part2,
  target,
  checkSumRabinKarp,
  nextCheckSumRabinKarp,
);
end = new Date();
WSH.Echo("A - indexes =", result.indexes);
WSH.Echo("B - count =", result.count);
WSH.Echo("C - collisions =", result.collisions);
WSH.Echo("D - time =", end - start);

WSH.Echo();
WSH.Echo();
WSH.Echo();

// 3 (part 3 & target = "князь андрей болконский")
WSH.Echo("3");
target = "князь андрей болконский";
WSH.Echo("Brute force");
start = new Date();
result = bruteForce(part1 + part2 + part3 + part4, target);
end = new Date();
WSH.Echo("A - indexes =", result.indexes);
WSH.Echo("B - count =", result.count);
WSH.Echo("C - collisions =", result.collisions);
WSH.Echo("D - time =", end - start);

WSH.Echo();

WSH.Echo("Check sum");
start = new Date();
result = findSubstrings(
  part1 + part2 + part3 + part4,
  target,
  checkSum,
  nextCheckSum,
);
end = new Date();
WSH.Echo("A - indexes =", result.indexes);
WSH.Echo("B - count =", result.count);
WSH.Echo("C - collisions =", result.collisions);
WSH.Echo("D - time =", end - start);

WSH.Echo();

WSH.Echo("Squared check sum");
start = new Date();
result = findSubstrings(
  part1 + part2 + part3 + part4,
  target,
  checkSumSquared,
  nextCheckSumSquared,
);
end = new Date();
WSH.Echo("A - indexes =", result.indexes);
WSH.Echo("B - count =", result.count);
WSH.Echo("C - collisions =", result.collisions);
WSH.Echo("D - time =", end - start);

WSH.Echo();

WSH.Echo("Rabin-Karp check sum");
start = new Date();
result = findSubstrings(
  part1 + part2 + part3 + part4,
  target,
  checkSumRabinKarp,
  nextCheckSumRabinKarp,
);
end = new Date();
WSH.Echo("A - indexes =", result.indexes);
WSH.Echo("B - count =", result.count);
WSH.Echo("C - collisions =", result.collisions);
WSH.Echo("D - time =", end - start);

// 4
var s = "";
for (var i = 0; i < 1000000; i++) {
  s += "a";
}

var t1 = "b";
for (var i = 0; i < 100; i++) {
  t1 += "a";
}

var t2 = "";
for (var i = 0; i < 100; i++) {
  t2 += "a";
}
t2 += "b";
// все алгоритмы
