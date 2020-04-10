/*
 * Copyright (c) 2020 Yellicode
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { PackageableElement, Type, ElementType } from '../interfaces';
import { isClass, isDataType, isEnumeration, isInterface, isPrimitiveType, isStereotype, isMemberedClassifier, ElementTypeUtility, isBehavioredClassifier, isClassifier } from '../utils';
import { PackagedElementTransform } from './packaged-element-transform';
import { ModelDelegate } from '../model-delegate-interface';

/**
 * Transforms packageable element elements of one element type to another element type. For example, this transform lets
 * you transform all classes in a model or package to interfaces.
 */
export class ElementTypeTransform extends PackagedElementTransform {
    private sourceElementSelector: (t: PackageableElement) => t is Type;
    private sourceElementType: ElementType;
    private targetElementType: ElementType;

    constructor(
        sourceElementType: ElementType._class | ElementType.dataType | ElementType.enumeration | ElementType._interface | ElementType.primitiveType | ElementType.stereotype,
        targetElementType: ElementType._class | ElementType.dataType | ElementType.enumeration | ElementType._interface | ElementType.primitiveType | ElementType.stereotype) {

        super();

        if (!sourceElementType)
            throw 'TypeTransform sourceType cannot be null.';

        if (!targetElementType)
            throw 'TypeTransform targetType cannot be null.';

        if (sourceElementType === targetElementType) {
            // Warn but don't crash
            console.warn(`Invalid TypeTransform arguments: the source and target type are both of type '${ElementType[sourceElementType]}'.`);
        }

        this.sourceElementType = sourceElementType;
        this.targetElementType = targetElementType;
        this.sourceElementSelector = ElementTypeTransform.createTypeSelector(sourceElementType);
    }

    protected /* override */  transformElement(element: PackageableElement): void{
        if (!this.sourceElementSelector(element) || this.sourceElementType === this.targetElementType)
            return;

        // Note that we don't check compatibility of existing relationships here. For example, we don't check the types of Generalizations when
        // a Class that has generalizations is transformed to an Interface (that has the same generalizations).
        // The caller is responsible for transforming these generalizations as well.

        // Remove features that the type doesn't have
        // ElementTypeTransform.removeOldSourceFeatures(element, this.targetElementType); // todo: disabled as long as this does not seem to add any value.

        // Force the new elementType, even though it is readonly
        (element as any).elementType = this.targetElementType;
        // Now add features that the type needs
        ElementTypeTransform.addNewTargetFeatures(element, this.sourceElementType);
    }

    private static addNewTargetFeatures(transformedElement: Type, sourceElementType: ElementType): void {
        // Get access to the internal model ModelDelegate
        const modelDelegate: ModelDelegate = (transformedElement as any).modelDelegate;

        // Implement MemberedClassifier members
        if (isMemberedClassifier(transformedElement) && !ElementTypeUtility.isMemberedClassifier(sourceElementType)) {
            transformedElement.ownedAttributes = [];
            transformedElement.ownedOperations = [];
            transformedElement.getAllAttributes = () => { return modelDelegate.getAllAttributes(transformedElement) };
            transformedElement.getAllOperations = () => { return modelDelegate.getAllOperations(transformedElement) };
        }
        // Implement BehavioredClassifier members
        if (isBehavioredClassifier(transformedElement) && !ElementTypeUtility.isBehavioredClassifier(sourceElementType)) {
            transformedElement.interfaceRealizations = [];
        }
        // Implement Classifier members
        if (isClassifier(transformedElement) && !ElementTypeUtility.isClassifier(sourceElementType)) {
            transformedElement.generalizations = [];
            transformedElement.isAbstract = false;
            transformedElement.isFinalSpecialization = false;
            transformedElement.getAllParents = () => { return modelDelegate.getAllParents(transformedElement) };
            transformedElement.getAllSpecializations = () => { return modelDelegate.getAllSpecializations(transformedElement) };
            transformedElement.getFirstGeneralization = () => { return modelDelegate.getFirstGeneralization(transformedElement) };
            transformedElement.getFirstParent = () => { return modelDelegate.getFirstParent(transformedElement) };
            transformedElement.getParents = () => { return modelDelegate.getParents(transformedElement) };
            transformedElement.getSpecializations = () => { return modelDelegate.getSpecializations(transformedElement) };
            transformedElement.getSuperTypes = () => { return modelDelegate.getSuperTypes(transformedElement) };
        }
        // Implement Enumeration members
        if (isEnumeration(transformedElement) && !ElementTypeUtility.isEnumeration(sourceElementType)) {
            transformedElement.baseType = null;
            transformedElement.ownedLiterals = [];
        }
        // Implement Class members
        if (isClass(transformedElement) && !ElementTypeUtility.isClass(sourceElementType)) {
            transformedElement.isActive = true;
        }
        // Implement Stereotype members
        if (isStereotype(transformedElement) && !ElementTypeUtility.isStereotype(sourceElementType)) {
            transformedElement.extends = [];
            transformedElement.safeName = transformedElement.name; // sorry, it's not perfect
        }
    }

