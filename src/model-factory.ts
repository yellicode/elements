import { ModelEditable, ModelProperties } from './editable-interfaces';
import { ModelDelegateImpl } from './model-delegate';
import { ElementMapImpl } from './element-map';
import * as elements from './interfaces';
import { DocumentProperties, Document, DocumentEditable } from './document';
import { UniqueId } from '@yellicode/core';

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

    public static createDocument(creator: string, initFn: (model: DocumentEditable) => void): elements.Document {
        const elementMap = new ElementMapImpl(true);
        const modelDelegate = new ModelDelegateImpl(elementMap);
        const properties: DocumentProperties = { creator: creator };
        const document = Document.create(modelDelegate, properties);        
        document.modelTypeName = 'Yellicode YML';        
        document.modelTypeVersion = elements.MetaVersion;
        if (initFn) initFn(document);                
        return document;
    }
}