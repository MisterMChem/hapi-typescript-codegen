import propertyMapper from "./property-mapper";
import { comment, nodeType, transformRef, tsArrayOf, tsIntersectionOf, tsUnionOf, } from "./utils";
export const PRIMITIVES = {
    boolean: "boolean",
    binary: "string",
    byte: "string",
    date: "string",
    dateTime: "string",
    password: "string",
    string: "string",
    double: "number",
    float: "number",
    integer: "number",
    number: "number",
};
export default function generateTypesV2(schema, options) {
    if (!schema.definitions) {
        throw new Error(`⛔️ 'definitions' missing from schema https://swagger.io/specification/v2/#definitions-object`);
    }
    const propertyMapped = options
        ? propertyMapper(schema.definitions, options.propertyMapper)
        : schema.definitions;
    function transform(node) {
        switch (nodeType(node)) {
            case "ref": {
                return transformRef(node.$ref);
            }
            case "string":
            case "number":
            case "boolean": {
                return nodeType(node) || "any";
            }
            case "enum": {
                return tsUnionOf(node.enum.map((item) => `'${item}'`));
            }
            case "object": {
                if ((!node.properties || !Object.keys(node.properties).length) &&
                    !node.allOf &&
                    !node.additionalProperties) {
                    return `{ [key: string]: any }`;
                }
                let properties = createKeys(node.properties || {}, node.required);
                if (node.additionalProperties) {
                    properties += `[key: string]: ${nodeType(node.additionalProperties) || "any"};\n`;
                }
                return tsIntersectionOf([
                    ...(node.allOf ? node.allOf.map(transform) : []),
                    ...(properties ? [`{ ${properties} }`] : []),
                ]);
                break;
            }
            case "array": {
                return tsArrayOf(transform(node.items));
            }
        }
        return "";
    }
    function createKeys(obj, required = []) {
        let output = "";
        Object.entries(obj).forEach(([key, value]) => {
            if (value.description) {
                output += comment(value.description);
            }
            output += `"${key}"${!required || !required.includes(key) ? "?" : ""}: `;
            output += transform(value);
            output += ";\n";
        });
        return output;
    }
    return `export interface definitions {
    ${createKeys(propertyMapped, Object.keys(propertyMapped))}
  }`;
}