    private static removeOldSourceFeatures(unTransformedElement: Type, targetElementType: ElementType): void {
        // Remove MemberedClassifier members
        if (isMemberedClassifier(unTransformedElement) && !ElementTypeUtility.isMemberedClassifier(targetElementType)) {
            delete unTransformedElement.ownedAttributes;
            delete unTransformedElement.ownedOperations;
            delete unTransformedElement.getAllAttributes;
            delete unTransformedElement.getAllOperations;
        }
        // Remove BehavioredClassifier members
        if (isBehavioredClassifier(unTransformedElement) && !ElementTypeUtility.isBehavioredClassifier(targetElementType)) {
            delete unTransformedElement.interfaceRealizations;
        }
        // Remove Classifier members
        if (isClassifier(unTransformedElement) && !ElementTypeUtility.isClassifier(targetElementType)) {
            delete unTransformedElement.generalizations;
            delete unTransformedElement.isAbstract;
            delete unTransformedElement.isFinalSpecialization;
            delete unTransformedElement.getAllParents;
            delete unTransformedElement.getAllSpecializations;
            delete unTransformedElement.getFirstGeneralization;
            delete unTransformedElement.getFirstParent;
            delete unTransformedElement.getParents;
            delete unTransformedElement.getSpecializations;
            delete unTransformedElement.getSuperTypes;
        }
        // Remove Enumeration members
        if (isEnumeration(unTransformedElement) && !ElementTypeUtility.isEnumeration(targetElementType)) {
            delete unTransformedElement.baseType;
            delete unTransformedElement.ownedLiterals;
        }
        // Remove Class members
        if (isClass(unTransformedElement) && !ElementTypeUtility.isClass(targetElementType)) {
            delete unTransformedElement.isActive;
        }
        // Remove Stereotype members
        if (isStereotype(unTransformedElement) && !ElementTypeUtility.isStereotype(targetElementType)) {
            delete unTransformedElement.extends;
            delete unTransformedElement.safeName;
        }
    }

    private static createTypeSelector(elementType: ElementType): (t: PackageableElement) => t is Type {
        // Do a strict elementType comparison here
        return (t: PackageableElement): t is Type => { return t.elementType === elementType };

        // Alternatively, we could use the 'is...' functions to also include descendent types of elementType,
        // but this might be confusing.
        // switch (elementType) {
        //     case ElementType.class:
        //         return isClass;
        //     case ElementType.dataType:
        //         return isDataType;
        //     case ElementType.enumeration:
        //         return isEnumeration;
        //     case ElementType.interface:
        //         return isInterface;
        //     case ElementType.primitiveType:
        //         return isPrimitiveType;
        //     case ElementType.stereotype:
        //         return isStereotype;
        //     default:
        //         throw `Unsupported element type ${ElementType[elementType]}.`;
        // }
    }
}