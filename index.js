#!/usr/bin/env node
import { program } from "commander";
import { promises as fs } from "fs";
import * as path from "path";

program.version("1.0.0").description("Sync dll,views,comps in pms5");

const baseUrl = "E:/HMS/ServerApp/";
//const baseUrl = "E:/PmsSyncTest/";

const subSystems = [
  {
    name: "Web",
    option: "-w,--web",
    flag: "web",
    dir: "HMS.WebUI",
    sort: 1,
    bin: ["HMS.WebUI.XML"],
  },
  {
    name: "Mach",
    option: "-m,--mach",
    flag: "mach",
    dir: "HMS.MachLib.Web",
    sort: 2,
    bin: [
      "HMS.MachLib.Web.dll",
      "HMS.MachLib.Web.XML",
      "HMS.MachLib.Logic.dll",
      "HMS.MachLib.Data.dll",
      "HY.DV.DataContract.dll",

      "HMS.MachLib.Web.pdb",
      "HMS.MachLib.Logic.pdb",
      "HMS.MachLib.Data.pdb",
      "HY.DV.DataContract.pdb",
    ],
  },
  {
    name: "Rtms",
    option: "-r,--rtms",
    flag: "rtms",
    dir: "HMS.RTMS.Web",
    sort: 3,
    bin: [
      "HMS.RTMS.Web.dll",
      "HMS.RTMS.Web.XML",
      "HMS.RTMS.Logic.dll",
      "HMS.RTMS.Data.dll",
      "RTDataStoreLib.dll",

      "HMS.RTMS.Web.pdb",
      "HMS.RTMS.Logic.pdb",
      "HMS.RTMS.Data.pdb",
      "RTDataStoreLib.pdb",
    ],
  },
  {
    name: "BI",
    option: "-b,--bi",
    flag: "bi",
    dir: "HMS.BI.Web",
    sort: 4,
    bin: [
      "HMS.BI.Web.dll",
      "HMS.BI.Web.XML",
      "HMS.BI.Logic.dll",
      "HMS.BI.Data.dll",
      "HMS.BI.Dal.dll",

      "HMS.BI.Web.pdb",
      "HMS.BI.Logic.pdb",
      "HMS.BI.Data.pdb",
      "HMS.BI.Dal.pdb",
    ],
  },
  {
    name: "DV",
    option: "-d,--dv",
    flag: "dv",
    dir: "HY.DV.Charts",
    sort: 4,
    bin: ["HY.DV.Charts.dll", "HY.DV.Charts.pdb"],
  },
];

for (let item of subSystems) {
  item.dir = baseUrl + item.dir;
  item.pubdir = item.dir + "/bin/app.publish/";
  program.option(item.option, item.name);
}

function sync(target) {
  if (target == "all") {
    syncAll();
  } else {
    syncSingle(target);
  }
}

function syncSingle(t) {
  let sources = subSystems.filter((s) => s.flag !== t).sort((s) => s.sort);
  let target = subSystems.find((s) => s.flag == t);
  let targetDir = target.dir;

  sources.forEach(async (source) => {
    let items = await fs.readdir(source.pubdir, { withFileTypes: true });
    items = items.filter((item) => item.isDirectory());
    items.forEach(async (item) => {
      if (item.name !== "bin") {
        let sourceDir = path.join(item.parentPath, item.name);
        await copyFolder(sourceDir, path.join(targetDir, item.name));
      } else {
        source.bin.forEach(async (f) => {
          let sourceFile = path.join(source.dir, "bin", f);
          let targetFile = path.join(targetDir, "bin", f);
          console.log("CopyBin", sourceFile, targetFile);

          await fs.copyFile(path.join(sourceFile), path.join(targetFile));
        });
      }
    });
  });
}

async function copyFolder(sourceDir, targetDir) {
  //console.log("Copy:" + sourceDir + " ==> " + targetDir);
  try {
    await fs.mkdir(targetDir, { recursive: true });
    const items = await fs.readdir(sourceDir, { withFileTypes: true });
    items.forEach(async (item) => {
      if (item.isDirectory()) {
        await copyFolder(
          path.join(item.parentPath, item.name),
          path.join(targetDir, item.name),
        );
      } else {
        console.log(
          "CopyFiles:" + path.join(item.parentPath, item.name),
          "  ==> " + path.join(targetDir, item.name),
        );
        await fs.copyFile(
          path.join(item.parentPath, item.name),
          path.join(targetDir, item.name),
        );
      }
    });
  } catch (e) {
    console.error(e);
  }
}

function syncAll() {
  subSystems.forEach((s) => {
    syncSingle(s.flag);
  });
}

program.option("-a,--all", "Sync all").action((str, options) => {
  if (str.all) {
    sync("all");
  } else if (str.web) {
    sync("web");
  } else if (str.mach) {
    sync("mach");
  } else if (str.rtms) {
    sync("rtms");
  } else if (str.bi) {
    sync("bi");
  } else if (str.dv) {
    sync("dv");
  } else {
    console.log("Do nothing!");
  }
});

program.parse(process.argv);
