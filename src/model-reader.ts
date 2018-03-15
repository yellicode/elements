/*
 * Copyright (c) 2018 Yellicode
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import * as Interfaces from './interfaces';
import * as Data from './data-interfaces';
import { DataToModelConverter } from './data-to-model-converter';
import { ElementTypeUtility } from './utils';

export class ModelReader {
    private converter: DataToModelConverter;

    /**
     * Contains all profiles that were read from the main document or any referenced documents.
     */
    private profiles: Interfaces.Profile[] = [];

    constructor() {
        this.converter = new DataToModelConverter()
    }

    public static canRead(data: any): boolean {
        if (!data.modelTypeName) return false;
        return ("yellicode yml" === data.modelTypeName.toLowerCase());
        // throw `Cannot read the model file. Unknown model type '${data.modelTypeName}'.`;        
    }

    public read(documentData: Data.DocumentData): Interfaces.Model | null {
        if (!documentData.model) {
            console.error(`The document does not contain any model data.`);
            return null;
        }

        const mainModel = this.loadDocumentRecursive(documentData, false);
        return mainModel;
    }

    private loadDocumentRecursive(documentData: Data.DocumentData, isReferencedDocument: boolean): Interfaces.Model | null {
        const elementIdPrefix = isReferencedDocument ? documentData.id : null;

        // Load the document's referenced documents first
        this.loadReferencedDocumentsRecursive(documentData);

        // Read the document's profiles first (this allows the converter to resolve references to them)
        const profilesModel = documentData.profiles ? this.converter.convert(documentData.profiles, null, elementIdPrefix) : null;
        if (profilesModel) {
            profilesModel.packagedElements.forEach(p => {
                if (ElementTypeUtility.isProfile(p.elementType)) { // the element can also be a Enum or other type
                    this.profiles.push(p as Interfaces.Profile);
                }
            });
        }

        // Then read the model, using the profiles
        const model = documentData.model ? this.converter.convert(documentData.model, this.profiles, elementIdPrefix) : null;
        return model;
    }

    private loadReferencedDocumentsRecursive(documentData: Data.DocumentData): void {
        if (!documentData.references)
            return;

        documentData.references.forEach(r => {
            if (!r.document) return;
            // Load the document. This will load the document's model elements into memory so that the converter can 
            // resolve any references to it. We don't use the referenced document's main model here, it is not returned 
            // through the API but may be referenced by the main document.
            this.loadDocumentRecursive(r.document, true);
        });
    }
}