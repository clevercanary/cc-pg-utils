import { ConnectionConfig } from "pg";
import { Sql } from "./Sql";
import { Client } from "./Client";
import { QueryResult } from "./query/QueryResult";
import { Statement } from "./commands/Statement";
export declare class Pool {
    private config;
    private pool;
    constructor(config: ConnectionConfig & {
        debug: boolean;
    });
    /**
     * Expose Sql-Bricks-Postgres methods
     *
     * @returns {Sql}
     */
    readonly sql: Sql;
    static readonly sql: Sql;
    /**
     *
     * @param args
     * @returns {any}
     */
    query<T>(...args: any[]): Promise<QueryResult<T>>;
    /**
     * Kill the connection pool
     *
     * @returns {Promise<void>}
     */
    end(): Promise<void>;
    /**
     * Pull a connection from the pool
     *
     * @returns {Promise<Client>}
     */
    connect(): Promise<Client>;
    /**
     * Initiate a transaction
     *
     * @param fn
     * @returns {Promise<T>}
     */
    transaction<T>(fn: (client: Client) => Promise<T>): Promise<T>;
    /**
     * Add Sql-Bricks Methods to client
     *
     * @param pgClient
     * @returns {Client}
     */
    private appendBricks(pgClient);
    /**
     * Append insert Methods to client
     *
     * @param pgClient
     * @returns {Client}
     */
    private appendInsertMethods(pgClient);
    /**
     * Append applyQuery Method to client
     *
     * @param pgClient
     * @returns {Client}
     */
    private appendApplyQuery(pgClient);
    /**
     * Append count Method to client
     *
     * @param pgClient
     * @returns {Client}
     */
    private appendCountQuery(pgClient);
    /**
     * Append Sql-Bricks methods for select/update/delete
     *
     * @param pgClient
     * @param method
     * @returns {Client}
     */
    private appendStatementMethods(pgClient, method);
    /**
     * Logger Function
     *
     * @param brick
     */
    logIt(brick: Statement): void;
}
