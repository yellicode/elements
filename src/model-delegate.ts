/*
 * Copyright (c) 2020 Yellicode
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import * as utils from './utils';
import * as Interfaces from "./interfaces";
import { ElementTypeUtility } from './utils';
import { ElementComparerImpl } from "./element-comparer";
import { ModelDelegate } from './model-delegate-interface';
import { ElementMap } from './element-map-interface';
import { UniqueId } from '@yellicode/core';
import { ElementFactory, FactoryClassMap, createdElement } from './element-factory';
import { Deletable } from './elements';

/**
 * Internal class to which all behaviour of the model classes is delegated.
 */
export class ModelDelegateImpl implements ModelDelegate {
    private elementFactory: ElementFactory;

    constructor(public elementMap: ElementMap | null) {
        // Note that elementMap is null when not initialized through the DataToModelConverter
        this.elementFactory = new ElementFactory(this);
    }


    // ************************  Document **************************** //

    public findElementById(id: string): Interfaces.Element | null {
        if (!this.elementMap) return null;

        return this.elementMap.getElementById(id);
    }

    // **************************  Element ******************************* //

    public getFirstCommentBody(element: Interfaces.Element): string {
        if (!element.ownedComments || element.ownedComments.length == 0)
            return '';  // return an empty string, no null or undefined, they are inconvenient when using template literals.

        return element.ownedComments[0].body;
    }

    // ************************  TypedElement **************************** //

    public getTypeName(typedElement: Interfaces.TypedElement): string {
        const t = typedElement.type;
        if (!t) return '';
        // If the type was deleted, return nothing
        if ((t as unknown as Deletable).isOrphaned()) return '';
        return t.name;
    }

    // *****************************  Package **************************** //
    public static getPackagedElementsWhere<TElement extends Interfaces.PackageableElement>(
        pack: Interfaces.Package,
        predicate: (element: Interfaces.PackageableElement) => boolean): TElement[] {

        if (!pack.packagedElements) return [];
        return pack.packagedElements.filter(predicate) as TElement[];
    }

    private static getAllPackagedElementsWhereRecursive<TElement extends Interfaces.PackageableElement>(
        pack: Interfaces.Package,
        predicate: (element: Interfaces.PackageableElement) => boolean, result: TElement[]): void {

        pack.packagedElements.forEach(e => {
            if (predicate(e)) {
                result.push(e as TElement);
            }
            if (ElementTypeUtility.isPackage(e.elementType) && (e as Interfaces.Package).packagedElements) {
                ModelDelegateImpl.getAllPackagedElementsWhereRecursive(e as Interfaces.Package, predicate, result);
            }
        })
    }

    public static getAllPackagedElementsWhere<TElement extends Interfaces.PackageableElement>(
        pack: Interfaces.Package,
        predicate: (element: Interfaces.PackageableElement) => boolean): TElement[] {

        const result: TElement[] = [];
        if (pack.packagedElements) {
            ModelDelegateImpl.getAllPackagedElementsWhereRecursive(pack, predicate, result);
        }
        return result;
    }

    public getNestedPackages(element: Interfaces.Package): Interfaces.Package[] {
        return ModelDelegateImpl.getPackagedElementsWhere<Interfaces.Package>(element, pe => pe.elementType === Interfaces.ElementType.package);
    }

    public getTypes(element: Interfaces.Package): Interfaces.Classifier[] {
        return ModelDelegateImpl.getPackagedElementsWhere<Interfaces.Classifier>(element, pe =>
            // Technically, an Association is also a Type, but it does not seem to make much sense here
            ElementTypeUtility.isType(pe.elementType) && !ElementTypeUtility.isAssociation(pe.elementType)
        );
    }

    public getAllTypes(element: Interfaces.Package): Interfaces.Classifier[] {
        return ModelDelegateImpl.getAllPackagedElementsWhere<Interfaces.Classifier>(element, pe =>
            // Technically, an Association is also a Type, but it does not seem to make much sense here
            ElementTypeUtility.isType(pe.elementType) && !ElementTypeUtility.isAssociation(pe.elementType));
    }

    public getClasses(element: Interfaces.Package): Interfaces.Class[] {
        return ModelDelegateImpl.getPackagedElementsWhere<Interfaces.Class>(element, pe => ElementTypeUtility.isClass(pe.elementType));
    }

