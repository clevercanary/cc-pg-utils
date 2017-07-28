import { Pool } from "../../../dist/Pool";
import { config } from "../../config/postgres-config";

export async function up() {
    const pool = new Pool(config);
    await pool.transaction((client) => {
        console.log("connected");
        return client.query(`
        CREATE TABLE IF NOT EXISTS public.person (
            id serial NOT NULL,
            first_name varchar NOT NULL,
            last_name varchar NOT NULL,
            PRIMARY KEY ("id")
        );
        
        CREATE TABLE IF NOT EXISTS public.person_address (
            id serial NOT NULL,
            person_id int4 NOT NULL,
            address_id int4 NOT NULL,
            PRIMARY KEY ("id")
        );
        
        CREATE TABLE IF NOT EXISTS public.address (
            id serial NOT NULL,
            street_address varchar NOT NULL,
            city varchar NOT NULL,
            PRIMARY KEY ("id")
        );
        
        CREATE UNIQUE INDEX person_address_joinkey ON person_address USING btree (person_id, address_id);
        `);
    });
    return pool.end();
}


export async function down() {
    const pool = new Pool(config);
    await pool.query(`DROP TABLE IF EXISTS public.person, public.person_address, public.address;`);
    return pool.end()
}