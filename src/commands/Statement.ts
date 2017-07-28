export interface Params {
    text: string;
    values: any[];
}

export interface Statement {
    clone(): this;
    toParams(): Params;
    toString(): string;
    run(): Promise<any>;
}