    public getAllClasses(element: Interfaces.Package): Interfaces.Class[] {
        return ModelDelegateImpl.getAllPackagedElementsWhere<Interfaces.Class>(element, pe => ElementTypeUtility.isClass(pe.elementType));
    }

    public getInterfaces(element: Interfaces.Package): Interfaces.Interface[] {
        return ModelDelegateImpl.getPackagedElementsWhere<Interfaces.Interface>(element, pe => ElementTypeUtility.isInterface(pe.elementType));
    }

    public getAllInterfaces(element: Interfaces.Package): Interfaces.Interface[] {
        return ModelDelegateImpl.getAllPackagedElementsWhere<Interfaces.Interface>(element, pe => ElementTypeUtility.isInterface(pe.elementType));
    }

    public getDataTypes(element: Interfaces.Package): Interfaces.DataType[] {
        return ModelDelegateImpl.getPackagedElementsWhere<Interfaces.DataType>(element, pe => ElementTypeUtility.isDataType(pe.elementType));
    }

    public getAllDataTypes(element: Interfaces.Package): Interfaces.DataType[] {
        return ModelDelegateImpl.getAllPackagedElementsWhere<Interfaces.DataType>(element, pe => ElementTypeUtility.isDataType(pe.elementType));
    }

    public getEnumerations(element: Interfaces.Package): Interfaces.Enumeration[] {
        return ModelDelegateImpl.getPackagedElementsWhere<Interfaces.Enumeration>(element, pe => ElementTypeUtility.isEnumeration(pe.elementType));
    }

    public getAllEnumerations(element: Interfaces.Package): Interfaces.Enumeration[] {
        return ModelDelegateImpl.getAllPackagedElementsWhere<Interfaces.Enumeration>(element, pe => ElementTypeUtility.isEnumeration(pe.elementType));
    }


    // ************************  PackageableElement **************************** //

    public getPackage(packagedElement: Interfaces.PackageableElement): Interfaces.Package {
        return packagedElement.owner as Interfaces.Package;
    }

    /**
	* Gets all packages that own this Package, working inwards from the top Package to the owning package.
	* @returns {Interfaces.Package[]} A collection of Packages.
	*/
    public getNestingPackages(packagedElement: Interfaces.PackageableElement, stopAtNamespaceRoot?: boolean): Interfaces.Package[] {
        // Work outwards, then reverse..
        const result: Interfaces.Package[] = [];
        let owner = packagedElement.owner;
        while (owner && utils.isPackage(owner)) {
            result.push(owner);
            if (owner.isNamespaceRoot && stopAtNamespaceRoot === true) {
                break;
            }
            owner = owner.owner;
        }
        result.reverse();
        return result;
    }

    public getNamespaceName(packagedElement: Interfaces.PackageableElement, separator: string = '.'): string {
        return this.getNestingPackages(packagedElement, true).map(p => p.name).join(separator);
    }

    public getQualifiedName(packagedElement: Interfaces.PackageableElement, separator: string = '.'): string {
        const namespaceName = this.getNamespaceName(packagedElement, separator);
        return namespaceName ? `${namespaceName}${separator}${packagedElement.name}` : packagedElement.name;
    }

    // ************************  Generalization **************************** //

    public getSpecific(generalization: Interfaces.Generalization): Interfaces.Classifier {
        return generalization.owner as Interfaces.Classifier;
    }

    // **************************  Classifier ******************************* //

    public getFirstGeneralization(classifier: Interfaces.Classifier): Interfaces.Generalization | null {
        if (classifier.generalizations.length === 0) return null;
        return classifier.generalizations[0];
    }

    public getFirstParent(classifier: Interfaces.Classifier): Interfaces.Classifier | null {
        const firstGeneralization = this.getFirstGeneralization(classifier);
        return (firstGeneralization) ? firstGeneralization.general : null;
    }

    public getParents(classifier: Interfaces.Classifier): Interfaces.Classifier[] {
        return classifier.generalizations.map(g => g.general);
    }

