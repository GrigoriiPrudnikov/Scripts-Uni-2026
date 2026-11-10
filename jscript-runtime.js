"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const cp = require("child_process");

// ============================================================
// Constants
// ============================================================

const ForReading = 1;
const ForWriting = 2;
const ForAppending = 8;

const TristateUseDefault = -2;
const TristateTrue = -1;
const TristateFalse = 0;

// ============================================================
// Helpers
// ============================================================

function sleep(milliseconds) {
  const end = Date.now() + Number(milliseconds);

  while (Date.now() < end) {
    // WScript.Sleep is synchronous.
  }
}

function normalizePath(value) {
  return path.resolve(String(value));
}

// ============================================================
// WScript.Arguments
// ============================================================

function createCollection(items) {
  const collection = function (index) {
    return items[Number(index)];
  };

  Object.defineProperties(collection, {
    Count: {
      enumerable: true,
      get() {
        return items.length;
      },
    },

    Length: {
      enumerable: true,
      get() {
        return items.length;
      },
    },
  });

  collection.Item = function (index) {
    return items[Number(index)];
  };

  return collection;
}

function parseNamedArguments(args) {
  const named = [];
  const unnamed = [];

  for (const arg of args) {
    // WSH named argument:
    //
    // /Name:Value
    //
    // The name is everything between "/" and ":".

    if (arg.startsWith("/")) {
      const colon = arg.indexOf(":");

      if (colon > 1) {
        const name = arg.slice(1, colon);
        const value = arg.slice(colon + 1);

        named.push({
          name,
          value,
          original: arg,
        });

        continue;
      }
    }

    unnamed.push(arg);
  }

  return {
    named,
    unnamed,
  };
}

function createArguments() {
  const args = process.argv.slice(2);

  const parsed = parseNamedArguments(args);

  // The collection itself is callable:
  //
  // WScript.Arguments(0)
  //
  const collection = createCollection(args);

  // --------------------------------------------------------
  // Named
  // --------------------------------------------------------

  const namedItems = parsed.named.map((x) => x.value);

  const named = createCollection(namedItems);

  named.Exists = function (name) {
    return parsed.named.some(
      (x) => x.name.toLowerCase() === String(name).toLowerCase(),
    );
  };

  named.Item = function (name) {
    const item = parsed.named.find(
      (x) => x.name.toLowerCase() === String(name).toLowerCase(),
    );

    return item ? item.value : undefined;
  };

  // --------------------------------------------------------
  // Unnamed
  // --------------------------------------------------------

  const unnamed = createCollection(parsed.unnamed);

  collection.Named = named;
  collection.Unnamed = unnamed;

  return collection;
}

// ============================================================
// WScript.StdOut
// ============================================================

const StdOut = {
  Write(value) {
    process.stdout.write(String(value));
  },

  WriteLine(value = "") {
    process.stdout.write(String(value) + "\r\n");
  },
};

// ============================================================
// WScript.StdErr
// ============================================================

const StdErr = {
  Write(value) {
    process.stderr.write(String(value));
  },

  WriteLine(value = "") {
    process.stderr.write(String(value) + "\r\n");
  },
};

// ============================================================
// WScript.StdIn
// ============================================================

const StdIn = {
  ReadLine() {
    const chunks = [];

    const buffer = Buffer.alloc(1);

    while (true) {
      const bytes = fs.readSync(0, buffer, 0, 1, null);

      if (bytes === 0) {
        break;
      }

      const char = buffer.toString("utf8");

      if (char === "\n") {
        break;
      }

      if (char !== "\r") {
        chunks.push(char);
      }
    }

    return chunks.join("");
  },

  ReadAll() {
    const chunks = [];
    const buffer = Buffer.alloc(4096);

    while (true) {
      let bytes;

      try {
        bytes = fs.readSync(0, buffer, 0, buffer.length, null);
      } catch {
        break;
      }

      if (bytes === 0) {
        break;
      }

      chunks.push(Buffer.from(buffer.subarray(0, bytes)));
    }

    return Buffer.concat(chunks).toString("utf8");
  },

  get AtEndOfStream() {
    return false;
  },
};

