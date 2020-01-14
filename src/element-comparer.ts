/*
 * Copyright (c) 2020 Yellicode
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import * as Interfaces from "./interfaces";
import { ElementComparer } from './element-comparer-interface';
import { isFeature } from './utils';

const NO_ORDER = 0;

export class ElementComparerImpl implements ElementComparer {

    private static instance: ElementComparerImpl;

    static getInstance() {
        if (!ElementComparerImpl.instance) {
            ElementComparerImpl.instance = new ElementComparerImpl();           
        }
        return ElementComparerImpl.instance;
    }

    public compareOrderedElements<TElement extends Interfaces.OrderedElement & Interfaces.NamedElement>(x: TElement, y: TElement): number {
        // We use a value of 0 (NO_ORDER) for elements having no order at all.
        // An order of NO_ORDER comes after a set order		
        var xOrder = x.order || NO_ORDER;
        var yOrder = y.order || NO_ORDER;
        if (xOrder === NO_ORDER && yOrder !== NO_ORDER) {
            return 1;
        }
        if (yOrder === NO_ORDER && xOrder !== NO_ORDER) {
            return -1;
        }
        // Both have an order
        const result = xOrder - yOrder;
        if (result !== 0) return result;
        // Both have the same order. Fallback by name for features (operations and properties), this is what we also do  
        // in the modeler. For enum members and parameters: keep the order as is.
        return isFeature(x) ? x.name.localeCompare(y.name) : 0;        
    }

    public comparePackageableElements<TElement extends Interfaces.PackageableElement>(x: TElement, y: TElement): number {
        // Packages first
        if (x.elementType === Interfaces.ElementType.package) {
            if (y.elementType !== Interfaces.ElementType.package) {
                // x is a package, y isn't
                return -1;
            }
        }
        else if (y.elementType === Interfaces.ElementType.package) {
            // x is not a package, y is
            return 1;
        }
        // Then compare by name
        return x.name.localeCompare(y.name);
    }

    public static haveEqualSignatures(x: Interfaces.Operation, y: Interfaces.Operation): boolean {
        if (x.name !== y.name) return false;
        // Same name
        if (x.ownedParameters.length !== y.ownedParameters.length) {
            return false;
        }
        // Same number of parameters
        if (x.ownedParameters.length === 0)
            return true;

        // Same number of parameters (> 0)
        for (let i = 0, len = x.ownedParameters.length; i < len; i++) {
            const typeOfParamX = x.ownedParameters[i].type;
            const typeOfParamY = y.ownedParameters[i].type;
            if (typeOfParamX !== typeOfParamY) return false;
        }

        return true;
    }
}