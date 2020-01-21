/*
* Copyright (c) 2020 Yellicode
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import { Element, NamedElement, Generalization, Association, Property, Stereotype, ValueSpecification } from '../interfaces';
import { ModelDelegate } from '../model-delegate-interface';

// Prioritizes which keys should be resolved before others. For example, before resolving Element.appliedStereotypes 
// (where we process tagged values), we should have resolved TaggedValueSpecification.definition.
const resolutionPriority: string[] = ['definition', 'appliedStereotypes'];

/**
 * Contains all unresolved references for a particular key.
 */
interface UnResolvedReferences {
    /**
     * Contains, for each element that is referred to (e.g. the id 'integer_id' or a 
     * generated id for a model type), a list of elements that refer to it (e.g. any TypedElement that has type 'integer_id').
     */
    referrersByElementId: { [referredElementId: string]: (Element | any)[] };
    /**
     * Indicates if the property to which these reference apply (the current key) is an array.
     */
    isArrayProperty: boolean;
}

export class ElementReferenceResolver {
    /**
     * Contains a list of unresolved references, grouped by key (that is, the name of the 
     * referring property).
     */
    private unResolvedReferencesByKey: { [key: string]: UnResolvedReferences } = {};

    constructor(private modelDelegate: ModelDelegate) {

    }

    public addUnResolvedReference(key: string, referrer: Element | any, elementId: string | string[]): void {
        let isArray: boolean = false;
        let collection: string[];
        if (Array.isArray(elementId)) {
            collection = elementId;
            isArray = true;
        }
        else collection = [elementId];
        let referencesForKey = this.unResolvedReferencesByKey[key];
        if (!referencesForKey) {
            this.unResolvedReferencesByKey[key] = referencesForKey = { isArrayProperty: isArray, referrersByElementId: {} };
        }
        collection.forEach(elementId => {
            let referrers: any[] = referencesForKey.referrersByElementId[elementId];
            if (!referrers) referencesForKey.referrersByElementId[elementId] = referrers = [];
            referrers.push(referrer);
        })
    }

    public resolve() {        
        Object.keys(this.unResolvedReferencesByKey)
            .sort((a, b) => { return resolutionPriority.indexOf(a) - resolutionPriority.indexOf(b); })
            .forEach((key) => {
                const group = this.unResolvedReferencesByKey[key];
                Object.keys(group.referrersByElementId).forEach(elementId => {
                    const referredElement = this.modelDelegate.findElementById(elementId);
                    const referrers = group.referrersByElementId[elementId];
                    if (!referredElement) return console.warn(`${referrers.length} elements have a '${key}' reference with unresolvable id ${elementId}.`);
                    referrers.forEach(referrer => {
                        // console.log(`${(referrer as NamedElement).name || referrer.id} has ${key} ${elementId}. Array: ${group.isArrayProperty}`);
                        if (group.isArrayProperty) {
                            let array = (referrer as any)[key];
                            if (!array) { // ensure an array (although it should already be initialized)
                                (referrer as any)[key] = array = [];
                            }
                            array.push(referredElement);
                        }
                        else
                            (referrer as any)[key] = referredElement;

                        // Apply custom logic to some relationships
                        switch (key) {
                            case 'general':
                                // Even though there is a onGeneralizationAdded call in modelDelegate.createElement(), 
                                // that call doesn't have any effect without a general.
                                this.modelDelegate.onGeneralizationAdded(referrer as Generalization);
                                break;
                            case 'memberEnds':
                                this.modelDelegate.onMemberEndAdded(referrer as Association, referredElement as Property);
                                break;
                            case 'appliedStereotypes':
                                this.applyStereotype(referrer, referredElement as Stereotype);
                                break;
                        }
                    });
                });
            });
        this.unResolvedReferencesByKey = {};
    }

    private applyStereotype(element: Element, st: Stereotype): void {
        if (!element.taggedValues || !element.taggedValues.length)
            return;

        var stereotypeMetaProperties = st.getAllAttributes(); // stereotypes can inherit other stereotypes
        stereotypeMetaProperties.forEach(metaProperty => {
            if (element.hasOwnProperty(metaProperty.name))
                return;

            //  Extend the element with the property. But determine the value first.				
            let valueSpecification: ValueSpecification | null = null;
            const taggedValue = element.taggedValues.find(v => v.definition.id === metaProperty.id);
            if (taggedValue) {
                valueSpecification = taggedValue.specification;
            }
            else if (metaProperty.defaultValue) {
                valueSpecification = metaProperty.defaultValue;
            }
            (element as any)[metaProperty.name] = valueSpecification ? valueSpecification.getValue() : null;
        })
    }
}