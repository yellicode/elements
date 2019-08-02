/*
* Copyright (c) 2019 Yellicode
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import * as toposort from 'toposort';
import { ModelTransform } from '@yellicode/core';
import { Package, PackageableElement, BehavioredClassifier, MemberedClassifier, Type, Classifier } from '../interfaces';
import { isPackage, isClassifier, isBehavioredClassifier, isMemberedClassifier, isType } from '../utils';

/**
 * A bitwise enumeration used to specify what types of dependency to include
 * during a DependencySortTransform.
 */
export enum DependencyKind {
    none = 0,
    generalizations = 1 << 0,
    interfaceRealizations = 1 << 1,
    attributes = 1 << 2,
    operationParameters = 1 << 3,
    all = generalizations | interfaceRealizations | attributes | operationParameters
}

/**
 * Sorts the types within a package (and within each nested package) based on their dependencies, in such a way 
 * that dependencies appear before dependents. Dependencies are determined based on generalizations, interface
 * realizations, attributes and operation parameters.
 */
export class DependencySortTransform implements ModelTransform<Package, Package> {
    private _options: DependencyKind;

    /**
     * Constructor. Creates a new DependencySortTransform instance.
     * @param dependencyKind An optional DependencyKind value (or a bitwise combination of values) 
     * that indicates what types of dependency must be taken into account. The default is DependencyKind.All.
     */
    constructor(dependencyKind?: DependencyKind) {
        this._options = dependencyKind == null ? DependencyKind.all : dependencyKind;
    }

    public transform(pack: Package): Package {
        if (!pack)
            return pack;

        this.transformPackageRecursive(pack);
        return pack;
    }

    private transformPackageRecursive(pack: Package) {
        if (!pack.packagedElements)
            return;

        // Get all siblings that are relevant for building a depencency graph.        
        const allTypes: Type[] = pack.packagedElements.filter(pe => isType(pe)) as Type[];      

        // Build a dependency graph of each element, see https://www.npmjs.com/package/toposort for the docs
        var graph: Type[][] = [];
        allTypes.forEach((t: Type) => {
            let elementDependencies = DependencySortTransform.getTypeDependencies(t, this._options, allTypes);
            if (elementDependencies.length > 0) {
                elementDependencies.forEach((dependency: Type) => {
                    graph.push([t, dependency])
                });
            }
        });

        if (graph.length > 0) {
            // Sort, and reverse because we need a dependency graph
            pack.packagedElements = toposort.array(pack.packagedElements, graph).reverse();
        }

        // Transform nested packages, recursively        
        pack.packagedElements.forEach((element: PackageableElement) => {
            if (isPackage(element)) {
                this.transformPackageRecursive(element);
            }
        })
    }

    private static getTypeDependencies(element: PackageableElement, options: DependencyKind, allTypes: Type[]): Type[] {
        var result: Type[] = [];

        // Dependencies based on generalizations
        if (options & DependencyKind.generalizations && isClassifier(element)) {
            DependencySortTransform.pushGeneralizationDependencies(element, allTypes, result);
        }

        // Dependencies based on interface realization
        if (options & DependencyKind.interfaceRealizations && isBehavioredClassifier(element)) {
            DependencySortTransform.pushInterfaceRealizationDependencies(element, allTypes, result);
        }

        // Dependencies based on members
        if (isMemberedClassifier(element)) {
            if (options & DependencyKind.attributes) {
                DependencySortTransform.pushOwnedAttributeDependencies(element, allTypes, result);
            }
            if (options & DependencyKind.operationParameters) {
                DependencySortTransform.pushOwnedOperationDependencies(element, allTypes, result);
            }
        }
        return result;
    }

    private static pushGeneralizationDependencies(element: Classifier, allTypes: Type[], dependencies: Type[]): void {
        if (!element.generalizations || !element.generalizations.length)
            return;

        element.generalizations.forEach(g => {
            if (g.general === element)
                return;

            if (allTypes.indexOf(g.general) > -1 && dependencies.indexOf(g.general) === -1) {
                dependencies.push(g.general);
            }
        });
    }

    private static pushInterfaceRealizationDependencies(element: BehavioredClassifier, allTypes: Type[], dependencies: Type[]): void {
        if (!element.interfaceRealizations || !element.interfaceRealizations.length)
            return;

        element.interfaceRealizations.forEach(ir => {
            if (allTypes.indexOf(ir.contract) > -1 && dependencies.indexOf(ir.contract) === -1) {
                dependencies.push(ir.contract);
            }
        });
    }

    private static pushOwnedOperationDependencies(element: MemberedClassifier, allTypes: Type[], dependencies: Type[]) {
        if (!element.ownedOperations || !element.ownedOperations.length)
            return;

        element.ownedOperations.forEach(op => {
            if (!op.ownedParameters || !op.ownedParameters.length)
                return;

            op.ownedParameters.forEach(p => {
                if (!p.type)
                    return;

                if (allTypes.indexOf(p.type) > -1 && dependencies.indexOf(p.type) === -1) {
                    dependencies.push(p.type);
                }
            })
        });
    }

    private static pushOwnedAttributeDependencies(element: MemberedClassifier, allTypes: Type[], dependencies: Type[]): void {
        if (!element.ownedAttributes || !element.ownedAttributes.length)
            return;

        element.ownedAttributes.forEach(att => {
            if (!att.type)
                return;

            if (allTypes.indexOf(att.type) > -1 && dependencies.indexOf(att.type) === -1) {
                dependencies.push(att.type);
            }
        });
    }
}