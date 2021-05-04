
import { createDb, dropDb, existsDb } from '../logic';
import { isDict, isString } from '../utils';

import * as dotenv from 'dotenv'
import { closeAll } from '../db-utils';
dotenv.config();

afterAll( () => {
    closeAll();
});

// Need a test to be in this file 
test("DB: create, drop test", async () => {
    //if( 1 ) return; 
    
    let r;
    r = await existsDb("%","arst");
    expect(r).toBe(true);

    // Drop if exists 
    //r = await existsDb("%","arst")
    //expect(r).toBe(true);
    
    /*if( r==true ){
        r = await dropDb("%","jest_test");
        expect(isDict(r)).toBeTruthy();
    }*/

    // Create it 
    /*r = await createDb("%","jest_test");
    expect(isDict(r)).toBeTruthy();

    // Existing ? 
    r = await existsDb("%","jest_test")
    expect(r).toBe(true);

    // And drop it 
    r = await dropDb("%","jest_test");
    expect(isDict(r)).toBeTruthy();

    // Not existing ? 
    r = await existsDb("%","jest_test")
    expect(typeof r).toBe("string");*/
}); 
