/*
* Copyright (c) 2020 Yellicode
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/**
* This code was generated by a tool.
* 
* Changes to this file may cause incorrect behavior and will be lost if the code is regenerated.
*/
import * as elements from './interfaces';
import * as Data from './data-interfaces';

export interface ElementMap {
	addElement(element: elements.Element, elementData: Data.ElementData | null) : void;
	addSpecialization(generalId: string, specialization: elements.Classifier): void;
	removeSpecialization(generalId: string, specialization:  elements.Classifier): void;
	addAssociationByEndId(endId: string, association: elements.Association): void;
	removeAssociationByEndId(endId: string): void;
	getElementById<TElement extends elements.Element>(id: string | null): TElement | null;
	getElementsByIdList<TElement extends elements.Element>(idList: string[]): TElement[];
	getSpecializationsOf(generalId: string): elements.Classifier[];
	getAllSpecializationsOf(generalId: string): elements.Classifier[];
	getAssociationHavingMemberEnd(end: elements.Property): elements.Association | null;
}
