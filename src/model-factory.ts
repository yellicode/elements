import { ModelEditable, ModelProperties } from './editable-interfaces';
import { ModelDelegateImpl } from './model-delegate';
import { ElementMapImpl } from './element-map';
import * as elements from './interfaces';

export class ModelFactory {
    /**
     * Creates a new model with the specified name. Use the initFn callback to add 
     * other elements to the model.     
     */
    public static create(name: string, initFn: (model: ModelEditable) => void): elements.Model {
        const elementMap = new ElementMapImpl(true);
        const modelDelegate = new ModelDelegateImpl(elementMap);
        const properties: ModelProperties = { name: name };
        const model = modelDelegate.createElement('model', null, properties, initFn);
        return model;
    }
}