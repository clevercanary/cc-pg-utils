import { expect } from "chai";
import { Pool } from "../dist/Pool";
import { config } from "./config/postgres-config";
import { umzug } from "./util/migrate";

describe("Pool connection", function() {

    let pool: Pool = null;

    before(function () {
        return umzug.up("create-tables")
    });

    after(function () {
        return umzug.down("create-tables");
    });

    beforeEach(async function() {
        await umzug.up("add-data");
        return pool = new Pool(config);
    });

    afterEach(async function() {
        await pool.end();
        return umzug.down("add-data");
    });

    it("connect and run a transaction", function() {

        return pool.transaction(async(client) => {
                return client.query("select 1+1 as value");
            })
            .then((result) => {
                expect(result.rows[0].value).to.equal(2);
            })
            .catch(console.log);
    });

    it("should fail a transaction", function() {

        return pool.transaction(async(client) => {
                const result = await client.query("select 1+1 as value");
                expect(result.rows[0].value).to.equal(2);
                throw new Error("Transaction failed");
            })
            .then((res) => {
                expect(res).to.be(undefined);
            })
            .catch((err) => {
                expect(err).to.be.instanceof(Error);
                expect(err.message).to.eq("Transaction failed");
            });
    });

    it("should run a select query", function() {
        return pool.transaction(async(client) => {
                return client.select("*").from("person").run();
            })
            .then((result) => {
                const rows = result.rows;
                expect(rows.length).to.equal(3);
            })
            .catch(console.log)
    });

    it("should run an insert", function() {

        return pool.transaction(async(client) => {
                await client.insert("person").values([{ first_name: "Chris", last_name: "Bajorin" }]).run();
                return client.select("*").from("person").run();
            })
            .then(({ rows }) => {
                expect(rows.length).to.eq(4);
            })
            .catch(console.log);
    });

    it("should run a delete", function() {
        return pool.transaction(async(client) => {
                await client.delete("person").where({ last_name: "Flintstone" }).run();
                return client.select("*").from("person").run();
            })
            .then(({ rows }) => {
                expect(rows.length).to.eq(1);
            });
    })
});