// ============================================================
// TextStream
// ============================================================

class TextStream {
  constructor(filePath, mode, format) {
    this.filePath = filePath;
    this.mode = mode;
    this.format = format;
    this.closed = false;

    if (mode === ForReading) {
      this.content = fs.readFileSync(filePath, "utf8");

      this.position = 0;
    } else {
      this.content = "";
      this.position = 0;
    }
  }

  _checkClosed() {
    if (this.closed) {
      throw new Error("TextStream is closed");
    }
  }

  _checkReading() {
    if (this.mode !== ForReading) {
      throw new Error("TextStream is not opened for reading");
    }
  }

  _checkWriting() {
    if (this.mode !== ForWriting && this.mode !== ForAppending) {
      throw new Error("TextStream is not opened for writing");
    }
  }

  Read(characters) {
    this._checkClosed();
    this._checkReading();

    const count = Number(characters);

    const result = this.content.slice(this.position, this.position + count);

    this.position += result.length;

    return result;
  }

  ReadLine() {
    this._checkClosed();
    this._checkReading();

    if (this.AtEndOfStream) {
      return "";
    }

    let end = this.content.indexOf("\n", this.position);

    if (end === -1) {
      end = this.content.length;
    }

    let line = this.content.slice(this.position, end);

    if (line.endsWith("\r")) {
      line = line.slice(0, -1);
    }

    this.position = end;

    if (this.position < this.content.length) {
      this.position++;
    }

    return line;
  }

  ReadAll() {
    this._checkClosed();
    this._checkReading();

    const result = this.content.slice(this.position);

    this.position = this.content.length;

    return result;
  }

  Write(text) {
    this._checkClosed();
    this._checkWriting();

    fs.appendFileSync(this.filePath, String(text), "utf8");
  }

  WriteLine(text = "") {
    this.Write(String(text) + "\r\n");
  }

  WriteBlankLines(lines) {
    this._checkClosed();
    this._checkWriting();

    this.Write("\r\n".repeat(Number(lines)));
  }

  Skip(characters) {
    this._checkClosed();
    this._checkReading();

    this.position = Math.min(
      this.position + Number(characters),
      this.content.length,
    );
  }

  SkipLine() {
    this.ReadLine();
  }

  Close() {
    this.closed = true;
  }

  get AtEndOfStream() {
    if (this.mode !== ForReading) {
      return false;
    }

    return this.position >= this.content.length;
  }

  get Line() {
    if (this.mode !== ForReading) {
      return 1;
    }

    return (this.content.slice(0, this.position).match(/\n/g) || []).length + 1;
  }

  get Column() {
    if (this.mode !== ForReading) {
      return 1;
    }

    const lastNewLine = this.content.lastIndexOf("\n", this.position - 1);

    return this.position - lastNewLine;
  }
}

// ============================================================
// FileSystemObject
// ============================================================