    /**
    * Returns all of the direct and indirect ancestors of a generalized Classifier, working outwards: more specific classifiers will
    * appear before more general classifiers.
    */
    public getAllParents(classifier: Interfaces.Classifier): Interfaces.Classifier[] {
        const allParents: Interfaces.Classifier[] = [];
        this.getAllParentsRecursive(classifier, allParents);
        return allParents;
    }

    private getAllParentsRecursive(classifier: Interfaces.Classifier, allParents: Interfaces.Classifier[]) {
        const ownParents = this.getParents(classifier);
        if (ownParents != null) {
            // More specific parents first.
            ownParents.forEach(p => {
                const ix = allParents.indexOf(p);
                // If the parent is already there, remove it and add it again at the end of the list.
                if (ix > -1) {
                    allParents.splice(ix, 1);
                }
                allParents.push(p);
            });
            // add the parents of each parent
            ownParents.forEach(p => {
                this.getAllParentsRecursive(p, allParents);
            });
        }
    }

    public getSpecializations(classifier: Interfaces.Classifier): Interfaces.Classifier[] {
        if (!this.elementMap) return [];
        return this.elementMap.getSpecializationsOf(classifier.id);
    }

    public getAllSpecializations(classifier: Interfaces.Classifier): Interfaces.Classifier[] {
        if (!this.elementMap) return [];
        return this.elementMap.getAllSpecializationsOf(classifier.id);
    }

    // /**
    //  * Returns true if one classifier has the other as direct general.
    //  */
    // private static hasGeneral(x: Interfaces.Classifier, y: Interfaces.Classifier): boolean {
    //     // TODO: recursive?
    //     const firstMatch = x.generalizations.find(g => g.general.id === y.id);
    //     return firstMatch ? true: false;
    // }

    // ********************  MemberedClassifier **************************** //

    public getAllAttributes(memberedClassifier: Interfaces.MemberedClassifier): Interfaces.Property[] {
        const distinctClassifierIds: string[] = []; // keep this list to check against recursion
        const result: Interfaces.Property[] = [];
        this.getAllAttributesRecursive(memberedClassifier, distinctClassifierIds, result);
        return result;
    }

    private getAllAttributesRecursive(memberedClassifier: Interfaces.MemberedClassifier, distinctClassifierIds: string[], result: Interfaces.Property[]): void {
        distinctClassifierIds.push(memberedClassifier.id);
        // First add the general members, then the owned
        memberedClassifier.generalizations.forEach(g => {
            const general = g.general;
            if (distinctClassifierIds.indexOf(general.id) === -1) {
                this.getAllAttributesRecursive(general as Interfaces.MemberedClassifier, distinctClassifierIds, result);
            }
        });
        // Now add the owned members
        result.push(...memberedClassifier.ownedAttributes);
    }

    public getAllOperations(memberedClassifier: Interfaces.MemberedClassifier): Interfaces.Operation[] {
        const distinctClassifierIds: string[] = []; // keep this list to check against recursion
        const result: Interfaces.Operation[] = [];
        this.getAllOperationsRecursive(memberedClassifier, distinctClassifierIds, result);
        return result;
    }

    private getAllOperationsRecursive(memberedClassifier: Interfaces.MemberedClassifier, distinctClassifierIds: string[], result: Interfaces.Operation[]): void {
        distinctClassifierIds.push(memberedClassifier.id); // keep this list to check against recursion
        // First add the general members, then the owned
        memberedClassifier.generalizations.forEach(g => {
            const general = g.general;
            if (distinctClassifierIds.indexOf(general.id) === -1) {
                this.getAllOperationsRecursive(general as Interfaces.MemberedClassifier, distinctClassifierIds, result);
            }
        });
        // Now add the owned members. Replace any inherited members with the same signature
        memberedClassifier.ownedOperations.forEach(op => {
            // Is there an operation in the result that has the same signature? Then replace it.
            // TODO: can we set a "redefines" reference (referring to the base operation)?
            ModelDelegateImpl.removeItems(result, (baseOperation) => ElementComparerImpl.haveEqualSignatures(baseOperation, op));
            result.push(op);
        })
    }

    // ************************  Class  **************************** //
    public getSuperClasses<TClass extends Interfaces.Class>(cls: TClass): TClass[] {
        return this.getSuperTypes<TClass>(cls);
        // const result: TClass[] = [];
        // if (!cls.generalizations) return result;
        // cls.generalizations.forEach(g => {
        //     if (ElementTypeUtility.isClass(g.general.elementType)) {
        //         result.push(g.general as TClass);
        //     }
        // })
        // return result;
    }

