import { Pool as PgPool, Client as PgClient, ConnectionConfig as PgConfig } from "pg";
import * as pgsql from "sql-bricks-postgres";
import { Sql } from "./Sql";
import { Client } from "./Client";
import { QueryResult } from "./query/QueryResult";
import { Statement } from "./commands/Statement";

export interface ConnectionConfig extends PgConfig {
    debug: boolean;
}

// TODO - query stream functionality implementation
export class Pool {

    private config: ConnectionConfig;
    private pool: PgPool;

    constructor(config: ConnectionConfig) {
        this.config = config;
        this.pool = new PgPool(config);
    }

    /**
     * Expose Sql-Bricks-Postgres methods
     *
     * @returns {Sql}
     */
    get sql(): Sql {
        return pgsql as Sql;
    }

    public static get sql(): Sql {
        return pgsql as Sql;
    }

    /**
     *
     * @param args
     * @returns {any}
     */
    query<T>(...args: any[]): Promise<QueryResult<T>> {
        return this.pool.query.apply(this.pool, Array.from(arguments));
    }

    /**
     * Kill the connection pool
     *
     * @returns {Promise<void>}
     */
    end(): Promise<void> {
        return this.pool.end();
    }

    /**
     * Pull a connection from the pool
     *
     * @returns {Promise<Client>}
     */
    async connect(): Promise<Client> {
        const client = await this.pool.connect();
        return this.appendBricks(client);
    }

    /**
     * Initiate a transaction
     *
     * @param fn
     * @returns {Promise<T>}
     */
    async transaction<T>(fn: (client: Client) => Promise<T>): Promise<T> {
        const client = await this.connect();
        await client.query("BEGIN");
        this.config.debug ? console.log(`\x1b[35mPostgres: \x1b[37mTRANSACTION BEGIN`) : void 0;
        try {
            const result = await fn(client);
            await client.query("COMMIT");
            this.config.debug ? console.log(`\x1b[35mPostgres: \x1b[37mTRANSACTION COMMIT`) : void 0;
            return result;
        }
        catch (error) {
            await client.query("ROLLBACK");
            this.config.debug ? console.log(`\x1b[35mPostgres: \x1b[37mTRANSACTION ROLLBACK`) : void 0;
            this.config.debug ? console.log(error) : void 0;
            throw error;
        }
        finally {
            client.release();
        }
    }

    /**
     * Add Sql-Bricks Methods to client
     *
     * @param pgClient
     * @returns {Client}
     */
    private appendBricks(pgClient: PgClient): Client {

        this.appendInsertMethods(pgClient);
        this.appendApplyQuery(pgClient);
        this.appendCountQuery(pgClient);

        ["select", "update", "delete"].forEach((method: any) => {
            this.appendStatementMethods(pgClient, method);
        });
        // Monkey-patch is complete, so we need to force typecast
        return (pgClient as any) as Client;
    }

    /**
     * Append insert Methods to client
     *
     * @param pgClient
     * @returns {Client}
     */
    private appendInsertMethods(pgClient: PgClient): Client {

        const client = (pgClient as any) as Client;
        const logIt = this.logIt.bind(this);

        client.insert = function() {
            const brick = pgsql.insert.apply(pgsql, Array.from(arguments));
            brick.run = () => {
                const config = brick.toParams();
                logIt(brick);
                return this.query(config);
            };

            brick.select = function() {
                const sel = pgsql.insert.prototype.select.apply(pgsql, Array.from(arguments));
                sel.run = brick.run;
                return sel;
            };
            return brick;
        };
        return client;
    }

    /**
     * Append applyQuery Method to client
     *
     * @param pgClient
     * @returns {Client}
     */
    private appendApplyQuery(pgClient: PgClient): Client {

        const client = (pgClient as any) as Client;
        client.applyQuery = <T>(brick: Statement): Promise<QueryResult<T>> => {
                this.logIt(brick);
                return client.query(brick.toParams());
            };
        return client;
    }

    /**
     * Append count Method to client
     *
     * @param pgClient
     * @returns {Client}
     */
    private appendCountQuery(pgClient: PgClient): Client {

        const client = (pgClient as any) as Client;

        client.count = (brick: Statement): Promise<QueryResult<{ count: number }>> => {

            const cloned = brick.clone() as any;

            // this wipes all other select columns and forces it to be a count query.
            cloned._columns = [];
            cloned._columns.push(`COUNT(*)`);

            // remove any sort orders that will mess with aggregate
            delete cloned._orderBy;

            this.logIt(cloned);
            return client.query(cloned.toParams());
        };
        return client;
    }

    /**
     * Append Sql-Bricks methods for select/update/delete
     *
     * @param pgClient
     * @param method
     * @returns {Client}
     */
    private appendStatementMethods(pgClient: PgClient, method: "select" | "update" | "delete"): Client {
        const client = (pgClient as any) as Client;
        const logIt = this.logIt.bind(this);

        client[method] = function () {
            const brick = pgsql[method].apply(pgsql, Array.from(arguments));
            brick.run = () => {
                const config = brick.toParams();
                logIt(brick);
                return client.query(config);
            };
            return brick;
        };
        return client;
    }

    /**
     * Logger Function
     *
     * @param brick
     */
    logIt(brick: Statement) {
        if (this.config.debug) {
            console.log(`\x1b[35mPostgres: \x1b[37m${brick.toString()}`);
        }
    }
}
