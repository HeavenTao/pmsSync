import { promises as fs } from "fs";
import { spawn } from "child_process";
import * as path from "path";
import os from "os";

var subSystems = [];
var baseUrl = "";

async function depoly() {
  for (let item of subSystems) {
    try {
      await compileAndDepoly(item);
      console.log(item.name + " compile done!");
    } catch (e) {
      console.log(e);
    }
  }
}

function compileAndDepoly(systemInfo) {
  return new Promise((resolve, reject) => {
    let command = spawn("msbuild.exe", [
      systemInfo.dir,
      "-p:DeployOnBuild=true",
      "-p:PublishProfile=FolderProfile",
    ]);

    let stdout = "";
    let stderr = "";

    command.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    command.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    command.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(stderr);
      }
    });

    command.on("error", (err) => {
      reject(err);
    });
  });
}

async function initData(program) {
  let data = await fs.readFile("./systemInfo.json", "utf8");
  let json = JSON.parse(data);
  subSystems = json.subSystems;
  baseUrl = json.winBaseUrl;

  if (os.platform() == "linux") {
    baseUrl = json.linuxBaseUrl;
  }

  for (let item of subSystems) {
    item.dir = baseUrl + item.dir;
    item.pubdir = item.dir + "/bin/app.publish/";
    program.option(item.option, item.name);
  }
}

async function sync(target) {
  if (target == "all") {
    await syncAll();
  } else {
    await syncSingle(target);
  }
  console.log("Sync Done!");
}

async function syncSingle(t) {
  let sources = subSystems.filter((s) => s.flag !== t).sort((s) => s.sort);
  let target = subSystems.find((s) => s.flag == t);
  let targetDir = target.dir;

  await Promise.all(
    sources.map(async (source) => {
      let items = await fs.readdir(source.pubdir, { withFileTypes: true });
      items = items.filter((item) => item.isDirectory());
      await Promise.all(
        items.map(async (item) => {
          if (item.name !== "bin") {
            let sourceDir = path.join(item.parentPath, item.name);
            await copyFolder(sourceDir, path.join(targetDir, item.name));
          } else {
            source.bin.forEach(async (f) => {
              let sourceFile = path.join(source.dir, "bin", f);
              let targetFile = path.join(targetDir, "bin", f);
              //console.log("CopyBin", sourceFile, targetFile);

              await fs.copyFile(path.join(sourceFile), path.join(targetFile));
            });
          }
        }),
      );
    }),
  );
}

async function copyFolder(sourceDir, targetDir) {
  //console.log("Copy:" + sourceDir + " ==> " + targetDir);
  try {
    await fs.mkdir(targetDir, { recursive: true });
    const items = await fs.readdir(sourceDir, { withFileTypes: true });
    await Promise.all(
      items.map(async (item) => {
        if (item.isDirectory()) {
          await copyFolder(
            path.join(item.parentPath, item.name),
            path.join(targetDir, item.name),
          );
        } else {
          //console.log(
          //  "CopyFiles:" + path.join(item.parentPath, item.name),
          //  "  ==> " + path.join(targetDir, item.name),
          //);
          await fs.copyFile(
            path.join(item.parentPath, item.name),
            path.join(targetDir, item.name),
          );
        }
      }),
    );
  } catch (e) {
    console.error(e);
  }
}

async function syncAll() {
  await Promise.all(
    subSystems.map((s) => {
      syncSingle(s.flag);
    }),
  );
}

export { sync, initData, depoly };
