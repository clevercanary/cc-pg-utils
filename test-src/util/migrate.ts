import * as Umzug from "umzug";
import * as path from "path";

class MigrationStorage {

    private _migrated = new Set<string>();

    constructor() {}

    logMigration(name) {
        // console.log(`${name} migrated`);
        this._migrated.add(name);
        return;
    }

    unlogMigration(name) {

        if (this._migrated.has(name)) {
            this._migrated.delete(name);
        }
        else {
            throw new Error(`${name} hasn't been migrated`);
        }
        // console.log(`${name} unmigrated`);
    }

    executed() {
        return Array.from(this._migrated.values());
    }
}

const root = path.join(__dirname, "../../");

export const umzug = new Umzug({
    storage: new MigrationStorage(),
    migrations: {
        path: path.join(root, "test/util/migrations"),
        pattern: /\.js$/
    }
});