const FileSystemObject = {
  FileExists(file) {
    try {
      return fs.statSync(normalizePath(file)).isFile();
    } catch {
      return false;
    }
  },

  FolderExists(folder) {
    try {
      return fs.statSync(normalizePath(folder)).isDirectory();
    } catch {
      return false;
    }
  },

  CreateFolder(folder) {
    fs.mkdirSync(normalizePath(folder), {
      recursive: true,
    });
  },

  CreateTextFile(file, overwrite = true, format = TristateUseDefault) {
    const filePath = normalizePath(file);

    if (!overwrite && fs.existsSync(filePath)) {
      throw new Error(`File already exists: ${filePath}`);
    }

    fs.mkdirSync(path.dirname(filePath), {
      recursive: true,
    });

    fs.writeFileSync(filePath, "", "utf8");

    return new TextStream(filePath, ForWriting, format);
  },

  OpenTextFile(
    file,
    iomode = ForReading,
    create = false,
    format = TristateUseDefault,
  ) {
    const filePath = normalizePath(file);

    if (create && !fs.existsSync(filePath)) {
      fs.mkdirSync(path.dirname(filePath), {
        recursive: true,
      });

      fs.writeFileSync(filePath, "", "utf8");
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }

    if (iomode === ForReading) {
      return new TextStream(filePath, ForReading, format);
    }

    if (iomode === ForWriting) {
      fs.writeFileSync(filePath, "", "utf8");

      return new TextStream(filePath, ForWriting, format);
    }

    if (iomode === ForAppending) {
      return new TextStream(filePath, ForAppending, format);
    }

    throw new Error(`Invalid I/O mode: ${iomode}`);
  },

  DeleteFile(file, force = false) {
    const filePath = normalizePath(file);

    if (!this.FileExists(filePath)) {
      if (force) {
        return;
      }

      throw new Error(`File does not exist: ${filePath}`);
    }

    fs.unlinkSync(filePath);
  },

  DeleteFolder(folder, force = false) {
    const folderPath = normalizePath(folder);

    if (!this.FolderExists(folderPath)) {
      if (force) {
        return;
      }

      throw new Error(`Folder does not exist: ${folderPath}`);
    }

    fs.rmSync(folderPath, {
      recursive: true,
      force: true,
    });
  },

  CopyFile(source, destination, overwrite = true) {
    const src = normalizePath(source);
    const dst = normalizePath(destination);

    if (!overwrite && fs.existsSync(dst)) {
      throw new Error(`Destination already exists: ${dst}`);
    }

    fs.mkdirSync(path.dirname(dst), {
      recursive: true,
    });

    fs.copyFileSync(src, dst);
  },

  MoveFile(source, destination) {
    const src = normalizePath(source);
    const dst = normalizePath(destination);

    fs.mkdirSync(path.dirname(dst), {
      recursive: true,
    });

    fs.renameSync(src, dst);
  },

  GetAbsolutePathName(file) {
    return normalizePath(file);
  },

  GetFileName(file) {
    return path.basename(String(file));
  },

  GetBaseName(file) {
    return path.basename(String(file), path.extname(String(file)));
  },

  GetExtensionName(file) {
    return path.extname(String(file)).replace(/^\./, "");
  },

  GetParentFolderName(file) {
    return path.dirname(normalizePath(file));
  },

  GetDriveName(file) {
    return path.parse(normalizePath(file)).root;
  },

  BuildPath(parent, child) {
    return path.join(String(parent), String(child));
  },

  GetTempName() {
    return "tmp" + Math.random().toString(36).slice(2, 10) + ".tmp";
  },

  GetSpecialFolder(folder) {
    /*
     * 0 = WindowsFolder
     * 1 = SystemFolder
     * 2 = TemporaryFolder
     *
     * On macOS/Linux there is no exact equivalent
     * for the first two, so "/" is used.
     */

    switch (Number(folder)) {
      case 2:
        return os.tmpdir();

      case 1:
        return path.parse(process.execPath).root;

      case 0:
        return path.parse(process.execPath).root;

      default:
        throw new Error(`Invalid special folder: ${folder}`);
    }
  },
};

// ============================================================
// WScript.Shell Environment collection
// ============================================================

function createEnvironmentCollection() {
  const names = Object.keys(process.env);

  const collection = function (name) {
    return process.env[name];
  };

  collection.Item = function (name) {
    return process.env[name];
  };

  Object.defineProperty(collection, "Count", {
    enumerable: true,
    get() {
      return names.length;
    },
  });

  Object.defineProperty(collection, "Length", {
    enumerable: true,
    get() {
      return names.length;
    },
  });

  collection.toArray = function () {
    return names.map((name) => `${name}=${process.env[name]}`);
  };

  return collection;
}

// ============================================================
// WScript.Shell
// ============================================================