    public getSuperTypes<T extends Interfaces.Classifier>(t: T): T[] {
        const result: T[] = [];
        if (!t.generalizations) return result;
        t.generalizations.forEach(g => {
            if ((g.general as unknown as Deletable).isOrphaned())
                return;
            if (g.general.elementType === t.elementType) {
                result.push(g.general as T);
            }
        })
        return result;
    }

    // ************************  MultiplicityElement **************************** //
    public getLower(element: Interfaces.MultiplicityElement | Interfaces.Operation): number | null {
        // If element is an operation, return the lower of the return parameter
        const multiplicityElement = element.elementType === Interfaces.ElementType.operation ?
            (element as Interfaces.Operation).getReturnParameter() :
            element as Interfaces.MultiplicityElement;

        if (!multiplicityElement) return null; // the operation has no return parameter
        const lowerValue = multiplicityElement.lowerValue;
        if (!lowerValue) return null;
        switch (lowerValue.elementType) {
            case Interfaces.ElementType.literalInteger:
                return (lowerValue as Interfaces.LiteralInteger).value;
            case Interfaces.ElementType.literalString:
                const stringValue = lowerValue.getStringValue();
                const parsed = Number.parseInt(stringValue);
                return isNaN(parsed) ? null : parsed;
            default:
                return null;
        }
    }

    public getUpper(element: Interfaces.MultiplicityElement | Interfaces.Operation): Interfaces.UnlimitedNatural | null {
        // If element is an operation, return the upper of the return parameter
        const multiplicityElement = element.elementType === Interfaces.ElementType.operation ?
            (element as Interfaces.Operation).getReturnParameter() :
            element as Interfaces.MultiplicityElement;

        if (!multiplicityElement) return null; // the operation has no return parameter

        const upperValue = multiplicityElement.upperValue;
        if (upperValue == null)
            return null;

        switch (upperValue.elementType) {
            case Interfaces.ElementType.literalString:
            case Interfaces.ElementType.literalInteger:
                const stringValue = upperValue.getStringValue();
                return new Interfaces.UnlimitedNatural(stringValue);
            case Interfaces.ElementType.literalUnlimitedNatural:
                return (upperValue as Interfaces.LiteralUnlimitedNatural).value;
            default:
                return null;
        }
    }

    public getLowerBound(element: Interfaces.MultiplicityElement | Interfaces.Operation): number {
        const lower = this.getLower(element);
        // Do an explicit null check, allowing for 0. An unspecified lower means a lower bound of 1.
        return (lower === null) ? 1 : lower;
    }

    public getUpperBound(element: Interfaces.MultiplicityElement | Interfaces.Operation): Interfaces.UnlimitedNatural {
        const upper = this.getUpper(element);
        // Do an explicit null check, allowing for 0. An unspecified upper means an upper bound of 1.
        return (upper === null) ? new Interfaces.UnlimitedNatural(1) : upper;
    }

    public isMultivalued(element: Interfaces.MultiplicityElement | Interfaces.Operation): boolean {
        const upper = this.getUpper(element);
        if (!upper) return false;
        return upper.IsInfinity || upper.Value! > 1;
    }

    public isOptional(element: Interfaces.MultiplicityElement | Interfaces.Operation): boolean {
        return this.getLowerBound(element) === 0;
    }

    public isOptionalAndSinglevalued(element: Interfaces.MultiplicityElement | Interfaces.Operation): boolean {
        if (this.getLowerBound(element) !== 0)
            return false; // not optional

        const upper = this.getUpperBound(element);
        return !upper.IsInfinity && upper.Value === 1;
    }

    public isRequiredAndSinglevalued(element: Interfaces.MultiplicityElement | Interfaces.Operation): boolean {
        if (this.getLowerBound(element) !== 1)
            return false; // not required

        const upper = this.getUpperBound(element);
        return !upper.IsInfinity && upper.Value === 1;
    }

    // ********************  Default values **************************** //
    public getDefault(hasDefaultValue: { defaultValue: Interfaces.ValueSpecification | null }): any | null {
        if (!hasDefaultValue.defaultValue) return null;
        return this.getValue(hasDefaultValue.defaultValue);
    }

