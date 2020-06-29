/*
* Copyright (c) 2020 Yellicode
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import { Model, Document } from '../interfaces';
import { ElementMapImpl } from '../element-map';
import { ModelDelegateImpl } from '../model-delegate';
import { DocumentData } from '../data-interfaces';
import { Document as DocumentImpl, DocumentProperties } from '../document';
import { ElementVisitor } from './element-visitor';
import { ElementJSONTransformer } from './element-json-transformer';
import { DocumentJSONTransformer } from './document-json-transformer';

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

        // Should we apply a custom transformer?
        if (this.hasOwnProperty('modelTypeName')) {
            // This is a document (interfaces.Document). This only applies if serializeDocument was called.
            return DocumentJSONTransformer.toJSON(this, key, value);
        }

        // This is a element (interfaces.Element) or any other nested object, such as a TaggedValue
        return ElementJSONTransformer.toJSON(this, key, value, valueIsArray);
    }

    public static serializeModel(model: Model): string {
        return JSON.stringify(model, ModelSerializer.replacer, 0);
    }

    public static serializeDocument(document: Document): string {
        return JSON.stringify(document, ModelSerializer.replacer, 0);
    }

    public static deserializeModel(text: string, applySorting: boolean, includesPrimitives: boolean = false): Model {
        const elementMap = new ElementMapImpl(/* initializeWithPrimitives: */ !includesPrimitives);
        const modelDelegate = new ModelDelegateImpl(elementMap);
        const visitor = new ElementVisitor(modelDelegate, applySorting);
        return ModelSerializer.deserializeModelInternal(text, visitor);
    }

    private static deserializeModelInternal(text: string, visitor: ElementVisitor): Model {
        const modelData = JSON.parse(text);
        return visitor.visit(modelData) as Model;
    }

    public static deserializeDocument(text: string, applySorting: boolean, includesPrimitives: boolean = false): Document {
        const elementMap = new ElementMapImpl(/* initializeWithPrimitives: */ !includesPrimitives);
        const modelDelegate = new ModelDelegateImpl(elementMap);
        const visitor = new ElementVisitor(modelDelegate, applySorting);

        // Because the order in which we deserialize the document parts is important, we need to
        // first split the data into references, profiles and the main model.
        // const documentData = JSON.parse(text, ModelSerializer.documentReviver) as SplitDocumentData;
        const documentData = JSON.parse(text) as DocumentData;
        const props: DocumentProperties = { id: documentData.id, creator: documentData.creator, modelTypeName: documentData.modelTypeName, modelTypeVersion: documentData.modelTypeVersion };
        const document = DocumentImpl.create(modelDelegate, props);
        // 1: resolve references
        if (documentData.references && documentData.references.length) {
            // Todo...
            console.warn('The document contains one or more references. Importing references is not supported yet.');
        }

        // 2: Deserialize profiles. This is important to do before deserializing the model, because
        // the profiles (actually, their contained stereotypes) must be in the ElementMap.
        if (documentData.profiles) {
           document.profiles = visitor.visit(documentData.profiles) as Model;
        }

        // 3: deserialize the model (todo: apply profiles)
        if (documentData.model) {
            document.model = visitor.visit(documentData.model) as Model;
        }
        return document;
    }
}