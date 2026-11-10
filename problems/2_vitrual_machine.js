require("../jscript-runtime");

function factorial(n) {
  if (n == 0) {
    return 1;
  } else {
    return n * factorial(n - 1);
  }
}

function GreatestCommonDivisor(a, b) {
  if (b == 0) {
    return a;
  } else {
    return GreatestCommonDivisor(b, a % b);
  }
}

var path = WScript.Arguments.Item(0);
if (!path) {
  WSH.Echo("Error: no path");
  exit();
}

var shell = new ActiveXObject("WScript.Shell");
var cwd = shell.CurrentDirectory;
path = cwd + "/" + path;

var mem = new Array();
fso = new ActiveXObject("Scripting.FileSystemObject");
text_prog = fso.OpenTextFile(path);
var s = "";

while (!text_prog.AtEndOfStream) {
  s += text_prog.ReadLine() + " ";
}
text_prog.Close();
s = s.trim() + " exit";
mem = s.split(" ");
ip = 0;
var vars = new Array();

var stop = false;
while (mem[ip] != "exit" && !stop) {
  switch (mem[ip]) {
    case "exit":
      console.log("exit");
      stop = true;
      break;
    case "input":
      if (Number.isInteger(mem[ip + 1])) {
        WSH.Echo("Error: number cannot be used as a variable name");
        stop = true;
      }
      WSH.Echo("input:");
      vars[mem[ip + 1]] = WScript.StdIn.ReadLine();
      ip += 2;
      break;
    case "factorial":
      if (mem[ip + 1] in vars) {
        mem[ip + 1] = vars[mem[ip + 1]];
      }
      n = parseInt(mem[ip + 1]);
      WSH.Echo(factorial(n));
      ip += 2;
      break;
    case "gcd":
      if (mem[ip + 1] in vars) {
        mem[ip + 1] = vars[mem[ip + 1]];
      }
      if (mem[ip + 2] in vars) {
        mem[ip + 2] = vars[mem[ip + 2]];
      }
      a = parseInt(mem[ip + 1]);
      b = parseInt(mem[ip + 2]);
      WSH.Echo(GreatestCommonDivisor(a, b));
      ip += 3;
      break;
    default:
      WSH.Echo("Error: unknown command " + mem[ip] + " " + ip);
      for (var i = 0; i < mem.length; i++) {
        WSH.Echo(i, mem[i]);
      }
      stop = true;
      break;
  }
}

// только ветветлия и goto
