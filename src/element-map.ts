/*
 * Copyright (c) 2020 Yellicode
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import * as Interfaces from "./interfaces";
import * as Data from "./data-interfaces";
import { ElementTypeUtility } from './utils';
import { primitiveBooleanType, primitiveIntegerType, primitiveStringType, primitiveRealType, primitiveObjectType } from './primitives';
import { ElementMap } from './element-map-interface';
import { Deletable } from './editable-interfaces';

export class ElementMapImpl implements ElementMap {
    private elementsById: { [key: string]: Interfaces.Element } = {};
    private specializationsById: { [generalId: string]: Interfaces.Classifier[] } = {};
    private associationsByEndId: { [endId: string]: Interfaces.Association } = {};

    constructor(initializeWithPrimitives: boolean) {
        if (!initializeWithPrimitives) return;
        this.addElement(primitiveBooleanType, null);
        this.addElement(primitiveIntegerType, null);
        this.addElement(primitiveStringType, null);
        this.addElement(primitiveRealType, null);
        this.addElement(primitiveObjectType, null);
        // TODO: do we need UnlimitedNatural? If so, it should be exported by './primitives'.
    }

    public addElement(element: Interfaces.Element, elementData: Data.ElementData | null) {
        if (this.elementsById.hasOwnProperty(element.id)) {
            console.warn(`Duplicate element id '${element.id}'.`);
            return;
        }
        this.elementsById[element.id] = element;

        // TODO: the elementData argument and the lines below should be removed
        // once the DataToModelConverter is replaced by the ModelSerializer.

        // Add generalizations to the specialization map
        if (ElementTypeUtility.isClassifier(element.elementType) && elementData) {
            this.addSpecializations(element as Interfaces.Classifier, elementData as Data.ClassifierData);
        }
        // Add association ends to the assciationEnd map
        if (ElementTypeUtility.isAssociation(element.elementType) && elementData) {
            this.addAssociationEnds(element as Interfaces.Association, elementData as Data.AssociationData);
        }
    }

    private addAssociationEnds(association: Interfaces.Association, associationData: Data.AssociationData) {
        // Get memberEnds of assocationData instead of association itself: the ends  will not be set here as they are not resolved yet
        // by DataToModelConverter.resolveAssociationReferences().
        if (!associationData.memberEnds)
            return;

        associationData.memberEnds.forEach(endId => {
            // An association end can only be part of one association.
            this.addAssociationByEndId(endId, association);
        })
    }

    public addAssociationByEndId(endId: string, association: Interfaces.Association): void {
        // An association end can only be part of one association.
        if (this.associationsByEndId.hasOwnProperty(endId)) {
            console.warn(`Association end with id '${endId}' is already part of another association than ${association.id}.`);
        }
        this.associationsByEndId[endId] = association;
    }

    public removeAssociationByEndId(endId: string): void {
        delete this.associationsByEndId[endId];
    }

    private addSpecializations(classifier: Interfaces.Classifier, classifierData: Data.ClassifierData) {
        if (!classifierData.generalizations)
            return;

        // Enumerate the classifierData instead of the classifier itself: the generalizations will not be set here as they are not resolved yet
        classifierData.generalizations.forEach(g => {
            // g is a Generalization of element, so element is a Specialization of g
            this.addSpecialization(g.general, classifier);
            // if (this.specializationsById.hasOwnProperty(g.general)) {
            //     dictionaryEntry = this.specializationsById[g.general];
            //     dictionaryEntry.push(classifier);
            // } else {
            //     this.specializationsById[g.general] = [classifier];
            // }
        });
    }

    public addSpecialization(generalId: string, specialization: Interfaces.Classifier): void {
        let dictionaryEntry;
        if (this.specializationsById.hasOwnProperty(generalId)) {
            dictionaryEntry = this.specializationsById[generalId];
            dictionaryEntry.push(specialization);
        } else {
            this.specializationsById[generalId] = [specialization];
        }
    }

    public removeSpecialization(generalId: string, specialization: Interfaces.Classifier): void {
        if (!this.specializationsById.hasOwnProperty(generalId))
            return;

        const dictionaryEntry = this.specializationsById[generalId];
        const ix = dictionaryEntry.indexOf(specialization);
        if (ix > -1) dictionaryEntry.splice(ix, 1);
    }

    // public removeGeneral(generalId: string): void {
    //     if (!this.specializationsById.hasOwnProperty(generalId))
    //         return;

    //     // First remove the general from all it's specializations
    //     const dictionaryEntry = this.specializationsById[generalId];
    //     dictionaryEntry.forEach(specialization => {
    //         const ix = specialization.generalizations.findIndex(g => g.general.id === generalId);
    //         if (ix > -1)
    //             specialization.generalizations.splice(ix, 1);
    //     })
    //     // Then remove from the map entirely
    //     delete this.specializationsById[generalId];
    // }

    public getAssociationHavingMemberEnd(end: Interfaces.Property): Interfaces.Association | null {
        if (!end || !end.id) return null;
        if (!this.associationsByEndId.hasOwnProperty(end.id)) return null;
        return this.associationsByEndId[end.id];
    }

    public hasElement(id: string): boolean {
        return this.elementsById.hasOwnProperty(id);
    }

    public getElementById<TElement extends Interfaces.Element>(id: string | null): TElement | null {
        if (!id || id.length === 0)
            return null;

        if (this.elementsById.hasOwnProperty(id))
            return this.elementsById[id] as TElement;
        else {
            // console.warn(`Unkown element id '${id}'.`);
            return null;
        }
    }

    public getElementsByIdList<TElement extends Interfaces.Element>(idList: string[]): TElement[] {
        const result: TElement[] = [];

        if (idList == null)
            return result;

        idList.forEach((id: string) => {
            const element = this.getElementById<TElement>(id);
            if (element != null) result.push(element);
        });
        return result;
    }

    public getSpecializationsOf(generalId: string): Interfaces.Classifier[] {
        if (!this.specializationsById.hasOwnProperty(generalId))
            return [];

        return this.specializationsById[generalId];
    }

    public getAllSpecializationsOf(generalId: string): Interfaces.Classifier[] {
        if (!this.specializationsById.hasOwnProperty(generalId))
            return [];

        const specialMap: { [specializationId: string]: Interfaces.Classifier } = {};
        this.getAllSpecializationsRecursive(generalId, specialMap);

        // Convert the result to an array
        const result: Interfaces.Classifier[] = [];
        for (var specializationId in specialMap) {
            result.push(specialMap[specializationId]);
        }
        return result;
    }

    private getAllSpecializationsRecursive(generalId: string, specialMap: { [specialId: string]: Interfaces.Classifier }): void {
        if (!this.specializationsById.hasOwnProperty(generalId)) {
            return;
        }
        const directSpecializations = this.specializationsById[generalId];
        directSpecializations.forEach(s => {
            if (!specialMap.hasOwnProperty(s.id) &&
                !(s as unknown as Deletable).isOrphaned()) {
                specialMap[s.id] = s;
            }
            // Get the specializations of this specialization
            this.getAllSpecializationsRecursive(s.id, specialMap);
        });
    }
}