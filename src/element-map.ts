/*
 * Copyright (c) 2018 Yellicode
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import * as Interfaces from "./interfaces";
import * as Data from "./data-interfaces";
import { ElementTypeUtility } from './utils';

export class ElementMap {
    private elementsById: { [key: string]: Interfaces.Element } = {};
    private specializationsById: { [generalId: string]: Interfaces.Classifier[] } = {};

    public addElement(element: Interfaces.Element, elementData: Data.ElementData | null) {
        if (this.elementsById.hasOwnProperty(element.id)) {
            console.warn(`Duplicate element id '${element.id}'.`);
            return;
        }
        this.elementsById[element.id] = element;

        // Add generalizations to the specialization map
        if (ElementTypeUtility.isClassifier(element.elementType) && elementData) {
            this.addSpecializations(element as Interfaces.Classifier, elementData as Data.ClassifierData);
        }
    }

    private addSpecializations(classifier: Interfaces.Classifier, classifierData: Data.ClassifierData) {
        if (!classifierData.generalizations)
            return;

        // Enumerate the classifierData instead of the classifier itself: the generalizations will not be set here as they are not resolved yet
        classifierData.generalizations.forEach(g => {
            let dictionaryEntry;

            // g is a Generalization of element, so element is a Specialization of g
            if (this.specializationsById.hasOwnProperty(g.general)) {
                dictionaryEntry = this.specializationsById[g.general];
                dictionaryEntry.push(classifier);
            } else {
                this.specializationsById[g.general] = [classifier];
            }
        });
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
            console.warn(`Unkown element id '${id}'.`);
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
            if (!specialMap.hasOwnProperty(s.id)) {
                specialMap[s.id] = s;
            }
            // Get the specializations of this specialization
            this.getAllSpecializationsRecursive(s.id, specialMap);
        });
    }
} 