    // ********************  ValueSpecification **************************** //
    public getValue(valueSpecification: Interfaces.ValueSpecification): any | null {
        if ("value" in valueSpecification) { // don't use hasOwnProperty here
            // The valueSpecification is a LiteralInteger, LiteralBoolean, etc.
            return (valueSpecification as any)["value"];
        }
        else return null; // The valueSpecification is a LiteralNull or an unsupported implementation
    }

    public getStringValue(valueSpecification: Interfaces.ValueSpecification): any | null {
        const rawValue = valueSpecification.getValue();
        if (rawValue === null)
            return null;

        if (valueSpecification.elementType === Interfaces.ElementType.literalUnlimitedNatural) {
            return (rawValue as Interfaces.UnlimitedNatural).stringValue();
        }

        return rawValue.toString();
    }

    // ********************  EnumerationLiteral **************************** //
    public getEnumeration(literal: Interfaces.EnumerationLiteral): Interfaces.Enumeration {
        return literal.owner as Interfaces.Enumeration;
    }

    public getSpecificationValue(literal: Interfaces.EnumerationLiteral): any | null {
        if (!literal.specification) return null;
        return this.getValue(literal.specification);
    }

    // ********************  Property **************************** //
    public getAssociation(property: Interfaces.Property): Interfaces.Association | null {
        // The property can be owned by an association (association.ownedEnds) or by a classifier
        // If owned by an association, the path is short.
        if (utils.isAssociation(property.owner)) {
            return property.owner;
        }
        // The property is not owned by an association, but can still be part of one
        // (association.memberEnds)
        if (!this.elementMap) return null;
        return this.elementMap.getAssociationHavingMemberEnd(property);
    }

    // ********************  Operation **************************** //
    public getReturnParameter(operation: Interfaces.Operation): Interfaces.Parameter | null {
        const val = operation.ownedParameters.find(p => { return p.direction === Interfaces.ParameterDirectionKind.return });
        return val || null;
    }

    public getInputParameters(operation: Interfaces.Operation): Interfaces.Parameter[] {
        return operation.ownedParameters.filter(p => {
            return p.direction === Interfaces.ParameterDirectionKind.in
                || p.direction === Interfaces.ParameterDirectionKind.inout
        });
    }

    public getOutputParameters(operation: Interfaces.Operation): Interfaces.Parameter[] {
        return operation.ownedParameters.filter(p => {
            return p.direction === Interfaces.ParameterDirectionKind.out
                || p.direction === Interfaces.ParameterDirectionKind.inout
                || p.direction === Interfaces.ParameterDirectionKind.return
        });
    }

    public getReturnType(operation: Interfaces.Operation): Interfaces.Type | null {
        const returnParameter = this.getReturnParameter(operation);
        return returnParameter ? returnParameter.type : null;
    }

    // ********************  Factory functions  **************************** //
    private createValueSpecificationFromValue(value: boolean | number | string, owner: Interfaces.Element): Interfaces.ValueSpecification {
        switch (typeof (value)) {
            case 'number':
                const int = this.elementFactory.create('literalInteger', owner);
                int.value = value;
                return int;
            case 'string':
                const str = this.elementFactory.create('literalString', owner);
                str.value = value;
                return str;
            case 'boolean':
                const b = this.elementFactory.create('literalBoolean', owner);
                b.value = value;
                return b;
            default:
                throw `Cannot create ValueSpecification from value of type '${typeof (value)}'.`;
        }
    }

    public createElement<K extends keyof FactoryClassMap>(elementType: K, owner: Interfaces.Element | null, properties: any | null, initFn: ((element: createdElement<K>) => void) | null): createdElement<K> {
        let e = this.elementFactory.create(elementType, owner);

        if (properties) Object.assign(e, properties);

        // Ensure a ID
        if (!e.id && ElementFactory.requiresId(elementType)) {
            let exists = true;
            do {
                e.id = UniqueId.create(6);
                exists = this.elementMap!.getElementById(e.id) != null;
            }
            while (exists);
        }

        // Initialize
        if (initFn) initFn(e);

        // Index
        if (e.id) {
            this.elementMap!.addElement(e, null);
        }
        return e;
    }

