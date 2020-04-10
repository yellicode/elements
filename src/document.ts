/*
* Copyright (c) 2020 Yellicode
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import * as elements from './interfaces';
import { ModelDelegate } from './model-delegate-interface';
import { ModelEditable, ModelProperties } from './editable-interfaces';
import { UniqueId } from '@yellicode/core';

export interface DocumentProperties {
    id?: string;
    creator?: string;
    modelTypeName?: string;
    modelTypeVersion?: string;
}

export interface DocumentEditable extends elements.Document {
    /**
     * Sets the main model.
     */
    setModel(name: string, initFn: (model: ModelEditable) => void): this;
    /**
     * Sets the profiles model.
     */
    setProfiles(name: string, initFn: (model: ModelEditable) => void): this;
}

export class Document implements elements.Document, DocumentEditable {
    constructor(private modelDelegate: ModelDelegate) {

    }

    public id: string = '';
    public creator: string = '';
    public modelTypeName: string = '';
    public modelTypeVersion: string = '';
    public model: elements.Model | null = null;
    public profiles: elements.Model | null = null;
    public references: elements.DocumentReference[] = [];

	/**
	* Returns an Element representing the element whose id property matches the specified string.
	* @returns {elements.Element} The model element matching the specified ID, or null if no matching
	* element was found in the model.
	* @param {string} id The ID of the element to search for.
	*/
    public findElementById(id: string): elements.Element | null {
        return this.modelDelegate.findElementById(id);
    }

    public setModel(name: string, initFn: (model: ModelEditable) => void): this {
        const properties: ModelProperties = { name: name };
        this.model = this.modelDelegate.createElement('model', null, properties, initFn);
        return this;
    }

    public setProfiles(name: string, initFn: (model: ModelEditable) => void): this {
        const properties: ModelProperties = { name: name };
        this.profiles = this.modelDelegate.createElement('model', null, properties, initFn);
        return this;
    }

    public static create(modelDelegate: ModelDelegate, properties?: DocumentProperties): Document {
        const doc: Document = new Document(modelDelegate);
        if (properties) Object.assign(doc, properties);
        // Ensure a ID
        if (!doc.id) doc.id = UniqueId.create();
        return doc;
    }
}