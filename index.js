#!/usr/bin/env node
import { program } from "commander";
import { depoly, initData, sync } from "./sync.js";

await initData(program);

program.version("1.0.0").description("Sync dll,views,comps in pms5");

program.option("-a,--all", "Sync all").action(async (str, options) => {
  await depoly();
  if (str.all) {
    await sync("all");
  } else if (str.web) {
    await sync("web");
  } else if (str.mach) {
    await sync("mach");
  } else if (str.rtms) {
    await sync("rtms");
  } else if (str.bi) {
    await sync("bi");
  } else if (str.dv) {
    await sync("dv");
  } else {
    console.log("Do nothing!");
  }
});

program.parse(process.argv);