    /**
    * Notifies the delegate that a property was added as member end to an association.
    */
    public onMemberEndAdded(association: Interfaces.Association, end: Interfaces.Property): void {
        this.elementMap!.addAssociationByEndId(end.id, association);
    }

    /**
	* Notifies the delegate that a generalization was added.
	*/
    public onGeneralizationAdded(generalization: Interfaces.Generalization): void {
        if (!utils.isClassifier(generalization.owner))
            return;

        // generalization is a Generalization of classifier, so classifier is a Specialization of generalization.general.
        this.elementMap!.addSpecialization(generalization.general.id, generalization.owner);
    }

    /**
	* Notifies the delegate that a an element was added to a collection.
	*/
    public onElementAdded(owner: Interfaces.Element, element: Interfaces.Element): void {
        switch (element.elementType) {
            case Interfaces.ElementType.generalization:
                this.onGeneralizationAdded(element as Interfaces.Generalization);
                break;
            case Interfaces.ElementType.property:
                if (utils.isAssociation(owner)) {
                    this.onMemberEndAdded(owner, element as Interfaces.Property);
                }
                break;
        }
    }

	/**
	* Notifies the delegate that a owned element was deleted from a collection.
	*/
    public onElementDeleted(owner: Interfaces.Element, element: Interfaces.Element): void {
        switch (element.elementType) {
            case Interfaces.ElementType.generalization:
                const generalization = element as Interfaces.Generalization;
                this.elementMap!.removeSpecialization(generalization.general.id, generalization.owner as Interfaces.Classifier);
                break;
            case Interfaces.ElementType.property:
                if (utils.isAssociation(owner)) {
                    this.elementMap!.removeAssociationByEndId(element.id);
                }
                break;
        }
    }

    /**
	* Sets the default value of the element to the specified value.
	*/
    public setDefaultValue(hasDefaultValue: Interfaces.Element & { defaultValue: Interfaces.ValueSpecification | null }, value: boolean | number | string): void {
        if (!value) return;

        hasDefaultValue.defaultValue = this.createValueSpecificationFromValue(value, hasDefaultValue);
    }

	/**
	* Sets the default value of the element to null.
	*/
    public setDefaultValueNull(hasDefaultValue: Interfaces.Element & { defaultValue: Interfaces.ValueSpecification | null }): void {
        hasDefaultValue.defaultValue = this.elementFactory.create('literalNull', hasDefaultValue);
    }

	/**
	* Sets the lower value of the element to unlimited.
	*/
    public setLowerValueUnlimited(element: Interfaces.MultiplicityElement): void {
        const literalUnlimited = this.elementFactory.create('literalUnlimitedNatural', element);
        literalUnlimited.value = new Interfaces.UnlimitedNatural('*');
        element.lowerValue = literalUnlimited;
    }

	/**
	* Sets the lower value of the element to the specified integer.
	*/
    public setLowerValue(element: Interfaces.MultiplicityElement, value: number): void {
        element.lowerValue = this.createValueSpecificationFromValue(value, element);
    }

	/**
	* Sets the upper value of the element to unlimited.
	*/
    public setUpperValueUnlimited(element: Interfaces.MultiplicityElement): void {
        const literalUnlimited = this.elementFactory.create('literalUnlimitedNatural', element);
        literalUnlimited.value = new Interfaces.UnlimitedNatural('*');
        element.upperValue = literalUnlimited;
    }

	/**
	* Sets the upper value of the element to the specified integer.
	*/
    public setUpperValue(element: Interfaces.MultiplicityElement, value: number): void {
        element.upperValue = this.createValueSpecificationFromValue(value, element);
    }

	/**
	* Sets the enumeration literal to the specified value.
	*/
    public setSpecification(element: Interfaces.EnumerationLiteral, value: number | string): void {
        element.specification = this.createValueSpecificationFromValue(value, element);
    }

    private static removeItems<T>(array: T[], predicate: (item: T) => any): void {
        if (!array.length)
            return;

        const indices: number[] = [];
        // Create a reverse array of indices, then remove them in that order.
        for (let i = array.length - 1; i > -1; i--) {
            if (predicate(array[i]))
                indices.push(i);
        }

        indices.forEach(i => {
            array.splice(i, 1);
        });
    }

}