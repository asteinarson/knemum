import { handleNoArgCmd, handleOneArgCmd, handleTwoArgCmd, handleDbCmd } from '../cmd-handlers';
import { Dict, firstKey, isArray, isDict } from '../utils';

import { join as pJoin } from 'path';
import { dump as yamlDump } from 'js-yaml';
import { load as yamlLoad } from 'js-yaml';

import { connectState, createDb, matchDiff, normalizeConnInfo, toState } from '../logic';
import { disconnectAll } from '../db-utils';
import { jestLogCaptureStart, jestLogGet, claimsToFile, fileOf, jestWarnCaptureStart, jestWarnGet } from './test-utils';

import { claim_p1, claim_apply_simple_types as claim_ast } from './claims';
import { tmpdir } from 'os';
import { existsSync, rmSync } from 'fs';

import * as dotenv from 'dotenv'
dotenv.config();

afterAll( disconnectAll );

claimsToFile([claim_ast]);

// Need a test to be in this file 
test("cmd apply test - 1 ", async () => {
    let state_dir = pJoin(tmpdir(), "state_ast");
    let options = {
        internal: true,
        state: state_dir,
    };
    // Create a temp DB to work on 
    let db_conn = normalizeConnInfo("%");
    let db = await createDb("%","claim_ast");
    if( isDict(db) ){
        let r:any = await connectState(state_dir,db,options);
        if( r== true ){
            r = await handleOneArgCmd("apply", [fileOf(claim_ast)], options);
            expect(r).toBe(0);
        }
    }
    else{ 
        expect(db_conn).toBe(0);
        expect(process.cwd()).toBe(0);
    }
});
