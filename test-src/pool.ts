import { Pool } from "../dist/Pool";
import { config } from "./config/postgres-config";
import { expect } from "chai";
type Callback<T> = (err: Error, res?: T) => void;


// export const getPool = (() => {
//     const pool = new Pool(config);
//     return (next): void => {
//         next(null, pool);
//     }
// })();

// const pool = new Pool(config);
//
// export function getPool(): Pool {
//     return pool;
// }
//
// export function prepareDb(next: Callback<Pool>) {
//
//     pool.query<{ value: number }>("select 1+1 as value")
//         .then((res) => {
//             expect(res.rows[0].value).to.equal(2);
//             next(null, pool)
//         })
//         .catch(next);
// }