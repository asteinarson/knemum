import cmder, { Command } from "commander";

let cmds: { name: string, a1: string, a2: string, desc: string }[] = [
    {
        name: "join",
        desc: "Join together all input claims and print them out",
        a1: "files...",
        a2: null
    },
    {
        name: "possible",
        desc: "On this <candidate/DB>, see if <target> can be applied",
        a1: "candidate",
        a2: "target",
    },
    {
        name: "fulfills",
        desc: "See if <candidate/DB> fulfills <target>",
        a1: "candidate",
        a2: "target"
    },
    {
        name: "diff",
        desc: "See diff from <candidate/DB> to <target>",
        a1: "candidate",
        a2: "target"
    },
    {
        name: "info",
        desc: "Show info about this <state>",
        a1: "state",
        a2: null,
    },
    {
        name: "connect",
        desc: "Connect this <DB> to the given <state>",
        a1: "db",
        a2: "state",
    },
    {
        name: "apply",
        desc: "On this DB (or state), apply the claim/target",
        a1: "DB",
        a2: "target",
    },
    {
        name: "reverse",
        desc: "On this DB (or state), reverse the claim/target ",
        a1: "DB",
        a2: "target",
    },
];

function addCommandOptions(cmd: cmder.Command) {
    cmd.option("-i --internal", "Set outputs formating to internal - (instead of hrc - human readable compact)");
    cmd.option("-j --json", "Generate output in JSON - not in YAML");
    cmd.option("-p --path <paths...>", "Search path for input files and dependencies");
    cmd.option("-N --no-deps", "Do not read any dependencies - (not recommended, for debug)");
    cmd.option("-s --state <dir>", "Manage merged state in this dir (default: ./.dbstate)", "./.dbstate");
    cmd.option("--no-state", "Do not use a state dir, even if found");
    cmd.option("-X --exclude <patterns...>", "Exclude tables/columns according to this pattern");
    cmd.option("-I --include <patterns...>", "Include tables/columns according to this pattern");
}

let cmd = new Command();
for (let c of cmds) {
    if (c.a2) {
        // A two arg command
        let _c = cmd.command(`${c.name} <${c.a1}> <${c.a2}>`)
            .description(c.desc)
            .action((a1, a2, options) => { handle(c.name, a1, a2, options) })
        addCommandOptions(_c);
    } else {
        // A one arg command
        let _c = cmd.command(`${c.name} <${c.a1}>`)
            .description(c.desc)
            .action((a1, options) => { handleList(c.name, a1, options) })
        addCommandOptions(_c);
    }
}

cmd.parse(process.argv);

import { toNestedDict, reformat, matchDiff, dependencySort, mergeClaims } from './logic.js';
// This works for ES module 
import { dump as yamlDump } from 'js-yaml';
import pkg from 'lodash';
import { Dict, firstKey, isDict } from "./utils.js";
const { merge: ldMerge } = pkg;
//import {merge as ldMerge} from 'lodash-es'; // This adds load time

function logResult(r: Dict<any> | string[], options: any) {
    if (!Array.isArray(r)) {
        let output = options.json ? JSON.stringify(r, null, 2) : yamlDump(r);
        console.log(output);
    } else {
        console.warn("!!! There were errors !!! ");
        r.forEach(error => {
            console.warn(error);
        });
    }
}

async function handleList(cmd: string, files: string[], options: any) {
    //console.log("handleList: " + cmd, files, options);
    //console.log("cwd: "+process.cwd());
    let rc = 1000;
    if (cmd == "join") {
        let tree: Record<string, any> = {};
        // Sort the files, according to dependencies, also load them. 
        let file_dicts: Dict<Dict<any>> = {};
        for (let f of files) {
            let r = await toNestedDict(f, options);
            if (r) file_dicts[f] = r;
            else console.error("join: could not resolve source: " + f);
        }
        let dicts = await dependencySort(file_dicts,options);
        if( dicts ){
            let state_tree = mergeClaims(dicts,options);
            if( isDict(state_tree) ){
                //state_tree = reformat(state_tree, options.internal ? "internal" : "hr-compact");
                if( !options.internal )
                    state_tree = reformat(state_tree, "hr-compact");
            }
            logResult(state_tree, options);
        }
        rc = 0;
    }
    process.exit(rc);
}

async function handle(cmd: string, candidate: string, target: string, options: any) {
    //console.log(options);
    //process.exit(1);
    //console.log("handle: " + cmd, target, candidate, options);
    //console.log("cwd: "+process.cwd());
    let rc = 1000;
    let cand = await toNestedDict(candidate, options, "internal");
    let tgt = await toNestedDict(target, options, "internal");
    let r: Dict<any> | string[];
    switch (cmd) {
        case "possible":
            r = matchDiff(cand["*tables"], tgt["*tables"]);
            if (Array.isArray(r)) {
                console.log("Not possible");
                logResult(r, options);
            }
            else console.log("Possible");
            break;
        case "fulfills":
            r = matchDiff(cand["*tables"], tgt["*tables"]);
            // Only generate an empty response if the diff is empty
            if (Array.isArray(r) || firstKey(r))
                logResult(r, options);
            break;
        case "diff":
            r = matchDiff(cand["*tables"], tgt["*tables"]);
            logResult(r, options);
            break;
        case "apply":
            break;
        case "reverse":
            break;
    }
    process.exit(rc);
}
