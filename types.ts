import {ethers} from 'ethers';
import {Session} from './bridge';

/* Every business module receives the same props from the app shell. */
export type ModuleProps={
 session?:Session;
 en:boolean;
 run:(action:()=>Promise<ethers.ContractTransaction>)=>Promise<void>;
 busy:boolean;
 revision:number;
};
