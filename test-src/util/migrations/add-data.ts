import { config } from "../../config/postgres-config";
import { Pool } from "../../../dist/Pool";


export async function up() {
    const pool = new Pool(config);
    await pool.transaction(async(client) => {

        const peopleR = await client.insert("person")
            .values([
                { first_name: "Fred", last_name: "Flinstone" },
                { first_name: "Barney", last_name: "Rubble" },
                { first_name: "Wilma", last_name: "Flinstone" }
            ]).returning("*").run();
        const addressesR = await client.insert("address")
            .values([
                { street_address: "100 Bedrock Way", city: "Bedrock" },
                { street_address: "200 Pebble Court", city: "Bedrock"},
                { street_address: "300 Granite Lane", city: "Bedrock" }
            ]).returning("*").run();

        const [fred, barney, wilma] = peopleR.rows;
        const [add1, add2, add3] = addressesR.rows;
        return client.insert("person_address")
            .values([
                {person_id: fred.id, address_id: add1.id},
                {person_id: fred.id, address_id: add2.id},
                {person_id: wilma.id, address_id: add1.id},
                {person_id: wilma.id, address_id: add2.id},
                {person_id: barney.id, address_id: add3.id}
            ]).run();
    });
    return pool.end();
}

export async function down() {
    const pool = new Pool(config);
    await pool.transaction(async(client) => {

        await client.delete("person_address").where(pool.sql.in("person_id", pool.sql.select("id").from("person").groupBy("id"))).run();
        await client.delete("person").where(pool.sql.in("id", pool.sql.select("id").from("person").groupBy("id"))).run();
        return client.delete("address").where(pool.sql.in("id", pool.sql.select("id").from("address").groupBy("id"))).run();
    });
    return pool.end();
}