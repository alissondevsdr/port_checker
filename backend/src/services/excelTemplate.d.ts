export declare const TEMPLATE_SIMPLES_NACIONAL: {
    mode: string;
    columns: {
        name: string;
        type: string;
        order: number;
    }[];
};
export declare const TEMPLATE_NORMAL: {
    mode: string;
    columns: {
        name: string;
        type: string;
        order: number;
    }[];
};
export declare const SPREADSHEET_TEMPLATE: {
    mode: string;
    columns: {
        name: string;
        type: string;
        order: number;
    }[];
};
export declare function getTemplate(mode?: 'simples' | 'normal'): {
    mode: string;
    columns: {
        name: string;
        type: string;
        order: number;
    }[];
};
export declare function detectColumnMapping(headers: string[], mode?: 'simples' | 'normal'): Record<string, number | null>;
export declare function normalizeValue(value: any): any;
export declare function isValidRow(row: Record<string, any>): boolean;
//# sourceMappingURL=excelTemplate.d.ts.map