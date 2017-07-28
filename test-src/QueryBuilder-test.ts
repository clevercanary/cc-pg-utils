import { expect } from "chai";
import { QueryBuilder } from "../dist/QueryBuilder";
import { QueryModel } from "cc-qm";
import { Pool } from "../dist/Pool";
const sql = Pool.sql;

describe("QueryBuilder", function() {

    const PERSON_ADDRESS_MAPPINGS = {
        qualifiedColumns: {
            "id": "pe.id",
            "first_name": "pe.first_name",
            "address": "ad.address"
        },
        joinTables: {
            "address": {
                table: "address",
                through: "person_address"
            }
        }
    };

    const queryBuilder = new QueryBuilder("person pe", PERSON_ADDRESS_MAPPINGS.qualifiedColumns, PERSON_ADDRESS_MAPPINGS.joinTables);

    it("should build a basic query", () => {

        const qm = new QueryModel();
        qm.addEqualsQueryFilter("first_name", "Chris");
        const select = sql.select("*").from("person pe");
        queryBuilder.buildQuery(select, qm);
        const str = select.toString();
        expect(str).to.equal("SELECT * FROM person pe WHERE pe.first_name = 'Chris'");
    });

    it("should build a join query", () => {

        const qm = new QueryModel();
        qm.addEqualsQueryFilter("first_name", "Chris");
        qm.addEqualsQueryFilter("address", "100 Main Street");

        const select = sql.select("*")
            .from("person pe")
            .leftJoin("person_address pa", {"pe.id": "pa.person_id"})
            .leftJoin("address ad", { "pa.address_id": "ad.id"});

        queryBuilder.buildQuery(select, qm);
        const str = select.toString();
        expect(str).to.equal("SELECT * FROM person pe LEFT JOIN person_address pa ON pe.id = pa.person_id LEFT JOIN address ad ON pa.address_id = ad.id WHERE pe.first_name = 'Chris' AND ad.address = '100 Main Street'");
    });

    it("should build a subquery when searching equality of two values on a given field", () => {

        const qm = new QueryModel();
        qm.addEqualsQueryFilter("address", "100");
        qm.addEqualsQueryFilter("address", "200");

        const select = sql.select("pe.first_name, ad.address")
            .from("person pe")
            .leftJoin("person_address pa", {"pe.id": "pa.person_id"})
            .leftJoin("address ad", { "pa.address_id": "ad.id"});

        queryBuilder.buildQuery(select, qm);
        const str = select.toString();
        expect(str).to.equal("SELECT pe.first_name, ad.address FROM person pe LEFT JOIN person_address pa ON pe.id = pa.person_id LEFT JOIN address ad ON pa.address_id = ad.id WHERE pe.id IN (SELECT person pe.id FROM person pe LEFT JOIN person_address ON person pe.id = person_address.person pe_id LEFT JOIN address ON person_address.address_id = address.id WHERE address.address IN ('100', '200') GROUP BY person pe.id HAVING COUNT(DISTINCT address.address) = 2)");
    });

    it("should build a subquery when searching equality of three values on a given field", () => {

        const qm = new QueryModel();
        qm.addEqualsQueryFilter("address", "100");
        qm.addEqualsQueryFilter("address", "200");
        qm.addEqualsQueryFilter("address", "300");

        const select = sql.select("pe.first_name, ad.address")
            .from("person pe")
            .leftJoin("person_address pa", {"pe.id": "pa.person_id"})
            .leftJoin("address ad", { "pa.address_id": "ad.id"});

        queryBuilder.buildQuery(select, qm);
        const str = select.toString();
        expect(str).to.equal("SELECT pe.first_name, ad.address FROM person pe LEFT JOIN person_address pa ON pe.id = pa.person_id LEFT JOIN address ad ON pa.address_id = ad.id WHERE pe.id IN (SELECT person pe.id FROM person pe LEFT JOIN person_address ON person pe.id = person_address.person pe_id LEFT JOIN address ON person_address.address_id = address.id WHERE address.address IN ('100', '200', '300') GROUP BY person pe.id HAVING COUNT(DISTINCT address.address) = 3)");
    })

    // TODO - should probably schema-fy it, so we don't have to qualify the table columns explicitly.

});