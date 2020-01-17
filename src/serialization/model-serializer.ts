import { Model } from '../interfaces';
import { ElementJsonTransformer } from './element-json-transformer';
import { ElementReviver } from './element-reviver';

export class ModelSerializer {
    /**
     * A custom replacer function that is used as a replacer callback using JSON.stringify.
     * @param this The object in which the key was found.
     * @param key The key being stringified.
     * @param value The value being stringified.
     */
    private static replacer(this: any, key: string, value: any): any {
        // Initially, the replacer function is called with an empty string as key representing the object being stringified. 
        // It is then called for each property on the object or array being stringified.
        if (!key.length) return value;

        // If the object is an array, keep all members
        if (Array.isArray(this)) return value;

        // If the value is falsy (false, 0, '', null), remove it from the output.
        if (!value) {
            return undefined; // by default, don't include the property
        }

        // If the value is an empty array, remove it
        const valueIsArray = Array.isArray(value);
        if (valueIsArray && !value.length)
            return undefined; // remove empty arrays

        // If the object is a model element, apply a custom replacer. 
        if (this.hasOwnProperty('elementType')) {
            return ElementJsonTransformer.replace(this, key, value, valueIsArray);
        }

        // console.log(`Not serializing non-element property '${this.constructor.name}.${key}';`);
        return undefined; // by default, don't include the property
    }

    public static serializeModel(model: Model): string {
        return JSON.stringify(model, ModelSerializer.replacer, 0);
    }

    /**
     * Deserializes a model from a JSON string.
     * @param text The JSON data.
     * @param applySorting True to apply sorting to packaged- and ordered (having an Order property) elements.
     * This value should be false if the model is going to be persisted later, beause that would also change
     * the order of elements in the JSON data, causing a larger diff than necessary.
     */
    public static deserializeModel(text: string, applySorting: boolean): Model {
        const elementReviver = new ElementReviver(applySorting);        
        return JSON.parse(text, function (this, key, value) { return elementReviver.revive(this, key, value) }) as Model;        
    }
}