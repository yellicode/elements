/*
 * Copyright (c) 2020 Yellicode
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
import { ModelDelegateImpl } from './model-delegate';
import { ElementMapImpl } from './element-map';
import { ElementMap } from './element-map-interface';
import { ModelDelegate } from './model-delegate-interface';
import { ElementComparerImpl } from './element-comparer';

export class ModelReader {
    /**
     * Keeps an index of all elements loaded into memory.
     */
    private elementMap: ElementMap;
    /**
     * Implements the behaviour for all elements.
     */
    private modelDelegate: ModelDelegate;
    /**
     * Generated converter code that converts from data objects to navigable elements.
     */
    private converter: DataToModelConverter;
    /**
     * Contains all profiles that were read from the main document or any referenced documents.
     */
    private allProfiles: Interfaces.Profile[] = [];

    constructor() {
        this.elementMap = new ElementMapImpl();
        this.modelDelegate = new ModelDelegateImpl(this.elementMap);
        this.converter = new DataToModelConverter(this.elementMap, this.modelDelegate, ElementComparerImpl.getInstance());
    }

    public static canRead(data: any): boolean {
        if (!data.modelTypeName) return false;
        return ("yellicode yml" === data.modelTypeName.toLowerCase());
    }

    public static readDocument(documentData: Data.DocumentData): Interfaces.Document | null {
        var instance = new ModelReader();
        return instance.readDocumentRecursive(documentData, false);
    }


    private readDocumentRecursive(documentData: Data.DocumentData, isReferencedDocument: boolean): Interfaces.Document | null {
        // Obsolete: Ids must be prefixed if we are loading a referenced document, because references to it
        // are prefixed with the document id
        // const elementIdPrefix = isReferencedDocument ? documentData.id : null;

        // Convert the document's referenced documents first
        this.readReferencedDocumentsRecursive(documentData);

        // Convert the document's profiles first (this allows the converter to resolve references to them)
        const profilesInDocument = documentData.profiles ? this.converter.convert(documentData.profiles, null) : null;
        if (profilesInDocument) {
            profilesInDocument.packagedElements.forEach(p => {
                if (ElementTypeUtility.isProfile(p.elementType)) { // the element can also be a Enum or other type
                    this.allProfiles.push(p as Interfaces.Profile);
                }
            });
        }

        // Then convert the model, using the profiles
        const modelInDocument = documentData.model ? this.converter.convert(documentData.model, this.allProfiles) : null;
        const document = new Document(this.modelDelegate);
        document.id = documentData.id;
        document.modelTypeName = documentData.modelTypeName;
        document.modelTypeVersion = documentData.modelTypeVersion;
        document.creator =  documentData.creator;
        document.profiles = profilesInDocument;
        document.model = modelInDocument;
        return document;

        //return documentData.model ? ModelReader.converter.convert(documentData.model, ModelReader.profiles, elementIdPrefix) : null;
    }

    private readReferencedDocumentsRecursive(documentData: Data.DocumentData): void {
        if (!documentData.references)
            return;

        documentData.references.forEach(r => {
            if (!r.document) return;
            // Load the document. This will load the document's model elements into memory so that the converter can
            // resolve any references to it. We don't use the referenced document's main model here, it is not returned
            // through the API but may be referenced by the main document.
            this.readDocumentRecursive(r.document, true);
        });
    }
}