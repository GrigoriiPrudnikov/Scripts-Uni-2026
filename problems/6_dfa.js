require("../jscript-runtime");

WScript.Echo("Enter string");
s = WScript.StdIn.ReadLine();
WScript.Echo("Enter target string");
t = WScript.StdIn.ReadLine();
//t='abaxabaz'
m = t.length;
alph = new Array();

//Определяем алфавит строки t
for (i = 0; i < m; i++) alph[t.charAt(i)] = 0;
//В двумерном массиве del храним таблицу переходов
del = new Array(m + 1);
for (j = 0; j <= m; j++) del[j] = new Array();

//Инициализируем таблицу переходов
for (i in alph) del[0][i] = 0;

//Формируем таблицу переходов
for (j = 0; j < m; j++) {
  prev = del[j][t.charAt(j)];
  del[j][t.charAt(j)] = j + 1;
  for (i in alph) del[j + 1][i] = del[prev][i];
}

//Выводим таблицу переходов
for (j = 0; j <= m; j++) {
  out = "";
  for (i in alph) out += del[j][i] + " ";
  WScript.Echo(out);
}

state = 0;
positions = new Array();
count = 0;
for (k = 0; k < s.length; k++) {
  c = s.charAt(k);
  if (c in alph) state = del[state][c];
  else state = 0; // no symbol in alphabet -> reset
  if (state == m) {
    positions.push(k - m + 1);
    count++;
  }
}

WScript.Echo("Positions:", positions);
WScript.Echo("Count:", count);
