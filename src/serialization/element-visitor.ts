/*
* Copyright (c) 2020 Yellicode
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import { ModelDelegate } from '../model-delegate-interface';
import { ElementJSONTransformer } from './element-json-transformer';
import { ElementReferenceResolver } from './element-reference-resolver';
import { ElementComparerImpl } from '../element-comparer';
import { Element, NamedElement, ElementType } from '../interfaces';

export class ElementVisitor {
    private modelDelegate: ModelDelegate;
    private jsonTransformer: ElementJSONTransformer;

    /**
     * Constructor. Creates a new ElementVisitor instance.
     * @param applySorting True to sort packaged- and ordered (having an Order property) elements.
     */
    constructor(modelDelegate: ModelDelegate, applySorting: boolean) {
        const referenceResolver = new ElementReferenceResolver(modelDelegate);

        this.jsonTransformer = new ElementJSONTransformer(
            referenceResolver,
            applySorting ? ElementComparerImpl.getInstance() : null
        );
        this.modelDelegate = modelDelegate;
    }

    public visit(root: any): Element {
        const target = this.visitRecursive(root, null, 0) as Element;
        this.jsonTransformer.resolveReferences();
        return target;
    }

    private visitRecursive(source: any, owner: Element | null, depth: number): Element | any {
        const elementType: string | null = source['elementType'] || null;
        // <debug stuff>
        // let consoleIndent = '  ';
        // for (let i = 0; i < depth; i++) consoleIndent += '  ';
        // console.log(`${consoleIndent}+ Creating new ${elementType || 'object'} (owner: ${ElementVisitor.getConsoleDisplayName(owner)}).`);
        // </debug stuff>

        let target: Element | any;
        if (elementType) {
            const elementId: string | null = source['id'] || null; // the id is not required for all element types, but it is important when it is.                    
            target = this.modelDelegate.createElement(elementType as any, owner, { id: elementId }, null);
        }
        else {
            target = source;
        }

        // <debug stuff>
        // const debugName = ElementVisitor.getConsoleDisplayName(target);
        // </debug stuff>

        Object.keys(source).forEach(k => {
            const value = source[k];
            if (typeof (value) !== 'object') {
                if (k === 'id' || k === 'elementType')
                    return; // we already have these

                const mappedValue = this.jsonTransformer.fromJSON(target, k, value);
                if (mappedValue) {
                    // console.log(`${consoleIndent}${debugName}.${k} = '${mappedValue}'.`);
                    target[k] = mappedValue;
                }
                // else console.log(`${consoleIndent}${debugName}.${k} was not mapped (yet)'.`);
                return;
            }
            // The value is an object (or an array).
            if (Array.isArray(value)) {
                if (!target[k]) {
                    console.warn(`Target ${ElementVisitor.getConsoleDisplayName(target)} has no array member with key '${k}'.`);
                    return;
                }
                if (!value.length)
                    return;

                const isObjectArray = typeof (value[0]) === 'object';
                if (isObjectArray) {
                    for (let index = 0, len = value.length; index < len; index++) {
                        const element = value[index];
                        // console.log(`${consoleIndent}Visiting ${debugName}.${k}[${index}] =>`);
                        const childResult = this.visitRecursive(element, elementType ? target : null, depth + 1);
                        // console.log(`${consoleIndent}${debugName}.${k}[${index}] = '${ElementVisitor.getConsoleDisplayName(childResult)}'.`);                        
                        target[k][index] = childResult;
                    }
                }
                else {
                    // Do not visit the non-object array, just map the value                    
                    const mappedValue = this.jsonTransformer.fromJSON(target, k, value);
                    if (mappedValue) {
                        // console.log(`${consoleIndent}${debugName}.${k} = '${mappedValue}'.`);
                        target[k] = mappedValue;
                    }
                    // else console.log(`${consoleIndent}${debugName}.${k} was not mapped (yet)'.`);
                }
            }
            else {
                // The value is a child object
                // console.log(`${consoleIndent}Visiting ${debugName}.${k} =>`);
                const childResult = this.visitRecursive(value, elementType ? target : null, depth + 1);
                // console.log(`${consoleIndent}${debugName}.${k} = '${ElementVisitor.getConsoleDisplayName(childResult)}'.`);
                target[k] = childResult;
            }
        })
        return target;
    }

    private static getConsoleDisplayName(target: Element | any): string {
        if (!target) return 'none';
        if (!target.hasOwnProperty('elementType')) return '{}';
        return ((target as NamedElement).name || ElementType[(target as NamedElement).elementType]);
    }
}