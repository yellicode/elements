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
import { Document } from './document';

export class ModelReader {
    private static converter: DataToModelConverter;

    /**
     * Contains all profiles that were read from the main document or any referenced documents.
     */
    private static allProfiles: Interfaces.Profile[];
   
    public static canRead(data: any): boolean {
        if (!data.modelTypeName) return false;
        return ("yellicode yml" === data.modelTypeName.toLowerCase());
    }

    public static readDocument(documentData: Data.DocumentData): Interfaces.Document | null {
        // Reset
        ModelReader.allProfiles = [];
        ModelReader.converter = new DataToModelConverter();
        return ModelReader.readDocumentRecursive(documentData, false);
    }

    // public static readModel(modelData: Data.ModelData): Interfaces.Model | null {
    //     if (!modelData) return null;

    //     const converter = new DataToModelConverter();

    //     return converter.convert(modelData, null, null);
    // }

    private static readDocumentRecursive(documentData: Data.DocumentData, isReferencedDocument: boolean): Interfaces.Document | null {
        // Ids must be prefixed if we are loading a referenced document, because references to it 
        // are prefixed with the document id      
        const elementIdPrefix = isReferencedDocument ? documentData.id : null;

        // Convert the document's referenced documents first
        ModelReader.readReferencedDocumentsRecursive(documentData);

        // Convert the document's profiles first (this allows the converter to resolve references to them)
        const profilesInDocument = documentData.profiles ? ModelReader.converter.convert(documentData.profiles, null, elementIdPrefix) : null;
        if (profilesInDocument) {
            profilesInDocument.packagedElements.forEach(p => {
                if (ElementTypeUtility.isProfile(p.elementType)) { // the element can also be a Enum or other type
                    ModelReader.allProfiles.push(p as Interfaces.Profile);
                }
            });
        }

        // Then convert the model, using the profiles
        const modelInDocument = documentData.model ? ModelReader.converter.convert(documentData.model, ModelReader.allProfiles, elementIdPrefix) : null;
        const document = new Document(ModelReader.converter.modelDelegate);
        document.id = documentData.id;
        document.modelTypeName = documentData.modelTypeName;
        document.modelTypeVersion = documentData.modelTypeVersion;
        document.creator =  documentData.creator;
        document.profiles = profilesInDocument,
        document.model = modelInDocument;
        return document;       

        //return documentData.model ? ModelReader.converter.convert(documentData.model, ModelReader.profiles, elementIdPrefix) : null;
    }

    private static readReferencedDocumentsRecursive(documentData: Data.DocumentData): void {
        if (!documentData.references)
            return;

        documentData.references.forEach(r => {
            if (!r.document) return;
            // Load the document. This will load the document's model elements into memory so that the converter can 
            // resolve any references to it. We don't use the referenced document's main model here, it is not returned 
            // through the API but may be referenced by the main document.
            ModelReader.readDocumentRecursive(r.document, true);
        });
    }
}