import { Statement } from "./Statement";
export interface Update extends Statement {
    from(field: string): this;
}