const WshShell = {
  get CurrentDirectory() {
    return process.cwd();
  },

  set CurrentDirectory(value) {
    process.chdir(normalizePath(value));
  },

  Environment(type = "PROCESS") {
    return createEnvironmentCollection();
  },

  ExpandEnvironmentStrings(text) {
    return String(text).replace(/%([^%]+)%/g, (match, name) => {
      const key = Object.keys(process.env).find(
        (k) => k.toLowerCase() === name.toLowerCase(),
      );

      return key === undefined ? match : process.env[key];
    });
  },

  Run(command, windowStyle = 1, waitOnReturn = false) {
    if (waitOnReturn) {
      const result = cp.spawnSync(String(command), {
        shell: true,
        stdio: "inherit",
      });

      return result.status ?? 0;
    }

    const child = cp.spawn(String(command), {
      shell: true,
      detached: true,
      stdio: "ignore",
    });

    child.unref();

    return 0;
  },

  Exec(command) {
    const result = cp.spawnSync(String(command), {
      shell: true,
      encoding: "utf8",
    });

    return {
      StdOut: {
        ReadAll() {
          return result.stdout || "";
        },
      },

      StdErr: {
        ReadAll() {
          return result.stderr || "";
        },
      },

      Status: result.status ?? 0,

      ExitCode: result.status ?? 0,
    };
  },
};

// ============================================================
// WScript
// ============================================================

const WScript = {
  Echo(...values) {
    console.log(values.join(" "));
  },

  StdIn,

  StdOut,

  StdErr,

  Arguments: createArguments(),

  get ScriptFullName() {
    return path.resolve(process.argv[1] || "");
  },

  get ScriptName() {
    return path.basename(process.argv[1] || "");
  },

  // cscript.exe / node executable path
  get FullName() {
    return process.execPath;
  },

  // Compatibility value.
  // The real value is "cscript.exe" under cscript.
  get Name() {
    return "cscript.exe";
  },

  get Version() {
    return "5.8";
  },

  // In WSH this is the folder containing the host executable.
  get Path() {
    return path.dirname(process.execPath);
  },

  Sleep(milliseconds) {
    sleep(milliseconds);
  },

  Quit(exitCode = 0) {
    process.exit(Number(exitCode));
  },

  CreateObject(progId) {
    const id = String(progId).toLowerCase();

    switch (id) {
      case "wscript.shell":
        return WshShell;

      case "scripting.filesystemobject":
        return FileSystemObject;

      default:
        throw new Error(
          `Unsupported COM object: ${progId}\n` +
            `Node.js/macOS cannot provide this Windows COM object.`,
        );
    }
  },

  GetObject(name) {
    throw new Error(
      `WScript.GetObject("${name}") ` +
        `requires Windows COM and is not available here.`,
    );
  },
};

// ============================================================
// Global objects/constants
// ============================================================

global.WScript = WScript;

global.ForReading = ForReading;
global.ForWriting = ForWriting;
global.ForAppending = ForAppending;

global.TristateUseDefault = TristateUseDefault;
global.TristateTrue = TristateTrue;
global.TristateFalse = TristateFalse;

global.vbCr = "\r";
global.vbLf = "\n";
global.vbCrLf = "\r\n";

// ============================================================
// Exports
// ============================================================

module.exports = {
  WScript,
  WshShell,
  FileSystemObject,
};

// ============================================================
// Global WSH / WScript
// ============================================================

global.WScript = WScript;

// Алиас для твоих учебных программ.
// WSH -> WScript
global.WSH = WScript;

// ============================================================
// Constants
// ============================================================

global.ForReading = ForReading;
global.ForWriting = ForWriting;
global.ForAppending = ForAppending;

global.TristateUseDefault = TristateUseDefault;
global.TristateTrue = TristateTrue;
global.TristateFalse = TristateFalse;

global.vbCr = "\r";
global.vbLf = "\n";
global.vbCrLf = "\r\n";

global.ActiveXObject = function ActiveXObject(progId) {
  return WScript.CreateObject(progId);
};

// ============================================================
// Exports
// ============================================================

module.exports = {
  WScript,
  WSH: WScript,
  WshShell,
  FileSystemObject,
};
